-- 059: system Owner/Dono role flag + promote existing "Dono" names
ALTER TABLE server_role ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0;

-- Reuse hand-made roles named exactly Dono as the system profile
UPDATE server_role SET
  is_system = 1,
  can_view_channels = 1,
  can_manage_channels = 1,
  can_create_channels = 1,
  can_manage_roles = 1,
  can_create_invites = 1,
  can_send_messages = 1,
  can_delete_messages = 1,
  can_attach_files = 1,
  can_remove_members = 1,
  can_mute_members = 1,
  can_connect_voice = 1,
  can_speak_voice = 1
WHERE name = 'Dono';
