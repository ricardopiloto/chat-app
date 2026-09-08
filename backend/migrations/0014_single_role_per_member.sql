-- 052: one role per member per server + denormalized server_id for UNIQUE
ALTER TABLE server_role_member ADD COLUMN server_id TEXT REFERENCES server(id) ON DELETE CASCADE;

UPDATE server_role_member
SET server_id = (
  SELECT sr.server_id FROM server_role sr WHERE sr.id = server_role_member.role_id
);

-- Drop orphan rows (role missing)
DELETE FROM server_role_member WHERE server_id IS NULL;

-- FR-011: keep role with most active capability flags; tie → earliest created_at, then name
DELETE FROM server_role_member
WHERE rowid IN (
  SELECT rowid FROM (
    SELECT
      srm.rowid AS rowid,
      ROW_NUMBER() OVER (
        PARTITION BY sr.server_id, srm.account_id
        ORDER BY (
          (CASE WHEN sr.can_view_channels != 0 THEN 1 ELSE 0 END) +
          (CASE WHEN sr.can_manage_channels != 0 OR sr.can_create_channels != 0 THEN 1 ELSE 0 END) +
          (CASE WHEN sr.can_manage_roles != 0 THEN 1 ELSE 0 END) +
          (CASE WHEN sr.can_create_invites != 0 THEN 1 ELSE 0 END) +
          (CASE WHEN sr.can_send_messages != 0 THEN 1 ELSE 0 END) +
          (CASE WHEN sr.can_delete_messages != 0 THEN 1 ELSE 0 END) +
          (CASE WHEN sr.can_attach_files != 0 THEN 1 ELSE 0 END) +
          (CASE WHEN sr.can_remove_members != 0 THEN 1 ELSE 0 END) +
          (CASE WHEN sr.can_connect_voice != 0 THEN 1 ELSE 0 END) +
          (CASE WHEN sr.can_speak_voice != 0 THEN 1 ELSE 0 END)
        ) DESC,
        sr.created_at ASC,
        sr.name ASC
      ) AS rn
    FROM server_role_member srm
    JOIN server_role sr ON sr.id = srm.role_id
  )
  WHERE rn > 1
);

CREATE UNIQUE INDEX idx_server_role_member_one_per_server
  ON server_role_member(server_id, account_id);
