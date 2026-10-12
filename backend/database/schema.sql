-- backend/database/schema.sql
-- CampusFlow Phase 2A — Core Relational Database Schema

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. DEPARTMENTS
-- Top-level organizational units that own Users and Events
-- ============================================================================
CREATE TABLE departments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(16) NOT NULL UNIQUE COMMENT 'Short code used in badges & Pass IDs, e.g., CSE, AIML, ECE',
    name VARCHAR(120) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. USERS
-- Supports all 4 CampusFlow roles: STUDENT, ORGANIZER, DEPARTMENT_MANAGER, ADMIN
-- ============================================================================
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'ORGANIZER', 'DEPARTMENT_MANAGER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    department_id INT UNSIGNED NULL,
    year_of_study ENUM('1st Year', '2nd Year', '3rd Year', '4th Year', 'N/A') NOT NULL DEFAULT '1st Year',
    roll_number VARCHAR(40) NULL UNIQUE,
    interests VARCHAR(255) NULL COMMENT 'Comma-separated interest tags for recommendation engine',
    avatar_url VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_users_role (role),
    INDEX idx_users_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. EVENTS
-- Owned by a Department and created/managed by an Organizer/Dept Manager/Admin
-- ============================================================================
CREATE TABLE events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    event_code VARCHAR(16) NOT NULL COMMENT 'Short code used in Pass ID generation, e.g., AI, WEB, CULT',
    category ENUM('Workshop', 'Seminar', 'Hackathon', 'Cultural', 'Sports', 'Tech Talk') NOT NULL DEFAULT 'Workshop',
    description TEXT NOT NULL,
    agenda_text TEXT NULL DEFAULT NULL,
    rules_text TEXT NULL DEFAULT NULL,
    department_id INT UNSIGNED NOT NULL,
    organizer_id INT UNSIGNED NOT NULL,
    venue VARCHAR(160) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT UNSIGNED NOT NULL DEFAULT 100,
    registration_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '0.00 = Free entry; > 0.00 = Paid entry in INR',
    prize_pool VARCHAR(100) NULL DEFAULT NULL COMMENT 'Prize pool or reward highlight for competitions/hackathons',
    registered_count INT UNSIGNED NOT NULL DEFAULT 0,
    banner_url VARCHAR(255) NULL,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    status ENUM('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_events_organizer
        FOREIGN KEY (organizer_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_events_date_status (event_date, status),
    INDEX idx_events_category (category),
    INDEX idx_events_department (department_id),
    INDEX idx_events_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. REGISTRATIONS (CampusFlow Digital Passes)
-- Links a Student to an Event with a unique Pass ID, payment receipt, and lifecycle state
-- ============================================================================
CREATE TABLE registrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pass_id VARCHAR(40) NOT NULL UNIQUE COMMENT 'Unique Pass ID, e.g., CF-26-CSE-AI-00482',
    event_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    status ENUM('CONFIRMED', 'WAITLISTED', 'ATTENDED', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'CONFIRMED',
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('FREE', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'FREE',
    payment_method VARCHAR(40) NULL DEFAULT NULL,
    transaction_id VARCHAR(64) NULL DEFAULT NULL,
    team_name VARCHAR(80) NULL DEFAULT NULL,
    team_code VARCHAR(24) NULL DEFAULT NULL,
    team_members VARCHAR(255) NULL DEFAULT NULL,
    award_title VARCHAR(60) NULL DEFAULT NULL,
    verified_by INT UNSIGNED NULL COMMENT 'Organizer/Admin who verified attendance',
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attended_at TIMESTAMP NULL DEFAULT NULL,
    cancelled_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT uq_registration_event_student UNIQUE (event_id, student_id),
    CONSTRAINT fk_registrations_event
        FOREIGN KEY (event_id) REFERENCES events(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_registrations_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_registrations_verifier
        FOREIGN KEY (verified_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_registrations_pass_id (pass_id),
    INDEX idx_registrations_student_status (student_id, status),
    INDEX idx_registrations_event_status (event_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4B. PAYMENT ORDERS (2-Step OTP & HMAC-SHA256 Payment Verification)
-- ============================================================================
CREATE TABLE payment_orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(40) NOT NULL UNIQUE,
    event_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(40) NOT NULL,
    masked_instrument VARCHAR(120) NOT NULL,
    utr_reference VARCHAR(40) NULL,
    otp_code_hash VARCHAR(255) NOT NULL,
    failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('PENDING_OTP', 'VERIFIED', 'CONSUMED', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING_OTP',
    transaction_id VARCHAR(64) NULL UNIQUE,
    payment_signature VARCHAR(128) NULL,
    expires_at DATETIME NOT NULL,
    verified_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_order_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_pay_order_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_order_lookup (order_id, student_id, event_id),
    INDEX idx_order_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. ANNOUNCEMENTS
-- Campus-wide, Department-specific, or Event-specific updates
-- ============================================================================
CREATE TABLE announcements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('NORMAL', 'IMPORTANT', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    department_id INT UNSIGNED NULL COMMENT 'NULL = Campus-wide',
    event_id INT UNSIGNED NULL COMMENT 'NULL = General announcement, or tied to a specific event',
    author_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcements_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_announcements_event
        FOREIGN KEY (event_id) REFERENCES events(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_announcements_author
        FOREIGN KEY (author_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_announcements_priority_created (priority, created_at),
    INDEX idx_announcements_department (department_id),
    INDEX idx_announcements_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. SAVED EVENTS (Student Bookmarks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    event_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_saved_user_event UNIQUE (user_id, event_id),
    CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_saved_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. EVENT FEEDBACK (Post-Event Ratings & Reviews)
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_feedback (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL DEFAULT 5 COMMENT '1 to 5 stars',
    comment TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_feedback_event_student UNIQUE (event_id, student_id),
    CONSTRAINT fk_feedback_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_feedback_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. USER REMINDERS (Personal Calendar Marks & Reminders)
-- ============================================================================
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

