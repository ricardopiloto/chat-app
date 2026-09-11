-- 082: canonical screen-share flag on voice occupancy
ALTER TABLE voice_occupant ADD COLUMN screen_on INTEGER NOT NULL DEFAULT 0;
