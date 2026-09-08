-- 062: message replies, mentions metadata, user notifications
ALTER TABLE message ADD COLUMN reply_to_message_id TEXT REFERENCES message(id) ON DELETE SET NULL;

CREATE TABLE message_mention (
  message_id TEXT NOT NULL REFERENCES message(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, account_id)
);

CREATE TABLE user_notification (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES message(id) ON DELETE SET NULL,
  actor_account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  read_at TEXT
);

CREATE INDEX idx_message_mention_account ON message_mention(account_id);
CREATE INDEX idx_user_notification_account ON user_notification(account_id, read_at, created_at);
CREATE INDEX idx_message_reply_to ON message(reply_to_message_id);
