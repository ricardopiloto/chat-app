-- 047: server roles, channel visibility, channel ACL
ALTER TABLE channel ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE channel ADD COLUMN visible_to_new_members INTEGER NOT NULL DEFAULT 1;

UPDATE channel SET visibility = 'public', visible_to_new_members = 1;

CREATE TABLE server_role (
  id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT NOT NULL REFERENCES server(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  can_create_channels INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE (server_id, name)
);

CREATE TABLE server_role_member (
  role_id TEXT NOT NULL REFERENCES server_role(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, account_id)
);

CREATE TABLE channel_acl (
  id TEXT PRIMARY KEY NOT NULL,
  channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  level TEXT NOT NULL,
  UNIQUE (channel_id, subject_type, subject_id)
);

CREATE INDEX idx_server_role_server ON server_role(server_id);
CREATE INDEX idx_channel_acl_channel ON channel_acl(channel_id);
CREATE INDEX idx_server_role_member_account ON server_role_member(account_id);
