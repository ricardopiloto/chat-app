-- 058: channel mute + Silenciar membros capability
ALTER TABLE server_role ADD COLUMN can_mute_members INTEGER NOT NULL DEFAULT 0;

CREATE TABLE channel_mute (
  channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  muted_by_account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  PRIMARY KEY (channel_id, account_id)
);

CREATE INDEX idx_channel_mute_account ON channel_mute(account_id);
CREATE INDEX idx_channel_mute_ends ON channel_mute(ends_at);
