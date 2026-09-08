use crate::domain::server_role::{
    RoleCapabilities, ServerRole, DONO_POSITION, DONO_ROLE_NAME, NO_ROLE_POSITION,
};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    server_id: String,
    name: String,
    can_create_channels: i64,
    can_view_channels: i64,
    can_manage_channels: i64,
    can_manage_roles: i64,
    can_create_invites: i64,
    can_send_messages: i64,
    can_delete_messages: i64,
    can_attach_files: i64,
    can_remove_members: i64,
    can_mute_members: i64,
    can_connect_voice: i64,
    can_speak_voice: i64,
    is_system: i64,
    position: i64,
}

const SELECT_COLS: &str = "id, server_id, name, can_create_channels,
    can_view_channels, can_manage_channels, can_manage_roles, can_create_invites,
    can_send_messages, can_delete_messages, can_attach_files, can_remove_members,
    can_mute_members, can_connect_voice, can_speak_voice, is_system, position";

fn map_row(row: Row, member_ids: Vec<Uuid>) -> Result<ServerRole, sqlx::Error> {
    let manage = row.can_manage_channels != 0 || row.can_create_channels != 0;
    let caps = RoleCapabilities {
        can_view_channels: row.can_view_channels != 0,
        can_manage_channels: manage,
        can_manage_roles: row.can_manage_roles != 0,
        can_create_invites: row.can_create_invites != 0,
        can_send_messages: row.can_send_messages != 0,
        can_delete_messages: row.can_delete_messages != 0,
        can_attach_files: row.can_attach_files != 0,
        can_remove_members: row.can_remove_members != 0,
        can_mute_members: row.can_mute_members != 0,
        can_connect_voice: row.can_connect_voice != 0,
        can_speak_voice: row.can_speak_voice != 0,
    };
    Ok(ServerRole {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        server_id: Uuid::parse_str(&row.server_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        name: row.name,
        can_create_channels: manage,
        capabilities: caps,
        is_system: row.is_system != 0,
        position: row.position,
        member_ids,
    })
}

async fn member_ids_for(pool: &SqlitePool, role_id: &str) -> Result<Vec<Uuid>, sqlx::Error> {
    let member_rows: Vec<(String,)> = sqlx::query_as(
        "SELECT account_id FROM server_role_member WHERE role_id = ? ORDER BY account_id",
    )
    .bind(role_id)
    .fetch_all(pool)
    .await?;
    member_rows
        .into_iter()
        .map(|(id,)| Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e))))
        .collect()
}

pub async fn next_bottom_position(pool: &SqlitePool, server_id: Uuid) -> Result<i64, sqlx::Error> {
    let row: Option<(Option<i64>,)> = sqlx::query_as(
        "SELECT MIN(position) FROM server_role WHERE server_id = ? AND is_system = 0",
    )
    .bind(server_id.to_string())
    .fetch_optional(pool)
    .await?;
    Ok(match row.and_then(|(m,)| m) {
        Some(min) => min - 1,
        None => 10, // first non-Dono role sits above NO_ROLE_POSITION (-1)
    })
}

