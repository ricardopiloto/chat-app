use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReactionSummary {
    pub emoji_code: String,
    pub count: usize,
    pub account_ids: Vec<Uuid>,
}

// Keep these codes in sync with frontend/src/chat/logic/emoji.ts (EMOJI_GROUPS).
pub const EMOJI_CODES: &[&str] = &[
    "grin", "smile", "laugh", "sweat_smile", "joy", "rofl", "wink", "blush",
    "innocent", "heart_eyes", "star_struck", "kiss", "yum", "tongue", "crazy", "thinking",
    "shush", "zipper", "neutral", "expressionless", "smirk", "unamused", "roll_eyes", "grimace",
    "relieved", "pensive", "sleepy", "sleeping", "mask", "sick", "dizzy_face", "hot",
    "cold", "sunglasses", "nerd", "confused", "worried", "frown", "open_mouth", "astonished",
    "flushed", "pleading", "cry", "sob", "scream", "angry", "rage", "cursing",
    "skull", "ghost", "alien", "robot", "clown", "devil", "imp", "poop",
    "thumbsup", "thumbsdown", "ok_hand", "victory", "crossed_fingers", "metal", "call_me", "point_up",
    "point_down", "point_left", "point_right", "raised_hand", "wave", "clap", "raised_hands", "open_hands",
    "pray", "handshake", "muscle", "fist", "punch", "writing_hand", "eyes", "brain",
    "heart", "orange_heart", "yellow_heart", "green_heart", "blue_heart", "purple_heart", "black_heart", "broken_heart",
    "sparkling_heart", "hundred", "dice", "chess", "joker", "game", "puzzle", "dart",
    "trophy", "medal", "crown", "gem", "scroll", "book", "books", "sword",
    "dagger", "shield", "bow", "axe", "wand", "crystal_ball", "potion", "magic",
    "fire", "lightning", "ice", "skull_crossbones", "dragon", "unicorn", "castle", "tent",
    "campfire", "map", "compass", "key", "lock", "unlock", "coin", "moneybag",
    "torch", "candle", "bell", "music", "guitar", "drum", "mic", "headphones",
    "sun", "moon", "star", "glowing_star", "cloud", "rain", "snow", "storm",
    "rainbow", "wind", "tornado", "mountain", "volcano", "tree", "palm", "cactus",
    "flower", "rose", "leaf", "mushroom", "dog", "cat", "wolf", "fox",
    "bear", "lion", "horse", "owl", "eagle", "bat", "snake", "spider",
    "scorpion", "bee", "butterfly", "fish", "octopus", "beer", "beers", "wine",
    "cocktail", "coffee", "tea", "pizza", "burger", "meat", "bread", "cheese",
    "apple", "cake", "cookie", "popcorn", "party", "gift", "balloon", "phone",
    "computer", "camera", "tv", "bulb", "battery", "hammer", "wrench", "gear",
    "link", "pin", "paperclip", "pencil", "memo", "envelope", "package", "flag",
    "hourglass", "clock", "check", "cross", "warning", "stop", "question", "exclamation",
    "plus", "minus", "arrow_up", "arrow_down", "arrow_left", "arrow_right", "refresh", "recycle",
    "new", "free", "up", "cool", "ok", "sos", "info", "eight_ball",
];

pub fn is_valid_emoji_code(code: &str) -> bool {
    EMOJI_CODES.contains(&code)
}

#[cfg(test)]
mod tests {
    use super::is_valid_emoji_code;

    #[test]
    fn only_canonical_codes_are_accepted() {
        assert!(is_valid_emoji_code("fire"));
        assert!(!is_valid_emoji_code("not_an_emoji"));
    }
}
