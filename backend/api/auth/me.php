<?php
// backend/api/auth/me.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$sessionUser = getAuthenticatedUser();

if (!$sessionUser || empty($sessionUser['id'])) {
    sendResponse(true, 'No active session', [
        'user'  => null,
        'stats' => null,
    ]);
}

$pdo = getDBConnection();

// Refresh user from database
$stmt = $pdo->prepare("
    SELECT
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.department_id,
        u.year_of_study,
        u.roll_number,
        u.interests,
        u.is_active,
        d.code AS department_code,
        d.name AS department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = :id
    LIMIT 1
");
$stmt->execute(['id' => $sessionUser['id']]);
$user = $stmt->fetch();

if (!$user || !(int) $user['is_active']) {
    $_SESSION = [];
    session_destroy();
    sendResponse(true, 'Session expired', ['user' => null, 'stats' => null]);
}

$_SESSION['user'] = $user;

$deptId = !empty($user['department_id']) ? (int) $user['department_id'] : null;
$isDeptScopedStaff = in_array($user['role'], [ROLE_ORGANIZER, ROLE_DEPT_MANAGER], true) && $deptId !== null;

if ($isDeptScopedStaff) {
    $upcomingEventsCount = (int) $pdo->query("SELECT COUNT(*) FROM events WHERE status = 'UPCOMING' AND department_id = $deptId")->fetchColumn();
    $totalRegistrationsCount = (int) $pdo->query("
        SELECT COUNT(*)
        FROM registrations r
        INNER JOIN events e ON r.event_id = e.id
        WHERE e.department_id = $deptId AND r.status != 'CANCELLED'
    ")->fetchColumn();
    $totalUsersCount = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE department_id = $deptId")->fetchColumn();
} else {
    $upcomingEventsCount = (int) $pdo->query("SELECT COUNT(*) FROM events WHERE status = 'UPCOMING'")->fetchColumn();
    $totalRegistrationsCount = (int) $pdo->query("SELECT COUNT(*) FROM registrations WHERE status != 'CANCELLED'")->fetchColumn();
    $totalUsersCount = (int) $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
}

$myPassesCount = (int) $pdo->query("SELECT COUNT(*) FROM registrations WHERE student_id = " . (int) $user['id'] . " AND status IN ('CONFIRMED', 'WAITLISTED', 'ATTENDED')")->fetchColumn();
$departmentsCount = (int) $pdo->query("SELECT COUNT(*) FROM departments")->fetchColumn();

// Fetch student's passes if STUDENT
$myPasses = [];
if ($user['role'] === ROLE_STUDENT) {
    $passStmt = $pdo->prepare("
        SELECT
            r.id,
            r.pass_id,
            r.status,
            r.amount_paid,
            r.payment_status,
            r.payment_method,
            r.transaction_id,
            r.team_name,
            r.team_code,
            r.team_members,
            r.award_title,
            r.registered_at,
            e.id AS event_id,
            e.title AS event_title,
            e.slug AS event_slug,
            e.banner_url,
            e.category,
            e.venue,
            e.event_date,
            e.start_time,
            e.end_time,
            e.registration_fee,
            e.prize_pool,
            d.code AS department_code,
            d.name AS department_name,
            u.full_name AS student_name,
            u.year_of_study,
            u.roll_number,
            ud.code AS student_department_code
        FROM registrations r
        INNER JOIN events e ON r.event_id = e.id
        INNER JOIN departments d ON e.department_id = d.id
        INNER JOIN users u ON r.student_id = u.id
        LEFT JOIN departments ud ON u.department_id = ud.id
        WHERE r.student_id = :student_id
        ORDER BY r.registered_at DESC
    ");
    $passStmt->execute(['student_id' => $user['id']]);
    $myPasses = $passStmt->fetchAll();
}

// Fetch announcements scoped to user's department (plus campus-wide NULL department announcements), or all for ADMIN
$annWhere = ($user['role'] !== ROLE_ADMIN && $deptId !== null)
    ? "WHERE (a.department_id IS NULL OR a.department_id = $deptId)"
    : "";

$annStmt = $pdo->query("
    SELECT
        a.id,
        a.title,
        a.message,
        a.priority,
        a.created_at,
        u.full_name AS author_name,
        u.role AS author_role,
        d.code AS department_code,
        e.title AS event_title
    FROM announcements a
    INNER JOIN users u ON a.author_id = u.id
    LEFT JOIN departments d ON a.department_id = d.id
    LEFT JOIN events e ON a.event_id = e.id
    $annWhere
    ORDER BY a.created_at DESC
    LIMIT 5
");
$announcements = $annStmt->fetchAll();

sendResponse(true, 'Session active', [
    'user'          => $user,
    'stats'         => [
        'upcoming_events'     => $upcomingEventsCount,
        'my_passes'           => $myPassesCount,
        'total_users'         => $totalUsersCount,
        'total_registrations' => $totalRegistrationsCount,
        'departments'         => $departmentsCount,
    ],
    'my_passes'     => $myPasses,
    'announcements' => $announcements,
]);