pub async fn create(pool: &SqlitePool, role: &ServerRole) -> Result<(), sqlx::Error> {
    let c = &role.capabilities;
    let manage = c.can_manage_channels || role.can_create_channels;
    let position = if role.is_system {
        DONO_POSITION
    } else if role.position != 0 {
        role.position
    } else {
        next_bottom_position(pool, role.server_id).await?
    };
    sqlx::query(
        "INSERT INTO server_role (
            id, server_id, name, can_create_channels,
            can_view_channels, can_manage_channels, can_manage_roles, can_create_invites,
            can_send_messages, can_delete_messages, can_attach_files, can_remove_members,
            can_mute_members, can_connect_voice, can_speak_voice, is_system, position, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(role.id.to_string())
    .bind(role.server_id.to_string())
    .bind(role.name.trim())
    .bind(if manage { 1 } else { 0 })
    .bind(if c.can_view_channels { 1 } else { 0 })
    .bind(if manage { 1 } else { 0 })
    .bind(if c.can_manage_roles { 1 } else { 0 })
    .bind(if c.can_create_invites { 1 } else { 0 })
    .bind(if c.can_send_messages { 1 } else { 0 })
    .bind(if c.can_delete_messages { 1 } else { 0 })
    .bind(if c.can_attach_files { 1 } else { 0 })
    .bind(if c.can_remove_members { 1 } else { 0 })
    .bind(if c.can_mute_members { 1 } else { 0 })
    .bind(if c.can_connect_voice { 1 } else { 0 })
    .bind(if c.can_speak_voice { 1 } else { 0 })
    .bind(if role.is_system { 1 } else { 0 })
    .bind(position)
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list_by_server(
    pool: &SqlitePool,
    server_id: Uuid,
) -> Result<Vec<ServerRole>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(&format!(
        "SELECT {SELECT_COLS} FROM server_role WHERE server_id = ? ORDER BY position DESC, name"
    ))
    .bind(server_id.to_string())
    .fetch_all(pool)
    .await?;
    let mut roles = Vec::with_capacity(rows.len());
    for row in rows {
        let member_ids = member_ids_for(pool, &row.id).await?;
        roles.push(map_row(row, member_ids)?);
    }
    Ok(roles)
}

pub async fn find_by_id(
    pool: &SqlitePool,
    role_id: Uuid,
) -> Result<Option<ServerRole>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(&format!(
        "SELECT {SELECT_COLS} FROM server_role WHERE id = ?"
    ))
    .bind(role_id.to_string())
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(None);
    };
    let member_ids = member_ids_for(pool, &row.id).await?;
    Ok(Some(map_row(row, member_ids)?))
}

pub async fn find_system_dono(
    pool: &SqlitePool,
    server_id: Uuid,
) -> Result<Option<ServerRole>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(&format!(
        "SELECT {SELECT_COLS} FROM server_role
         WHERE server_id = ? AND (is_system = 1 OR name = ?)
         ORDER BY is_system DESC, created_at ASC
         LIMIT 1"
    ))
    .bind(server_id.to_string())
    .bind(DONO_ROLE_NAME)
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(None);
    };
    let member_ids = member_ids_for(pool, &row.id).await?;
    Ok(Some(map_row(row, member_ids)?))
}

