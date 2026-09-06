CREATE TABLE channel_read_state (
    account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    last_read_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (account_id, channel_id)
);

CREATE INDEX idx_channel_read_state_channel ON channel_read_state(channel_id);
