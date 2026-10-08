ALTER TABLE account ADD COLUMN recovery_vault BLOB;
ALTER TABLE account ADD COLUMN recovery_verifier_pubkey BLOB;
ALTER TABLE account ADD COLUMN recovery_generation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE account ADD COLUMN recovery_set_at TEXT;

CREATE TABLE password_reset (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL UNIQUE REFERENCES account(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE recovery_challenge (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT REFERENCES account(id) ON DELETE CASCADE,
    recovery_generation INTEGER NOT NULL,
    nonce_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_recovery_challenge_account ON recovery_challenge(account_id);

CREATE TABLE recovery_ticket (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    recovery_generation INTEGER NOT NULL,
    ticket_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_recovery_ticket_account ON recovery_ticket(account_id);

CREATE INDEX idx_key_envelope_account ON key_envelope(account_id);
