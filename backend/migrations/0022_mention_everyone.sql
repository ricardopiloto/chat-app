-- 022: "Mencionar @todos" role capability and the per-message mark that tells clients a message notified everyone
ALTER TABLE server_role ADD COLUMN can_mention_everyone INTEGER NOT NULL DEFAULT 0;
ALTER TABLE message ADD COLUMN mentions_everyone INTEGER NOT NULL DEFAULT 0;

-- The system Dono profile always has every capability
UPDATE server_role SET can_mention_everyone = 1 WHERE is_system = 1;
