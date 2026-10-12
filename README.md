# CampusFlow 🎓

> **Full-Stack University Event Management, Discovery & Participation Ecosystem**  
> Built with **React 19**, **Vite**, **Tailwind CSS v4**, **PHP 8.2 REST APIs**, and **MySQL/MariaDB**.

---

## 🌟 Overview

**CampusFlow** is a modern, high-performance university event management and student participation platform. It connects students, department heads, and campus event organizers into a single unified workspace with editorial styling, verified digital passes, cryptographic payment security, personal calendars, co-curricular transcripts, and community teammate networking.

---

## 🚀 Key Features

### 1. 🎯 Personalized Campus Feed ("For You" vs "All Events")
- **Student Interest Matching:** Students select from curated campus interests (AI, Web, Hackathons, Cultural, Robotics, IoT, Design, etc.) during onboarding or in their profile.
- **Follow Campus Communities:** Follow specific departments and clubs (CSE, AIML, ECE, ME, CULT) to receive prioritized event feeds.
- **"For You" Dynamic Feed:** Ranked by interest alignment and followed clubs, complete with contextual recommendation badges (`✦ Followed (AIML)`, `✦ Interest: AI`).

### 2. 🤝 Campus Community & Teammate Finder
- **Consent-Based Attendee Directory:** Students can opt in to share their profile in event attendee directories for networking.
- **Teammate Finder:** Flag your profile as **"Looking for Teammates"** with a custom skills pitch to connect with squads.
- **Squad Code Join:** Teammates can enter squad codes (`TEAM-XXXX`) to link their individual verified passes and certificates directly to the team leader's squad.
- **Interactive Event Discussions & Q&A:** Students post questions or squad pitches, with organizers pinning FAQs and issuing official responses.

### 3. 💳 2-Step Server-Verified Payment Gateway
- **Cryptographic Security:** Built-in challenge-response payment gateway verifying 6-digit Card OTPs and 12-digit UPI UTRs.
- **HMAC-SHA256 Signatures:** Prevents client-side spoofing; passes are only generated upon strict server-side order consumption.
- **Single-Use Orders & Attempt Locks:** Prevents replay attacks and secures paid events and hackathons.

### 4. 🎫 Digital Pass Wallet, Merit Certificates & CCA Transcript
- **Verified Pass IDs:** Instant digital ticket generation (`CF-26-DEPT-EVT-XXXXX`).
- **Official Participation & Merit Certificates:** High-res, printable certificates with official seals, verifiable verification hashes, and podium awards (`1st Place Winner`, `2nd Place Runner-Up`, etc.).
- **Co-Curricular Activity (CCA) Transcript:** Comprehensive printable transcript summarizing total attended events, merit podiums, and calculated CCA Activity Points for placement resumes.

### 5. 📅 Personal Campus Calendar & Reminders
- **Monthly Interactive Calendar:** View campus events alongside color-coded personal reminders (`Vermilion` for Exams/Urgent, `Emerald` for Event Prep, `Amber` for Deadlines, `Indigo` for Notes).
- **1-Click Event Reminders:** Pin reminders directly from any Event Details page.
- **`.ics` Calendar Export:** Download calendar files to import into Google Calendar or Apple Calendar.

### 6. 📁 Event Resource Hub
- Organizers attach problem statements, workshop slide decks, starter GitHub repos, or photo galleries directly to event listings.

### 7. ⚡ Global Command Palette (`Ctrl + K`)
- Instant search modal across campus events, workspaces, departments, announcements, and reminders.

### 8. 🛡️ Role-Based Workspaces
- **Student Workspace:** Overview, Discover, Personalized Feed, Digital Pass Wallet, Calendar & Reminders, Announcements, Profile.
- **Organizer Workspace:** Event Creation & Editing, Live Attendee Roster with UTF-8 CSV Export, Entry Desk Pass Verification, Podium Award Assignment.
- **Admin Workspace:** System Metrics, Department Management, Role Provisioning, Campus Bulletins, Analytics & Insights.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS v4, Lucide React, React Router v7.
- **Backend:** PHP 8.2+ Object-Oriented RESTful Architecture.
- **Database:** MySQL 8.0+ / MariaDB 10.4+ (`campusflow`).
- **Styling:** CampusFlow Signature Editorial Theme (`#C84B31` Vermilion Primary with Dark/Light mode support).

---

## 💻 Local Setup & Installation

### Prerequisites
1. **XAMPP / WampServer** (PHP 8.2+, MySQL / MariaDB, Apache).
2. **Node.js** (v18+ or v20+).
3. **Git**.

### 1. Database Setup
1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Open terminal and run:
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS campusflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root campusflow < backend/database/schema.sql
mysql -u root campusflow < backend/database/migration_payment_security.sql
mysql -u root campusflow < backend/database/migration_calendar_reminders.sql
mysql -u root campusflow < backend/database/migration_community_and_feed.sql
```

### 2. Backend API
- Ensure Apache is configured to serve the `backend/` directory or place the project root in your local web server root (e.g. `http://localhost/CampusFlow/backend/api/...`).

### 3. Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📄 License
Academic & Educational Project — Developed for CampusFlow.