pub async fn ensure_dono_role(
    pool: &SqlitePool,
    server_id: Uuid,
    owner_account_id: Uuid,
) -> Result<ServerRole, sqlx::Error> {
    let caps = RoleCapabilities::owner_all();
    let role = if let Some(existing) = find_system_dono(pool, server_id).await? {
        sqlx::query(
            "UPDATE server_role SET
                name = ?,
                is_system = 1,
                position = ?,
                can_create_channels = 1,
                can_view_channels = 1,
                can_manage_channels = 1,
                can_manage_roles = 1,
                can_create_invites = 1,
                can_send_messages = 1,
                can_delete_messages = 1,
                can_attach_files = 1,
                can_remove_members = 1,
                can_mute_members = 1,
                can_connect_voice = 1,
                can_speak_voice = 1
             WHERE id = ?",
        )
        .bind(DONO_ROLE_NAME)
        .bind(DONO_POSITION)
        .bind(existing.id.to_string())
        .execute(pool)
        .await?;
        find_by_id(pool, existing.id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?
    } else {
        let role = ServerRole {
            id: Uuid::new_v4(),
            server_id,
            name: DONO_ROLE_NAME.to_string(),
            can_create_channels: true,
            capabilities: caps,
            is_system: true,
            position: DONO_POSITION,
            member_ids: Vec::new(),
        };
        create(pool, &role).await?;
        role
    };
    set_member_role(pool, server_id, owner_account_id, Some(role.id)).await?;
    find_by_id(pool, role.id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)
}

pub async fn backfill_dono_for_all_servers(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let rows: Vec<(String, String)> =
        sqlx::query_as("SELECT id, owner_account_id FROM server").fetch_all(pool).await?;
    for (server_id, owner_id) in rows {
        let server_id = Uuid::parse_str(&server_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
        let owner_id = Uuid::parse_str(&owner_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
        ensure_dono_role(pool, server_id, owner_id).await?;
    }
    Ok(())
}

pub async fn update_full(
    pool: &SqlitePool,
    role_id: Uuid,
    name: Option<&str>,
    caps: &RoleCapabilities,
) -> Result<bool, sqlx::Error> {
    let manage = caps.can_manage_channels;
    let result = sqlx::query(
        "UPDATE server_role SET
            name = COALESCE(?, name),
            can_create_channels = ?,
            can_view_channels = ?,
            can_manage_channels = ?,
            can_manage_roles = ?,
            can_create_invites = ?,
            can_send_messages = ?,
            can_delete_messages = ?,
            can_attach_files = ?,
            can_remove_members = ?,
            can_mute_members = ?,
            can_connect_voice = ?,
            can_speak_voice = ?
         WHERE id = ?",
    )
    .bind(name.map(str::trim))
    .bind(if manage { 1 } else { 0 })
    .bind(if caps.can_view_channels { 1 } else { 0 })
    .bind(if manage { 1 } else { 0 })
    .bind(if caps.can_manage_roles { 1 } else { 0 })
    .bind(if caps.can_create_invites { 1 } else { 0 })
    .bind(if caps.can_send_messages { 1 } else { 0 })
    .bind(if caps.can_delete_messages { 1 } else { 0 })
    .bind(if caps.can_attach_files { 1 } else { 0 })
    .bind(if caps.can_remove_members { 1 } else { 0 })
    .bind(if caps.can_mute_members { 1 } else { 0 })
    .bind(if caps.can_connect_voice { 1 } else { 0 })
    .bind(if caps.can_speak_voice { 1 } else { 0 })
    .bind(role_id.to_string())
    .execute(pool)
    .await?;
    Ok(result.rows_affected() != 0)
}

pub async fn update(
    pool: &SqlitePool,
    role_id: Uuid,
    name: Option<&str>,
    can_create_channels: Option<bool>,
) -> Result<bool, sqlx::Error> {
    let Some(existing) = find_by_id(pool, role_id).await? else {
        return Ok(false);
    };
    let mut caps = existing.capabilities;
    if let Some(v) = can_create_channels {
        caps.can_manage_channels = v;
    }
    update_full(pool, role_id, name, &caps).await
}

pub async fn set_positions(
    pool: &SqlitePool,
    server_id: Uuid,
    updates: &[(Uuid, i64)],
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    for (role_id, position) in updates {
        sqlx::query(
            "UPDATE server_role SET position = ? WHERE id = ? AND server_id = ? AND is_system = 0",
        )
        .bind(position)
        .bind(role_id.to_string())
        .bind(server_id.to_string())
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await
}

pub async fn delete(pool: &SqlitePool, role_id: Uuid) -> Result<bool, sqlx::Error> {
    let mut tx = pool.begin().await?;
    sqlx::query("DELETE FROM channel_acl WHERE subject_type = 'role' AND subject_id = ?")
        .bind(role_id.to_string())
        .execute(&mut *tx)
        .await?;
    let result = sqlx::query("DELETE FROM server_role WHERE id = ?")
        .bind(role_id.to_string())
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(result.rows_affected() != 0)
}

pub async fn set_members(
    pool: &SqlitePool,
    role_id: Uuid,
    member_ids: &[Uuid],
) -> Result<(), sqlx::Error> {
    let role = find_by_id(pool, role_id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)?;
    let server_id = role.server_id;
    let mut tx = pool.begin().await?;
    sqlx::query("DELETE FROM server_role_member WHERE role_id = ?")
        .bind(role_id.to_string())
        .execute(&mut *tx)
        .await?;
    for account_id in member_ids {
        sqlx::query("DELETE FROM server_role_member WHERE server_id = ? AND account_id = ?")
            .bind(server_id.to_string())
            .bind(account_id.to_string())
            .execute(&mut *tx)
            .await?;
        sqlx::query(
            "INSERT INTO server_role_member (role_id, account_id, server_id) VALUES (?, ?, ?)",
        )
        .bind(role_id.to_string())
        .bind(account_id.to_string())
        .bind(server_id.to_string())
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await
}

pub async fn set_member_role(
    pool: &SqlitePool,
    server_id: Uuid,
    account_id: Uuid,
    role_id: Option<Uuid>,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    sqlx::query("DELETE FROM server_role_member WHERE server_id = ? AND account_id = ?")
        .bind(server_id.to_string())
        .bind(account_id.to_string())
        .execute(&mut *tx)
        .await?;
    if let Some(role_id) = role_id {
        sqlx::query(
            "INSERT INTO server_role_member (role_id, account_id, server_id) VALUES (?, ?, ?)",
        )
        .bind(role_id.to_string())
        .bind(account_id.to_string())
        .bind(server_id.to_string())
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await
}

pub async fn role_id_for_account(
    pool: &SqlitePool,
    server_id: Uuid,
    account_id: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
    let row: Option<(String,)> = sqlx::query_as(
        "SELECT role_id FROM server_role_member WHERE server_id = ? AND account_id = ? LIMIT 1",
    )
    .bind(server_id.to_string())
    .bind(account_id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(|(id,)| Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e))))
        .transpose()
}

pub async fn position_for_account(
    pool: &SqlitePool,
    server_id: Uuid,
    account_id: Uuid,
) -> Result<i64, sqlx::Error> {
    let Some(role_id) = role_id_for_account(pool, server_id, account_id).await? else {
        return Ok(NO_ROLE_POSITION);
    };
    let Some(role) = find_by_id(pool, role_id).await? else {
        return Ok(NO_ROLE_POSITION);
    };
    Ok(role.position)
}

pub async fn account_has_can_create(
    pool: &SqlitePool,
    server_id: Uuid,
    account_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let (exists,): (i64,) = sqlx::query_as(
        "SELECT EXISTS(
           SELECT 1 FROM server_role sr
           JOIN server_role_member srm ON srm.role_id = sr.id
           WHERE sr.server_id = ? AND srm.account_id = ?
             AND (sr.can_create_channels = 1 OR sr.can_manage_channels = 1)
         )",
    )
    .bind(server_id.to_string())
    .bind(account_id.to_string())
    .fetch_one(pool)
    .await?;
    Ok(exists != 0)
}

pub async fn aggregated_caps(
    pool: &SqlitePool,
    server_id: Uuid,
    account_id: Uuid,
) -> Result<RoleCapabilities, sqlx::Error> {
    let Some(role_id) = role_id_for_account(pool, server_id, account_id).await? else {
        return Ok(RoleCapabilities::open_defaults());
    };
    let Some(role) = find_by_id(pool, role_id).await? else {
        return Ok(RoleCapabilities::open_defaults());
    };
    Ok(role.capabilities)
}

pub async fn list_role_ids_for_account(
    pool: &SqlitePool,
    server_id: Uuid,
    account_id: Uuid,
) -> Result<Vec<Uuid>, sqlx::Error> {
    let rows: Vec<(String,)> = sqlx::query_as(
        "SELECT sr.id FROM server_role sr
         JOIN server_role_member srm ON srm.role_id = sr.id
         WHERE sr.server_id = ? AND srm.account_id = ?",
    )
    .bind(server_id.to_string())
    .bind(account_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter()
        .map(|(id,)| Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e))))
        .collect()
}
