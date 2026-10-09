CREATE TABLE message_reaction (
    message_id TEXT NOT NULL REFERENCES message(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    emoji_code TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (message_id, account_id, emoji_code)
);

CREATE INDEX idx_message_reaction_message ON message_reaction(message_id, emoji_code);
