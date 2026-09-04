-- Channel creator, E2EE state, channel media key custody, audit, recording metadata.
ALTER TABLE channel ADD COLUMN created_by_account_id TEXT REFERENCES account(id);
ALTER TABLE channel ADD COLUMN e2ee_enabled INTEGER NOT NULL DEFAULT 1;

UPDATE channel
SET created_by_account_id = (
    SELECT owner_account_id FROM server WHERE server.id = channel.server_id
)
WHERE created_by_account_id IS NULL;

CREATE TABLE channel_key (
    channel_id TEXT PRIMARY KEY NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    custodian_account_id TEXT NOT NULL REFERENCES account(id),
    sealed_blob BLOB NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE e2ee_audit_log (
    id TEXT PRIMARY KEY NOT NULL,
    channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    actor_account_id TEXT NOT NULL REFERENCES account(id),
    action TEXT NOT NULL CHECK (action IN ('disable', 'enable')),
    intent TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_e2ee_audit_channel ON e2ee_audit_log(channel_id, created_at);

CREATE TABLE recording_session (
    id TEXT PRIMARY KEY NOT NULL,
    channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    started_by TEXT NOT NULL REFERENCES account(id),
    egress_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('starting', 'active', 'failed', 'stopped')),
    error TEXT,
    started_at TEXT NOT NULL,
    stopped_at TEXT
);
CREATE INDEX idx_recording_channel ON recording_session(channel_id, started_at);
