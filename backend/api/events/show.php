<?php
// backend/api/events/show.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$slug = trim($_GET['slug'] ?? '');
$id   = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($slug === '' && $id <= 0) {
    sendResponse(false, 'Event identifier (slug or id) is required', null, 422);
}

$pdo = getDBConnection();
$sessionUser = getAuthenticatedUser();

$whereClause = $slug !== '' ? 'e.slug = :val' : 'e.id = :val';
$paramVal    = $slug !== '' ? $slug : $id;

$sql = "
    SELECT
        e.id,
        e.title,
        e.slug,
        e.event_code,
        e.category,
        e.description,
        e.agenda_text,
        e.rules_text,
        e.venue,
        e.event_date,
        e.start_time,
        e.end_time,
        e.capacity,
        e.registration_fee,
        e.prize_pool,
        e.registered_count,
        e.banner_url,
        e.is_featured,
        e.status,
        d.id AS department_id,
        d.code AS department_code,
        d.name AS department_name,
        u.full_name AS organizer_name,
        u.email AS organizer_email
    FROM events e
    INNER JOIN departments d ON e.department_id = d.id
    INNER JOIN users u ON e.organizer_id = u.id
    WHERE $whereClause
    LIMIT 1
";

$stmt = $pdo->prepare($sql);
$stmt->execute(['val' => $paramVal]);
$event = $stmt->fetch();

if (!$event) {
    sendResponse(false, 'Event not found', null, 404);
}

$event['id']               = (int) $event['id'];
$event['capacity']         = (int) $event['capacity'];
$event['registration_fee'] = (float) $event['registration_fee'];
$event['registered_count'] = (int) $event['registered_count'];
$event['is_featured']      = (bool) $event['is_featured'];
$event['is_saved']         = false;
$event['my_registration']  = null;
$event['my_feedback']      = null;

