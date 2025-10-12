-- Add video_url column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url VARCHAR(255);
