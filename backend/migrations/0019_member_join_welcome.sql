-- 077: member join welcome — system messages + server/invite welcome destination
ALTER TABLE message ADD COLUMN kind TEXT NOT NULL DEFAULT 'user';
ALTER TABLE message ADD COLUMN content_plaintext TEXT;

ALTER TABLE server ADD COLUMN welcome_channel_id TEXT REFERENCES channel(id) ON DELETE SET NULL;
ALTER TABLE server ADD COLUMN welcome_message_template TEXT;

ALTER TABLE invite ADD COLUMN welcome_channel_id TEXT REFERENCES channel(id) ON DELETE SET NULL;
