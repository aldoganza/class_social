-- Fix notifications and stories schema to match application code

-- Extend notifications with group support and custom message text
ALTER TABLE notifications
  ADD COLUMN group_id INT NULL AFTER comment_id;

ALTER TABLE notifications
  ADD COLUMN message TEXT NULL AFTER group_id;

ALTER TABLE notifications
  ADD INDEX idx_group_notifications (group_id, type);

-- Optionally link notifications.group_id to groups_table
ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_group
  FOREIGN KEY (group_id) REFERENCES groups_table(id)
  ON DELETE SET NULL;

-- Extend stories with optional audio and text overlay fields
ALTER TABLE stories
  ADD COLUMN audio_url VARCHAR(255) NULL AFTER media_type;

ALTER TABLE stories
  ADD COLUMN text_color VARCHAR(16) NULL;

ALTER TABLE stories
  ADD COLUMN text_bg VARCHAR(16) NULL;

ALTER TABLE stories
  ADD COLUMN text_pos ENUM('top','center','bottom') NULL DEFAULT 'bottom';
