-- backend/database/migration_payment_security.sql
-- Server-side Payment Order, 3DS/UPI OTP Challenge, UTR Reference & HMAC Verification Table

USE campusflow;

CREATE TABLE IF NOT EXISTS payment_orders (
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
