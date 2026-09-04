CREATE TABLE message_attachment (
    id TEXT PRIMARY KEY NOT NULL,
    channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    message_id TEXT REFERENCES message(id) ON DELETE CASCADE,
    uploader_account_id TEXT NOT NULL REFERENCES account(id),
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_attachment_channel ON message_attachment(channel_id);
CREATE INDEX idx_attachment_message ON message_attachment(message_id);
CREATE INDEX idx_attachment_uploader ON message_attachment(uploader_account_id);
