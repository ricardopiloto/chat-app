-- Named layout keys for scene composition (mestre | quad | faixa).
ALTER TABLE scene ADD COLUMN layout_key TEXT NOT NULL DEFAULT 'quad';

-- Backfill from slot_count; then clamp orphan counts toward catalog.
UPDATE scene SET layout_key = 'quad' WHERE slot_count = 4;
UPDATE scene SET layout_key = 'quad' WHERE slot_count = 2 OR slot_count = 3;
UPDATE scene SET layout_key = 'mestre' WHERE slot_count = 5;
UPDATE scene SET layout_key = 'faixa' WHERE slot_count > 5;

-- Expand 2–3 slot scenes to 4 empty/extra slots for quad geometry.
INSERT OR IGNORE INTO scene_slot (scene_id, slot_index, account_id, assigned_by, updated_at)
SELECT s.id, idx.slot_index, NULL, 'auto', datetime('now')
FROM scene s
JOIN (
  SELECT 0 AS slot_index UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
) AS idx
WHERE s.slot_count IN (2, 3) AND idx.slot_index < 4;

UPDATE scene SET slot_count = 4 WHERE slot_count IN (2, 3);

-- Truncate scenes with >5 slots down to mestre (5).
DELETE FROM scene_slot WHERE scene_id IN (SELECT id FROM scene WHERE slot_count > 5) AND slot_index >= 5;
UPDATE scene SET slot_count = 5, layout_key = 'mestre' WHERE slot_count > 5;
