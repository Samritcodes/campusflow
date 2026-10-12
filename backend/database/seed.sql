-- backend/database/seed.sql
-- CampusFlow — Seed Data with Real Campus Event Photography
-- Default password for all accounts: password123

-- 1. Seed Departments
INSERT INTO departments (id, code, name, description) VALUES
(1, 'CSE',  'Computer Science & Engineering', 'Systems architecture, software engineering, and distributed computing.'),
(2, 'AIML', 'Artificial Intelligence & ML',   'Machine intelligence, neural computation, and applied data science.'),
(3, 'ECE',  'Electronics & Communication',    'VLSI design, embedded robotics, signal processing, and IoT.'),
(4, 'ME',   'Mechanical Engineering',         'Autonomous robotics, CAD/CAM, sustainable energy, and manufacturing.'),
(5, 'CULT', 'Student Cultural Council',       'Performing arts, live music, theatre, literary society, and film club.');

-- 2. Seed Users across all 4 roles (Password for all: password123)
INSERT INTO users (id, full_name, email, password_hash, role, department_id, year_of_study, roll_number, interests) VALUES
(1, 'Arav Mehta',          'arav@campusflow.edu',        '$2y$10$2TbXMyJms15M72Rxd3eip.YJcGpFiU4v74IJU7WooTcG1cN7f.tuG', 'STUDENT',            1, '3rd Year', 'CF2024CSE042', 'AI,Web,Hackathon,Cultural'),
(2, 'Dr. Priya Mehta',     'priya.mehta@campusflow.edu', '$2y$10$2TbXMyJms15M72Rxd3eip.YJcGpFiU4v74IJU7WooTcG1cN7f.tuG', 'ORGANIZER',          2, 'N/A',      NULL,           'AI,Workshop,Tech Talk'),
(3, 'Ram Prakash Pradhan', 'ram.pradhan@campusflow.edu', '$2y$10$2TbXMyJms15M72Rxd3eip.YJcGpFiU4v74IJU7WooTcG1cN7f.tuG', 'DEPARTMENT_MANAGER', 1, 'N/A',      NULL,           'CSE,AI,Seminar'),
(4, 'Samrit Kumar Bhutia', 'samrit@campusflow.edu',      '$2y$10$2TbXMyJms15M72Rxd3eip.YJcGpFiU4v74IJU7WooTcG1cN7f.tuG', 'ADMIN',              NULL, 'N/A',   NULL,           'Campus,Admin');

-- 3. Seed Events with Real Editorial Photography, Entry Fees & Prize Pools
INSERT INTO events (
    id, title, slug, event_code, category, description,
    department_id, organizer_id, venue, event_date, start_time, end_time,
    capacity, registration_fee, prize_pool, registered_count, banner_url, is_featured, status
) VALUES
(
    1,
    'TechNova ''26 — Inter-College Hackathon',
    'technova-26-inter-college-hackathon',
    'HACK',
    'Hackathon',
    'A 24-hour intensive engineering sprint bringing together student builders across 12 departments to prototype civic tech, AI tooling, and hardware systems. Includes midnight mentoring sessions with alumni engineers and live demo judging in the Main Auditorium.',
    1, 2,
    'Main Auditorium',
    '2026-10-18', '10:00:00', '18:00:00',
    150, 299.00, '₹50,000 + Internships', 124,
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=85',
    1, 'UPCOMING'
),
(
    2,
    'Applied Neural Systems & LLM Workshop',
    'applied-neural-systems-llm-workshop',
    'AI',
    'Workshop',
    'Hands-on laboratory session on fine-tuning open-weight language models, building retrieval pipelines, and evaluating latency on edge hardware. Participants receive a compute voucher and dataset kit prior to the session.',
    2, 2,
    'Seminar Hall 2',
    '2026-10-19', '10:00:00', '13:00:00',
    120, 149.00, 'Compute Vouchers + Certificate', 96,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    1, 'UPCOMING'
),
(
    3,
    'Resonance — Autumn Cultural Night',
    'resonance-autumn-cultural-night',
    'CULT',
    'Cultural',
    'An evening under the lights featuring campus indie bands, acoustic ensembles, contemporary theatre, and classical fusion by the Student Cultural Council.',
    5, 2,
    'Open Air Amphitheatre',
    '2026-10-21', '18:00:00', '22:00:00',
    500, 199.00, '₹25,000 Band & Solo Prizes', 382,
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    1, 'UPCOMING'
),
(
    4,
    'Modern Web Architecture & Systems Colloquium',
    'modern-web-architecture-colloquium',
    'WEB',
    'Seminar',
    'An engineering colloquium examining distributed state, edge rendering, relational indexing under load, and pragmatic API design for high-traffic products.',
    1, 3,
    'Lecture Theatre 4',
    '2026-10-24', '14:00:00', '16:30:00',
    200, 0.00, NULL, 148,
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    0, 'UPCOMING'
),
(
    5,
    'Autonomous Robotics & Embedded Control Lab',
    'autonomous-robotics-embedded-control-lab',
    'ROBO',
    'Workshop',
    'Build and calibrate PID controllers, LiDAR SLAM pipelines, and brushless motor drivers with the ECE & Mechanical Robotics Collective.',
    3, 2,
    'Robotics Bay, Block C',
    '2026-10-27', '11:00:00', '15:00:00',
    60, 249.00, '₹30,000 Robotics Challenge', 54,
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    0, 'UPCOMING'
),
(
    6,
    'Founder Stories: From Dorm Room to Series A',
    'founder-stories-dorm-room-to-series-a',
    'TALK',
    'Tech Talk',
    'A candid fireside conversation with three alumni founders on building technical products while still in university, shipping early, and finding first users.',
    1, 3,
    'Senate Chamber',
    '2026-10-30', '16:00:00', '18:00:00',
    180, 0.00, NULL, 112,
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    0, 'UPCOMING'
);

-- 4. Seed Registrations (Digital Passes for Student Arav Mehta, id = 1)
INSERT INTO registrations (id, pass_id, event_id, student_id, status, amount_paid, payment_status, payment_method, transaction_id, registered_at) VALUES
(1, 'CF-26-CSE-AI-00482',   2, 1, 'CONFIRMED', 149.00, 'PAID', 'UPI / QR', 'TXN-CF26-117389', NOW()),
(2, 'CF-26-CSE-HACK-00483', 1, 1, 'CONFIRMED', 299.00, 'PAID', 'UPI / QR', 'TXN-CF26-134778', NOW());

-- 5. Seed Announcements
INSERT INTO announcements (title, message, priority, department_id, event_id, author_id) VALUES
(
    'TechNova ''26 Team Check-In & Hardware Desk',
    'Team table assignments open at 9:15 AM in the Main Auditorium foyer. Please carry your CampusFlow Pass ID for fast-track entry.',
    'IMPORTANT',
    1, 1, 2
),
(
    'Pre-Workshop Setup: Applied Neural Systems',
    'Registered students should clone the starter repository and verify Python 3.11+ before arriving at Seminar Hall 2.',
    'NORMAL',
    2, 2, 2
),
(
    'Autumn Semester Event Calendar Published',
    'All department symposiums, workshops, and cultural showcases are now unified on CampusFlow.',
    'URGENT',
    NULL, NULL, 4
);
