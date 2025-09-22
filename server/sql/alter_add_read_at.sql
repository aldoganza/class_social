USE classmates_social;

-- Add read_at column to messages for unread tracking
ALTER TABLE messages
  ADD COLUMN read_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;

-- Optional: index to speed up unread queries
CREATE INDEX idx_messages_receiver_read ON messages (receiver_id, read_at);
