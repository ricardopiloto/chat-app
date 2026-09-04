CREATE TABLE account (
    id TEXT PRIMARY KEY NOT NULL,
    handle TEXT NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    identity_pubkey BLOB NOT NULL,
    is_initial_operator INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_account_handle ON account(handle);

CREATE TABLE session (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_session_token_hash ON session(token_hash);
CREATE INDEX idx_session_account ON session(account_id);

CREATE TABLE server (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    owner_account_id TEXT NOT NULL REFERENCES account(id),
    created_at TEXT NOT NULL
);
CREATE INDEX idx_server_owner ON server(owner_account_id);

CREATE TABLE invite (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL,
    server_id TEXT NOT NULL REFERENCES server(id) ON DELETE CASCADE,
    created_by_account_id TEXT NOT NULL REFERENCES account(id),
    expires_at TEXT,
    include_history INTEGER NOT NULL DEFAULT 0,
    revoked_at TEXT,
    created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_invite_code ON invite(code);
CREATE INDEX idx_invite_server ON invite(server_id);

CREATE TABLE membership (
    account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    server_id TEXT NOT NULL REFERENCES server(id) ON DELETE CASCADE,
    joined_at TEXT NOT NULL,
    joined_via_invite_id TEXT REFERENCES invite(id),
    key_handoff_status TEXT NOT NULL CHECK (key_handoff_status IN ('synced', 'pending')),
    PRIMARY KEY (account_id, server_id)
);
CREATE INDEX idx_membership_server ON membership(server_id);

CREATE TABLE key_envelope (
    server_id TEXT NOT NULL REFERENCES server(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    sealed_key BLOB NOT NULL,
    sealed_by_account_id TEXT NOT NULL REFERENCES account(id),
    created_at TEXT NOT NULL,
    PRIMARY KEY (server_id, account_id)
);

CREATE TABLE channel (
    id TEXT PRIMARY KEY NOT NULL,
    server_id TEXT NOT NULL REFERENCES server(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'voice_video')),
    grid_slot_count INTEGER,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_channel_server ON channel(server_id);

CREATE TABLE message (
    id TEXT PRIMARY KEY NOT NULL,
    channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    sender_account_id TEXT NOT NULL REFERENCES account(id),
    content_ciphertext BLOB NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_message_channel_created ON message(channel_id, created_at);

CREATE TABLE grid_slot (
    channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL,
    account_id TEXT REFERENCES account(id),
    assigned_by TEXT NOT NULL CHECK (assigned_by IN ('auto', 'owner')),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (channel_id, slot_index)
);
