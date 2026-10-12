-- backend/database/migration_community_and_feed.sql
-- Adds Personalized Campus Feed (department_follows), Campus Community (Attendee Consent + Teammate Finder + Event Discussions), and Event Resource Hub

USE campusflow;

-- 1. Department & Club Follows for Personalized "For You" Feed
CREATE TABLE IF NOT EXISTS department_follows (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    department_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_dept_follow (user_id, department_id),
    CONSTRAINT fk_df_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_df_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Attendee Networking Consent & Teammate Finder Columns on registrations
ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS share_profile TINYINT(1) NOT NULL DEFAULT 1 AFTER award_title,
    ADD COLUMN IF NOT EXISTS looking_for_team TINYINT(1) NOT NULL DEFAULT 0 AFTER share_profile,
    ADD COLUMN IF NOT EXISTS teammate_note VARCHAR(255) DEFAULT NULL AFTER looking_for_team;

-- 3. Event Discussion Spaces & Q&A Board
CREATE TABLE IF NOT EXISTS event_discussions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    topic_tag ENUM('QUESTION', 'TEAMMATE_FINDER', 'GENERAL') NOT NULL DEFAULT 'QUESTION',
    message TEXT NOT NULL,
    official_reply TEXT DEFAULT NULL,
    replied_by INT UNSIGNED DEFAULT NULL,
    replied_at DATETIME DEFAULT NULL,
    is_pinned TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ed_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_ed_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ed_replier FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Event Resource Hub & Materials (Problem Statements, Slides, GitHub Repos, Photo Galleries)
CREATE TABLE IF NOT EXISTS event_resources (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id INT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    resource_type ENUM('PROBLEM_STATEMENT', 'SLIDES', 'GITHUB_REPO', 'PHOTO_GALLERY', 'DOCUMENT') NOT NULL DEFAULT 'DOCUMENT',
    url VARCHAR(500) NOT NULL,
    added_by INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_er_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_er_user FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed initial department follows for existing students (follow their own department + Cultural/AIML)
INSERT IGNORE INTO department_follows (user_id, department_id)
SELECT id, department_id FROM users WHERE role = 'STUDENT' AND department_id IS NOT NULL;

INSERT IGNORE INTO department_follows (user_id, department_id)
SELECT id, 2 FROM users WHERE role = 'STUDENT';

INSERT IGNORE INTO department_follows (user_id, department_id)
SELECT id, 5 FROM users WHERE role = 'STUDENT';

-- Update existing sample registrations with teammate finder notes & consent so Community Directory is live
UPDATE registrations
SET share_profile = 1,
    looking_for_team = 1,
    teammate_note = 'Looking for 1 Frontend/UI Designer & 1 ML Engineer to join our squad!'
WHERE team_name IS NOT NULL AND teammate_note IS NULL;

-- Seed initial Event Discussions / Q&A if empty
INSERT INTO event_discussions (event_id, user_id, topic_tag, message, official_reply, replied_by, replied_at, is_pinned)
SELECT
    (SELECT id FROM events ORDER BY id ASC LIMIT 1),
    (SELECT id FROM users WHERE role = 'STUDENT' ORDER BY id ASC LIMIT 1),
    'QUESTION',
    'Are cross-department squads (e.g. CSE + AIML + ECE) allowed for HackNova, and what is the maximum squad size?',
    'Yes! Cross-department and cross-year squads of 2 to 4 members are strongly encouraged. One leader can create the squad and share the TEAM code with teammates.',
    (SELECT id FROM users WHERE role IN ('ORGANIZER', 'DEPARTMENT_MANAGER', 'ADMIN') ORDER BY id ASC LIMIT 1),
    NOW(),
    1
WHERE NOT EXISTS (SELECT 1 FROM event_discussions);

INSERT INTO event_discussions (event_id, user_id, topic_tag, message, official_reply, replied_by, replied_at, is_pinned)
SELECT
    (SELECT id FROM events ORDER BY id ASC LIMIT 1),
    (SELECT id FROM users WHERE role = 'STUDENT' ORDER BY id DESC LIMIT 1),
    'TEAMMATE_FINDER',
    'Hey everyone! Our squad Neural Forgers (Code: TEAM-NEUR) has 1 open spot for a React/Tailwind developer. Join using our squad code or reply here!',
    NULL,
    NULL,
    NULL,
    0
WHERE (SELECT COUNT(*) FROM event_discussions) < 2;

-- Seed initial Event Resources if empty
INSERT INTO event_resources (event_id, title, resource_type, url, added_by)
SELECT
    (SELECT id FROM events ORDER BY id ASC LIMIT 1),
    'Official Problem Statements & Evaluation Rubric Deck',
    'PROBLEM_STATEMENT',
    'https://github.com/topics/hackathon-starter',
    (SELECT id FROM users WHERE role IN ('ORGANIZER', 'DEPARTMENT_MANAGER', 'ADMIN') ORDER BY id ASC LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM event_resources);

INSERT INTO event_resources (event_id, title, resource_type, url, added_by)
SELECT
    (SELECT id FROM events ORDER BY id ASC LIMIT 1),
    'Starter Boilerplate & API Sandbox Repository',
    'GITHUB_REPO',
    'https://github.com/vitejs/vite',
    (SELECT id FROM users WHERE role IN ('ORGANIZER', 'DEPARTMENT_MANAGER', 'ADMIN') ORDER BY id ASC LIMIT 1)
WHERE (SELECT COUNT(*) FROM event_resources) < 2;
