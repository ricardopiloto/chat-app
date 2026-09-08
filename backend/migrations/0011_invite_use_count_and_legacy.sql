-- 046: use_count + invalidate still-usable (and remaining non-revoked) invites
ALTER TABLE invite ADD COLUMN use_count INTEGER NOT NULL DEFAULT 0;

UPDATE invite
SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE revoked_at IS NULL;
