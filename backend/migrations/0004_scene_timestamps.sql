-- 0003 usou datetime('now') (formato SQLite, sem T/offset). Normalizar para RFC3339.
UPDATE scene
SET
    created_at = strftime('%Y-%m-%dT%H:%M:%SZ', created_at),
    updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', updated_at)
WHERE instr(created_at, 'T') = 0 OR instr(updated_at, 'T') = 0;
