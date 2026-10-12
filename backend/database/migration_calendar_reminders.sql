-- backend/database/migration_calendar_reminders.sql
-- Personal Calendar Marks & Reminders per User

USE campusflow;

CREATE TABLE IF NOT EXISTS user_reminders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    event_id INT UNSIGNED NULL DEFAULT NULL,
    title VARCHAR(140) NOT NULL,
    reminder_date DATE NOT NULL,
    reminder_time TIME NULL DEFAULT '09:00:00',
    note VARCHAR(255) NULL DEFAULT NULL,
    color_tag ENUM('vermilion', 'emerald', 'amber', 'indigo') NOT NULL DEFAULT 'vermilion',
    is_completed TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reminder_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reminder_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    INDEX idx_user_reminder_date (user_id, reminder_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
