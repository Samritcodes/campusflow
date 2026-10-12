-- backend/database/migration_payments.sql
-- Non-destructive migration for Paid Events, Prize Pools, and Payment Gateway Receipts

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS registration_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER capacity,
    ADD COLUMN IF NOT EXISTS prize_pool VARCHAR(100) NULL DEFAULT NULL AFTER registration_fee;

ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER status,
    ADD COLUMN IF NOT EXISTS payment_status ENUM('FREE', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'FREE' AFTER amount_paid,
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(40) NULL DEFAULT NULL AFTER payment_status,
    ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(64) NULL DEFAULT NULL AFTER payment_method;

-- Populate registration fees and prize pools on CampusFlow events
UPDATE events SET registration_fee = 299.00, prize_pool = '₹50,000 + Internships' WHERE id = 1;
UPDATE events SET registration_fee = 149.00, prize_pool = 'Compute Vouchers + Certificate' WHERE id = 2;
UPDATE events SET registration_fee = 199.00, prize_pool = '₹25,000 Band & Solo Prizes' WHERE id = 3;
UPDATE events SET registration_fee = 0.00,   prize_pool = NULL WHERE id = 4;
UPDATE events SET registration_fee = 249.00, prize_pool = '₹30,000 Robotics Challenge' WHERE id = 5;
UPDATE events SET registration_fee = 0.00,   prize_pool = NULL WHERE id = 6;

-- Backfill existing registrations for paid events with realistic payment receipts
UPDATE registrations r
INNER JOIN events e ON r.event_id = e.id
SET
    r.amount_paid = e.registration_fee,
    r.payment_status = CASE
        WHEN e.registration_fee > 0 AND r.status = 'CANCELLED' THEN 'REFUNDED'
        WHEN e.registration_fee > 0 THEN 'PAID'
        ELSE 'FREE'
    END,
    r.payment_method = CASE
        WHEN e.registration_fee > 0 THEN COALESCE(r.payment_method, 'UPI / QR')
        ELSE 'FREE_ENTRY'
    END,
    r.transaction_id = CASE
        WHEN e.registration_fee > 0 THEN COALESCE(r.transaction_id, CONCAT('TXN-CF26-', LPAD((r.id * 17389) % 900000 + 100000, 6, '0')))
        ELSE NULL
    END;
