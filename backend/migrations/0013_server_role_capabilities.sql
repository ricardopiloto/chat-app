-- 047 converge: expand server_role capability flags
ALTER TABLE server_role ADD COLUMN can_view_channels INTEGER NOT NULL DEFAULT 1;
ALTER TABLE server_role ADD COLUMN can_manage_channels INTEGER NOT NULL DEFAULT 0;
ALTER TABLE server_role ADD COLUMN can_manage_roles INTEGER NOT NULL DEFAULT 0;
ALTER TABLE server_role ADD COLUMN can_create_invites INTEGER NOT NULL DEFAULT 0;
ALTER TABLE server_role ADD COLUMN can_send_messages INTEGER NOT NULL DEFAULT 1;
ALTER TABLE server_role ADD COLUMN can_delete_messages INTEGER NOT NULL DEFAULT 0;
ALTER TABLE server_role ADD COLUMN can_attach_files INTEGER NOT NULL DEFAULT 1;
ALTER TABLE server_role ADD COLUMN can_remove_members INTEGER NOT NULL DEFAULT 0;
ALTER TABLE server_role ADD COLUMN can_connect_voice INTEGER NOT NULL DEFAULT 1;
ALTER TABLE server_role ADD COLUMN can_speak_voice INTEGER NOT NULL DEFAULT 1;

UPDATE server_role SET can_manage_channels = can_create_channels WHERE can_create_channels = 1;