if ($sessionUser && !empty($sessionUser['id'])) {
    $regStmt = $pdo->prepare("
        SELECT
            pass_id, status, amount_paid, payment_status, payment_method, transaction_id,
            team_name, team_code, team_members, award_title,
            share_profile, looking_for_team, teammate_note, registered_at
        FROM registrations
        WHERE event_id = :eid AND student_id = :uid
        LIMIT 1
    ");
    $regStmt->execute([
        'eid' => $event['id'],
        'uid' => $sessionUser['id'],
    ]);
    $reg = $regStmt->fetch();
    if ($reg) {
        $reg['amount_paid']      = (float) $reg['amount_paid'];
        $reg['share_profile']    = (bool) $reg['share_profile'];
        $reg['looking_for_team'] = (bool) $reg['looking_for_team'];
        $event['my_registration'] = $reg;
    }

    $savStmt = $pdo->prepare("SELECT id FROM saved_events WHERE event_id = :eid AND user_id = :uid LIMIT 1");
    $savStmt->execute(['eid' => $event['id'], 'uid' => $sessionUser['id']]);
    $event['is_saved'] = (bool) $savStmt->fetch();

    $myFbStmt = $pdo->prepare("SELECT rating, comment, created_at FROM event_feedback WHERE event_id = :eid AND student_id = :uid LIMIT 1");
    $myFbStmt->execute(['eid' => $event['id'], 'uid' => $sessionUser['id']]);
    $myFb = $myFbStmt->fetch();
    if ($myFb) {
        $myFb['rating'] = (int) $myFb['rating'];
        $event['my_feedback'] = $myFb;
    }
}

// Fetch event-specific announcements
$annStmt = $pdo->prepare("
    SELECT a.id, a.title, a.message, a.priority, a.created_at, u.full_name AS author_name
    FROM announcements a
    INNER JOIN users u ON a.author_id = u.id
    WHERE a.event_id = :eid
    ORDER BY a.created_at DESC
");
$annStmt->execute(['eid' => $event['id']]);
$event['announcements'] = $annStmt->fetchAll();

// Fetch Winners Podium (#2)
$winStmt = $pdo->prepare("
    SELECT
        r.pass_id,
        r.award_title,
        r.team_name,
        r.team_members,
        u.full_name AS student_name,
        d.code AS student_department_code
    FROM registrations r
    INNER JOIN users u ON r.student_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE r.event_id = :eid AND r.award_title IS NOT NULL AND r.award_title != ''
    ORDER BY FIELD(r.award_title, '1st Place Winner', '2nd Place Runner-Up', '3rd Place Winner', 'Finalist') ASC
");
$winStmt->execute(['eid' => $event['id']]);
$event['winners'] = $winStmt->fetchAll();

// Fetch Event Resource Hub & Materials
$resStmt = $pdo->prepare("
    SELECT
        er.id,
        er.title,
        er.resource_type,
        er.url,
        er.created_at,
        u.full_name AS added_by_name
    FROM event_resources er
    INNER JOIN users u ON er.added_by = u.id
    WHERE er.event_id = :eid
    ORDER BY er.created_at DESC
");
$resStmt->execute(['eid' => $event['id']]);
$event['resources'] = $resStmt->fetchAll();

// Fetch Campus Community: Consent-Based Attendee Directory & Teammate Finder
$commStmt = $pdo->prepare("
    SELECT
        r.student_id,
        r.status,
        r.team_name,
        r.team_code,
        r.team_members,
        r.looking_for_team,
        r.teammate_note,
        u.full_name AS student_name,
        u.year_of_study,
        u.interests,
        d.code AS student_department_code
    FROM registrations r
    INNER JOIN users u ON r.student_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE r.event_id = :eid
      AND r.status IN ('CONFIRMED', 'ATTENDED', 'WAITLISTED')
      AND r.share_profile = 1
    ORDER BY r.looking_for_team DESC, r.registered_at DESC
");
$commStmt->execute(['eid' => $event['id']]);
$commRows = $commStmt->fetchAll();
foreach ($commRows as &$cRow) {
    $cRow['student_id']       = (int) $cRow['student_id'];
    $cRow['looking_for_team'] = (bool) $cRow['looking_for_team'];
}
unset($cRow);
$event['community_attendees'] = $commRows;

// Fetch Event Discussion Spaces & Q&A Board
$discStmt = $pdo->prepare("
    SELECT
        ed.id,
        ed.user_id,
        ed.topic_tag,
        ed.message,
        ed.official_reply,
        ed.replied_at,
        ed.is_pinned,
        ed.created_at,
        u.full_name AS author_name,
        u.role AS author_role,
        u.year_of_study AS author_year,
        d.code AS author_department_code,
        ru.full_name AS replied_by_name,
        ru.role AS replied_by_role
    FROM event_discussions ed
    INNER JOIN users u ON ed.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN users ru ON ed.replied_by = ru.id
    WHERE ed.event_id = :eid
    ORDER BY ed.is_pinned DESC, ed.created_at DESC
");
$discStmt->execute(['eid' => $event['id']]);
$discRows = $discStmt->fetchAll();
foreach ($discRows as &$dRow) {
    $dRow['id']        = (int) $dRow['id'];
    $dRow['user_id']   = (int) $dRow['user_id'];
    $dRow['is_pinned'] = (bool) $dRow['is_pinned'];
}
unset($dRow);
$event['discussions'] = $discRows;

// Fetch event feedback & ratings
$fbStmt = $pdo->prepare("
    SELECT
        f.id,
        f.rating,
        f.comment,
        f.created_at,
        u.full_name AS student_name,
        d.code AS student_department_code
    FROM event_feedback f
    INNER JOIN users u ON f.student_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE f.event_id = :eid
    ORDER BY f.created_at DESC
");
$fbStmt->execute(['eid' => $event['id']]);
$feedbackRows = $fbStmt->fetchAll();
$ratingSum = 0;
foreach ($feedbackRows as &$fb) {
    $fb['rating'] = (int) $fb['rating'];
    $ratingSum += $fb['rating'];
}
unset($fb);
$event['feedback']       = $feedbackRows;
$event['feedback_count'] = count($feedbackRows);
$event['avg_rating']     = count($feedbackRows) > 0 ? round($ratingSum / count($feedbackRows), 1) : null;

sendResponse(true, 'Event details fetched successfully', [
    'event' => $event,
]);
