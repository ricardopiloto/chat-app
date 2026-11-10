use crate::api::auth::session::AuthUser;
use crate::db;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};

pub const ALLOWED_SIDES: [u32; 7] = [4, 6, 8, 10, 12, 20, 100];
pub const DEFAULT_VISIBLE_SIDES: [u32; 7] = ALLOWED_SIDES;

#[derive(Serialize)]
pub struct DiceToolbarResponse {
    pub visible_sides: Vec<u32>,
}

#[derive(Deserialize)]
pub struct DiceToolbarBody {
    pub visible_sides: Vec<u32>,
}

pub fn normalize_visible_sides(sides: &[u32]) -> Result<Vec<u32>, ApiError> {
    let mut out = Vec::with_capacity(sides.len());
    for &side in sides {
        if !ALLOWED_SIDES.contains(&side) {
            return Err(ApiError::bad_request_code(
                "invalid_dice_toolbar_sides",
                format!("side {side} is not allowed in the dice toolbar"),
            ));
        }
        if out.contains(&side) {
            return Err(ApiError::bad_request_code(
                "invalid_dice_toolbar_sides",
                "duplicate sides are not allowed",
            ));
        }
        out.push(side);
    }
    out.sort_by_key(|side| {
        ALLOWED_SIDES
            .iter()
            .position(|allowed| allowed == side)
            .unwrap_or(usize::MAX)
    });
    Ok(out)
}

fn parse_stored(raw: &str) -> Result<Vec<u32>, ApiError> {
    let parsed: Vec<u32> = serde_json::from_str(raw).map_err(|_| {
        ApiError::internal("stored dice toolbar preference is not valid JSON")
    })?;
    normalize_visible_sides(&parsed)
}

pub async fn get_preference(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
) -> Result<Json<DiceToolbarResponse>, ApiError> {
    let visible_sides = match db::dice_toolbar::find_visible_sides(&state.pool, account.id).await? {
        Some(raw) => parse_stored(&raw)?,
        None => DEFAULT_VISIBLE_SIDES.to_vec(),
    };
    Ok(Json(DiceToolbarResponse { visible_sides }))
}

pub async fn put_preference(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Json(body): Json<DiceToolbarBody>,
) -> Result<Json<DiceToolbarResponse>, ApiError> {
    let visible_sides = normalize_visible_sides(&body.visible_sides)?;
    let json = serde_json::to_string(&visible_sides).map_err(|err| ApiError::internal(err.to_string()))?;
    db::dice_toolbar::upsert_visible_sides(&state.pool, account.id, &json).await?;
    Ok(Json(DiceToolbarResponse { visible_sides }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_and_rejects() {
        assert_eq!(
            normalize_visible_sides(&[20, 6, 4]).unwrap(),
            vec![4, 6, 20]
        );
        assert!(normalize_visible_sides(&[7]).is_err());
        assert!(normalize_visible_sides(&[6, 6]).is_err());
        assert_eq!(normalize_visible_sides(&[]).unwrap(), Vec::<u32>::new());
    }
}
