ALTER TABLE account ADD COLUMN avatar_filename TEXT;
ALTER TABLE account ADD COLUMN avatar_content_type TEXT;
ALTER TABLE server ADD COLUMN image_filename TEXT;
ALTER TABLE server ADD COLUMN image_content_type TEXT;
