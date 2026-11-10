CREATE TABLE account_dice_toolbar (
  account_id TEXT PRIMARY KEY REFERENCES account(id) ON DELETE CASCADE,
  visible_sides TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
