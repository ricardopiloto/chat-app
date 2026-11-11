CREATE TABLE account_camera_background (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_account_camera_background_account_id ON account_camera_background(account_id);
