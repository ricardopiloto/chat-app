CREATE TABLE voice_occupant (
    account_id TEXT PRIMARY KEY NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    server_id TEXT NOT NULL REFERENCES server(id) ON DELETE CASCADE,
    mic_on INTEGER NOT NULL DEFAULT 1,
    cam_on INTEGER NOT NULL DEFAULT 1,
    joined_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
);
CREATE INDEX idx_voice_occupant_channel ON voice_occupant(channel_id);
CREATE INDEX idx_voice_occupant_server ON voice_occupant(server_id);
CREATE INDEX idx_voice_occupant_last_seen ON voice_occupant(last_seen_at);

ALTER TABLE channel ADD COLUMN voice_session_started_at TEXT;
