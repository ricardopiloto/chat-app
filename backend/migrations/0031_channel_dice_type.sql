-- db::migrate disables foreign keys on its migration connection before SQLx starts this transaction.

CREATE TABLE channel_new (
    id TEXT PRIMARY KEY NOT NULL,
    server_id TEXT NOT NULL REFERENCES server(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'voice_video', 'dice')),
    grid_slot_count INTEGER,
    created_at TEXT NOT NULL,
    active_scene_id TEXT,
    created_by_account_id TEXT REFERENCES account(id),
    e2ee_enabled INTEGER NOT NULL DEFAULT 1,
    voice_session_started_at TEXT,
    visibility TEXT NOT NULL DEFAULT 'public',
    visible_to_new_members INTEGER NOT NULL DEFAULT 1,
    pinned_message_id TEXT REFERENCES message(id) ON DELETE SET NULL,
    dice_animations_enabled INTEGER NOT NULL DEFAULT 0
);

INSERT INTO channel_new (
    id, server_id, name, type, grid_slot_count, created_at, active_scene_id,
    created_by_account_id, e2ee_enabled, voice_session_started_at, visibility,
    visible_to_new_members, pinned_message_id, dice_animations_enabled
)
SELECT id, server_id, name, type, grid_slot_count, created_at, active_scene_id,
       created_by_account_id, e2ee_enabled, voice_session_started_at, visibility,
       visible_to_new_members, pinned_message_id, dice_animations_enabled
FROM channel;

DROP TABLE channel;
ALTER TABLE channel_new RENAME TO channel;
CREATE INDEX idx_channel_server ON channel(server_id);
