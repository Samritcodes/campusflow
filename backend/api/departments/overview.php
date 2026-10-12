<?php
// backend/api/departments/overview.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$pdo = getDBConnection();
$sessionUser = getAuthenticatedUser();

// Fetch departments with live MySQL counts and department lead
$sql = "
    SELECT
        d.id,
        d.code,
        d.name,
        d.description,
        (
            SELECT COUNT(*)
            FROM events e
            WHERE e.department_id = d.id AND e.status != 'CANCELLED'
        ) AS event_count,
        (
            SELECT COUNT(*)
            FROM users u
            WHERE u.department_id = d.id AND u.role = 'STUDENT'
        ) AS student_count,
        (
            SELECT COALESCE(SUM(e2.registered_count), 0)
            FROM events e2
            WHERE e2.department_id = d.id
        ) AS total_registrations,
        (
            SELECT COUNT(*)
            FROM department_follows df
            WHERE df.department_id = d.id
        ) AS follower_count,
        (
            SELECT u2.full_name
            FROM users u2
            WHERE u2.department_id = d.id
              AND u2.role IN ('DEPARTMENT_MANAGER', 'ORGANIZER')
            ORDER BY FIELD(u2.role, 'DEPARTMENT_MANAGER', 'ORGANIZER')
            LIMIT 1
        ) AS lead_name,
        (
            SELECT u2.role
            FROM users u2
            WHERE u2.department_id = d.id
              AND u2.role IN ('DEPARTMENT_MANAGER', 'ORGANIZER')
            ORDER BY FIELD(u2.role, 'DEPARTMENT_MANAGER', 'ORGANIZER')
            LIMIT 1
        ) AS lead_role
    FROM departments d
    ORDER BY d.id ASC
";

$departments = $pdo->query($sql)->fetchAll();

$followedMap = [];
if ($sessionUser && !empty($sessionUser['id'])) {
    $fStmt = $pdo->prepare("SELECT department_id FROM department_follows WHERE user_id = :uid");
    $fStmt->execute(['uid' => $sessionUser['id']]);
    foreach ($fStmt->fetchAll() as $fRow) {
        $followedMap[(int) $fRow['department_id']] = true;
    }
}

// Fetch upcoming events grouped by department_id
$evStmt = $pdo->query("
    SELECT
        e.id,
        e.title,
        e.slug,
        e.category,
        e.venue,
        e.event_date,
        e.start_time,
        e.capacity,
        e.registration_fee,
        e.prize_pool,
        e.registered_count,
        e.department_id,
        d.code AS department_code
    FROM events e
    INNER JOIN departments d ON e.department_id = d.id
    WHERE e.status != 'CANCELLED'
    ORDER BY e.event_date ASC, e.start_time ASC
");
$allEvents = $evStmt->fetchAll();

$eventsByDept = [];
foreach ($allEvents as $ev) {
    $deptId = (int) $ev['department_id'];
    if (!isset($eventsByDept[$deptId])) {
        $eventsByDept[$deptId] = [];
    }
    $eventsByDept[$deptId][] = $ev;
}

foreach ($departments as &$dept) {
    $dept['id']                  = (int) $dept['id'];
    $dept['event_count']         = (int) $dept['event_count'];
    $dept['student_count']       = (int) $dept['student_count'];
    $dept['total_registrations'] = (int) $dept['total_registrations'];
    $dept['follower_count']      = (int) ($dept['follower_count'] ?? 0);
    $dept['is_followed']         = !empty($followedMap[$dept['id']]);
    $dept['events']              = $eventsByDept[$dept['id']] ?? [];
}
unset($dept);

sendResponse(true, 'Departments overview fetched successfully', [
    'departments' => $departments,
]);
