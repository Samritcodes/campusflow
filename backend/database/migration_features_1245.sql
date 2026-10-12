-- backend/database/migration_features_1245.sql
-- Non-destructive migration for:
-- #1 Team Registration (team_name, team_code, team_members on registrations)
-- #2 Winners Podium & Merit Certificates (award_title on registrations)
-- #5 Event Schedule Itinerary & Competition Rules (agenda_text, rules_text on events)

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS agenda_text TEXT NULL DEFAULT NULL AFTER description,
    ADD COLUMN IF NOT EXISTS rules_text TEXT NULL DEFAULT NULL AFTER agenda_text;

ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS team_name VARCHAR(80) NULL DEFAULT NULL AFTER transaction_id,
    ADD COLUMN IF NOT EXISTS team_code VARCHAR(24) NULL DEFAULT NULL AFTER team_name,
    ADD COLUMN IF NOT EXISTS team_members VARCHAR(255) NULL DEFAULT NULL AFTER team_code,
    ADD COLUMN IF NOT EXISTS award_title VARCHAR(60) NULL DEFAULT NULL AFTER team_members;

-- Populate realistic Agenda Timelines & Rules for our 6 CampusFlow events
UPDATE events SET
    agenda_text = '09:15 AM | Team Check-In & Hardware Desk Verification\n10:00 AM | Opening Keynote & Problem Statement Reveal\n11:00 AM | 24-Hour Engineering Sprint Begins\n04:00 PM | Mentorship & Architecture Review Round 1\n05:30 PM | Final Jury Live Demos & Winner Crowning',
    rules_text  = '• Teams of 1 to 4 university students with valid CampusFlow Pass IDs.\n• All code and hardware prototypes must be built during the hackathon window.\n• Open-source libraries and public APIs are permitted; pre-built projects are disqualified.'
WHERE id = 1;

UPDATE events SET
    agenda_text = '09:45 AM | Lab Workstation Setup & Dataset Provisioning\n10:00 AM | Session 1: LoRA & QLoRA Fine-Tuning Architecture\n11:30 AM | Hands-On Lab: Retrieval-Augmented Generation Pipelines\n12:30 PM | Latency Benchmarking & Compute Voucher Distribution',
    rules_text  = '• Bring your laptop with Python 3.11+ and Git installed.\n• Cloud GPU compute vouchers are issued upon Entry Desk pass check-in.'
WHERE id = 2;

UPDATE events SET
    agenda_text = '05:30 PM | Amphitheatre Gates Open & Pass Scanning\n06:00 PM | Acoustic Ensembles & Classical Fusion Showcase\n07:30 PM | Contemporary Theatre & Spotlight Act\n08:45 PM | Battle of the Bands Finale & Audience Vote',
    rules_text  = '• Carry your CampusFlow Digital Pass for amphitheatre entry.\n• Band & solo performers must report backstage 45 minutes prior to their slot.'
WHERE id = 3;

UPDATE events SET
    agenda_text = '02:00 PM | Keynote: Distributed State & Edge Rendering at Scale\n03:15 PM | Case Study: High-Throughput Relational Indexing\n04:00 PM | Open Q&A with Systems Engineering Panel',
    rules_text  = '• Open to all departments (Free Campus Entry).\n• Seating is allocated on a first-come basis for confirmed pass holders.'
WHERE id = 4;

UPDATE events SET
    agenda_text = '11:00 AM | Safety Briefing & Hardware Kit Handout\n11:30 AM | PID Controller Calibration & Brushless Motor Lab\n01:30 PM | LiDAR SLAM Obstacle Course Trial\n02:30 PM | Autonomous Time-Trial Showdown',
    rules_text  = '• Teams of 1 to 3 students.\n• Lab safety gear and LiDAR kits are provided at Robotics Bay, Block C.'
WHERE id = 5;

UPDATE events SET
    agenda_text = '04:00 PM | Fireside Chat: Shipping Products from the Dorm Room\n05:00 PM | Raising Seed to Series A: What Founders Wish They Knew\n05:30 PM | Student Pitch Clinic & Networking',
    rules_text  = '• Open to all students and faculty.\n• Prepare a 60-second product idea if you wish to join the pitch clinic.'
WHERE id = 6;

-- Populate sample Team Info on Arav Mehta's Hackathon pass (id = 2) so Team Roster works out of the box
UPDATE registrations
SET team_name = 'Team NeuralForge',
    team_code = 'TEAM-NF82',
    team_members = 'Rohan Sharma (CSE), Ananya Roy (AIML)'
WHERE id = 2 AND team_name IS NULL;
