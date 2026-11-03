ALTER TABLE account ADD COLUMN email TEXT;
ALTER TABLE account ADD COLUMN email_canonical TEXT;
ALTER TABLE account ADD COLUMN email_verified_at TEXT;
ALTER TABLE account ADD COLUMN terms_accepted_at TEXT;
CREATE UNIQUE INDEX account_email_canonical_unique ON account(email_canonical) WHERE email_canonical IS NOT NULL;

CREATE TABLE email_verification (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    email_canonical TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    consumed_at TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX email_verification_canonical ON email_verification(email_canonical);
CREATE UNIQUE INDEX email_verification_token_hash ON email_verification(token_hash);
