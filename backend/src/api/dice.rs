use crate::api::auth::session::AuthUser;
use crate::api::authz::require_write_text;
use crate::api::messages::send_to_channel_viewers;
use crate::db;
use crate::domain::channel::ChannelType;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use chrono::Utc;
use rand::Rng;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct RollBody {
    notation: String,
    label: Option<String>,
}

#[derive(Serialize)]
struct RollPayload<'a> {
    notation: String,
    count: u32,
    sides: u32,
    rolls: Vec<u32>,
    /// For `sides == 100`, flat pairs of library faces `[tens, units, …]`
    /// (`tens` ∈ {10,20,…,90,100} where 100 is the `00` face; `units` ∈ 0..=9).
    #[serde(skip_serializing_if = "Option::is_none")]
    faces: Option<Vec<u32>>,
    modifier: i32,
    total: i32,
    label: Option<&'a str>,
    natural: Option<&'static str>,
}

fn parse_notation(raw: &str) -> Result<(u32, u32, i32), ApiError> {
    let raw = raw.trim().to_ascii_lowercase();
    let (count, rest) = raw
        .split_once('d')
        .ok_or_else(|| ApiError::bad_request("invalid dice notation"))?;
    let count: u32 = count
        .parse()
        .map_err(|_| ApiError::bad_request("invalid dice count"))?;
    let modifier_pos = rest
        .char_indices()
        .find(|(i, c)| *i > 0 && (*c == '+' || *c == '-'))
        .map(|(i, _)| i);
    let (sides, modifier) = match modifier_pos {
        Some(i) => (&rest[..i], Some(&rest[i..])),
        None => (rest, None),
    };
    let sides: u32 = sides
        .parse()
        .map_err(|_| ApiError::bad_request("invalid dice sides"))?;
    let modifier: i32 = modifier
        .unwrap_or("0")
        .parse()
        .map_err(|_| ApiError::bad_request("invalid dice modifier"))?;
    if !(1..=20).contains(&count)
        || !(2..=1000).contains(&sides)
        || !(-100..=100).contains(&modifier)
    {
        return Err(ApiError::bad_request("dice notation out of range"));
    }
    Ok((count, sides, modifier))
}

/// Maps a percentile total 1..=100 to library face values for `d100` (tens) + `d10` (units).
fn percentile_faces(total: u32) -> (u32, u32) {
    debug_assert!((1..=100).contains(&total));
    if total == 100 {
        return (100, 0);
    }
    let tens = (total / 10) * 10;
    let units = total % 10;
    let tens_face = if tens == 0 { 100 } else { tens };
    (tens_face, units)
}

fn roll_dice(count: u32, sides: u32) -> (Vec<u32>, Option<Vec<u32>>) {
    let mut rng = rand::thread_rng();
    if sides == 100 {
        let mut rolls = Vec::with_capacity(count as usize);
        let mut faces = Vec::with_capacity((count as usize) * 2);
        for _ in 0..count {
            let value = rng.gen_range(1..=100);
            let (tens, units) = percentile_faces(value);
            rolls.push(value);
            faces.push(tens);
            faces.push(units);
        }
        (rolls, Some(faces))
    } else {
        let rolls = (0..count)
            .map(|_| rng.gen_range(1..=sides))
            .collect();
        (rolls, None)
    }
}

pub async fn roll(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Json(body): Json<RollBody>,
) -> Result<(StatusCode, Json<crate::domain::message::Message>), ApiError> {
    let (channel, _, _) = require_write_text(&state.pool, account.id, channel_id).await?;
    if !matches!(channel.kind, ChannelType::Text | ChannelType::Dice) {
        return Err(ApiError::bad_request(
            "dice rolls require a text or dice channel",
        ));
    }
    if let Some(mute) =
        db::channel_mute::get_active(&state.pool, channel_id, account.id, Utc::now()).await?
    {
        return Err(ApiError::forbidden(format!(
            "silenciado neste canal até {}",
            mute.ends_at.to_rfc3339()
        )));
    }
    let (count, sides, modifier) = parse_notation(&body.notation)?;
    let label = body
        .label
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    if label.is_some_and(|s| s.chars().count() > 200) {
        return Err(ApiError::bad_request("dice label too long"));
    }
    let (rolls, faces) = roll_dice(count, sides);
    let total = rolls.iter().sum::<u32>() as i32 + modifier;
    let natural = if count == 1 && sides == 20 {
        match rolls[0] {
            20 => Some("critical"),
            1 => Some("critical_failure"),
            _ => None,
        }
    } else {
        None
    };
    let notation = format!(
        "{count}d{sides}{}",
        if modifier == 0 {
            String::new()
        } else {
            format!("{modifier:+}")
        }
    );
    let payload = RollPayload {
        notation,
        count,
        sides,
        rolls,
        faces,
        modifier,
        total,
        label,
        natural,
    };
    let now = Utc::now();
    let created = db::message::create_dice_roll(
        &state.pool,
        Uuid::new_v4(),
        channel_id,
        account.id,
        &serde_json::to_string(&payload)
            .map_err(|_| ApiError::internal("failed to serialize dice roll"))?,
        now,
    )
    .await?;
    let _ = db::read_state::upsert_last_read(&state.pool, account.id, channel_id, now).await;
    send_to_channel_viewers(&state, &channel, "message.new", &created).await;
    Ok((StatusCode::CREATED, Json(created)))
}

#[cfg(test)]
mod tests {
    use super::{parse_notation, percentile_faces};

    #[test]
    fn percentile_faces_cover_common_totals() {
        assert_eq!(percentile_faces(100), (100, 0));
        assert_eq!(percentile_faces(45), (40, 5));
        assert_eq!(percentile_faces(40), (40, 0));
        assert_eq!(percentile_faces(7), (100, 7));
        assert_eq!(percentile_faces(10), (10, 0));
        assert_eq!(percentile_faces(1), (100, 1));
    }

    #[test]
    fn parse_notation_accepts_modifier() {
        assert_eq!(parse_notation("1d20+5").unwrap(), (1, 20, 5));
        assert_eq!(parse_notation("2d6-3").unwrap(), (2, 6, -3));
        assert_eq!(parse_notation("1d100").unwrap(), (1, 100, 0));
    }
}
