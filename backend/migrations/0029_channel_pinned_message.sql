ALTER TABLE channel ADD COLUMN pinned_message_id TEXT REFERENCES message(id) ON DELETE SET NULL;
