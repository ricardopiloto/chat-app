CREATE TABLE account_channel_dice_appearance (
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
  appearance TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (account_id, channel_id)
);
