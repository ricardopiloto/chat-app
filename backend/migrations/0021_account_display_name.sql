-- 099: optional public display name (nullable; empty treated as unset in app)
ALTER TABLE account ADD COLUMN display_name TEXT;
