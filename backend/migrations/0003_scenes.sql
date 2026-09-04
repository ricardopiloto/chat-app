-- Fase 2: cenas nomeadas. A grade do canal passa a ser a cena activa.
ALTER TABLE channel ADD COLUMN active_scene_id TEXT;

CREATE TABLE scene (
    id TEXT PRIMARY KEY NOT NULL,
    channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slot_count INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX idx_scene_channel ON scene(channel_id);
CREATE UNIQUE INDEX idx_scene_channel_name ON scene(channel_id, lower(name));

CREATE TABLE scene_slot (
    scene_id TEXT NOT NULL REFERENCES scene(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL,
    account_id TEXT REFERENCES account(id) ON DELETE SET NULL,
    assigned_by TEXT NOT NULL CHECK (assigned_by IN ('auto', 'owner')),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (scene_id, slot_index)
);

CREATE TABLE channel_role (
    channel_id TEXT NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('co_director')),
    granted_by_account_id TEXT NOT NULL REFERENCES account(id),
    created_at TEXT NOT NULL,
    PRIMARY KEY (channel_id, account_id, role)
);
CREATE INDEX idx_channel_role_channel ON channel_role(channel_id);

INSERT INTO scene (id, channel_id, name, slot_count, created_at, updated_at)
SELECT id, id, 'Cena padrão', COALESCE(grid_slot_count, 4), datetime('now'), datetime('now')
FROM channel
WHERE type = 'voice_video';

INSERT INTO scene_slot (scene_id, slot_index, account_id, assigned_by, updated_at)
SELECT channel_id, slot_index, account_id, assigned_by, updated_at
FROM grid_slot;

UPDATE channel SET active_scene_id = id WHERE type = 'voice_video';

DROP TABLE grid_slot;
