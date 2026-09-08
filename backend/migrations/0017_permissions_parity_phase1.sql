-- 060: role hierarchy position + channel ACL Allow/Deny + everyone subject
ALTER TABLE server_role ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

UPDATE server_role SET position = 1000 WHERE is_system = 1 OR name = 'Dono';

UPDATE server_role
SET position = (
  SELECT ranked.new_pos FROM (
    SELECT id AS rid,
           (ROW_NUMBER() OVER (
              PARTITION BY server_id
              ORDER BY created_at ASC, name ASC
            )) * 10 AS new_pos
    FROM server_role
    WHERE is_system = 0 AND name != 'Dono'
  ) AS ranked
  WHERE ranked.rid = server_role.id
)
WHERE is_system = 0 AND name != 'Dono';

-- Rebuild channel_acl with effect + wider unique key
CREATE TABLE channel_acl_new (
  id TEXT PRIMARY KEY NOT NULL,
  channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  level TEXT NOT NULL,
  effect TEXT NOT NULL DEFAULT 'allow',
  UNIQUE (channel_id, subject_type, subject_id, level, effect)
);

INSERT INTO channel_acl_new (id, channel_id, subject_type, subject_id, level, effect)
SELECT id, channel_id, subject_type, subject_id, level, 'allow'
FROM channel_acl;

DROP TABLE channel_acl;
ALTER TABLE channel_acl_new RENAME TO channel_acl;

CREATE INDEX idx_channel_acl_channel ON channel_acl(channel_id);
