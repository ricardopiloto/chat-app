ALTER TABLE account ADD COLUMN is_system_account INTEGER NOT NULL DEFAULT 0;
CREATE TABLE channel_webhook (
    id TEXT PRIMARY KEY NOT NULL,
    channel_id TEXT UNIQUE NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    account_id TEXT UNIQUE NOT NULL REFERENCES account(id),
    token_hash TEXT NOT NULL,
    created_by_account_id TEXT NOT NULL REFERENCES account(id),
    created_at TEXT NOT NULL,
    revoked_at TEXT
);
CREATE INDEX idx_channel_webhook_channel ON channel_webhook(channel_id);
ALTER TABLE message ADD COLUMN sender_display_name_snapshot TEXT;
ALTER TABLE message ADD COLUMN sender_avatar_filename_snapshot TEXT;
ALTER TABLE message ADD COLUMN sender_avatar_content_type_snapshot TEXT;
