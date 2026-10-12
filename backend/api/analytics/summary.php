<?php
// backend/api/analytics/summary.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireRole([ROLE_ORGANIZER, ROLE_DEPT_MANAGER, ROLE_ADMIN]);
$pdo = getDBConnection();

$isDeptScoped = ($user['role'] !== ROLE_ADMIN && !empty($user['department_id']));
$deptId = $isDeptScoped ? (int) $user['department_id'] : null;
$eventWhere = $isDeptScoped ? "WHERE e.department_id = $deptId" : "";
$eventWhereNoCancelled = $isDeptScoped
    ? "WHERE e.department_id = $deptId AND e.status != 'CANCELLED'"
    : "WHERE e.status != 'CANCELLED'";

// 1. Overall KPIs
$kpiSql = "
    SELECT
        COUNT(DISTINCT e.id) AS total_events,
        COALESCE(SUM(e.capacity), 0) AS total_capacity,
        COALESCE(SUM(e.registered_count), 0) AS total_registered,
        (
            SELECT COUNT(*)
            FROM registrations r
            INNER JOIN events ev ON r.event_id = ev.id
            WHERE r.status = 'ATTENDED' " . ($isDeptScoped ? "AND ev.department_id = $deptId" : "") . "
        ) AS total_attended,
        (
            SELECT COALESCE(SUM(r2.amount_paid), 0)
            FROM registrations r2
            INNER JOIN events ev2 ON r2.event_id = ev2.id
            WHERE r2.payment_status = 'PAID' " . ($isDeptScoped ? "AND ev2.department_id = $deptId" : "") . "
        ) AS total_revenue,
        (
            SELECT ROUND(AVG(f.rating), 1)
            FROM event_feedback f
            INNER JOIN events ev3 ON f.event_id = ev3.id
            " . ($isDeptScoped ? "WHERE ev3.department_id = $deptId" : "") . "
        ) AS avg_rating
    FROM events e
    $eventWhereNoCancelled
";
$kpis = $pdo->query($kpiSql)->fetch();

$totalCap = max(1, (int) ($kpis['total_capacity'] ?? 1));
$totalReg = (int) ($kpis['total_registered'] ?? 0);
$totalAtt = (int) ($kpis['total_attended'] ?? 0);

$fillRatePct = round(($totalReg / $totalCap) * 100, 1);
$attendanceConversionPct = $totalReg > 0 ? round(($totalAtt / $totalReg) * 100, 1) : 0.0;

// 2. Department Breakdown
$deptWhere = $isDeptScoped ? "WHERE d.id = $deptId" : "";
$deptSql = "
    SELECT
        d.id,
        d.code,
        d.name,
        COUNT(DISTINCT e.id) AS event_count,
        COALESCE(SUM(e.capacity), 0) AS capacity,
        COALESCE(SUM(e.registered_count), 0) AS registered,
        (
            SELECT COUNT(*)
            FROM registrations r
            INNER JOIN events ev ON r.event_id = ev.id
            WHERE ev.department_id = d.id AND r.status = 'ATTENDED'
        ) AS attended,
        (
            SELECT COALESCE(SUM(r2.amount_paid), 0)
            FROM registrations r2
            INNER JOIN events ev2 ON r2.event_id = ev2.id
            WHERE ev2.department_id = d.id AND r2.payment_status = 'PAID'
        ) AS revenue
    FROM departments d
    LEFT JOIN events e ON e.department_id = d.id AND e.status != 'CANCELLED'
    $deptWhere
    GROUP BY d.id, d.code, d.name
    ORDER BY registered DESC
";
$byDepartment = $pdo->query($deptSql)->fetchAll();

// 3. Category Breakdown
$catSql = "
    SELECT
        e.category,
        COUNT(*) AS event_count,
        COALESCE(SUM(e.capacity), 0) AS capacity,
        COALESCE(SUM(e.registered_count), 0) AS registered
    FROM events e
    $eventWhereNoCancelled
    GROUP BY e.category
    ORDER BY registered DESC
";
$byCategory = $pdo->query($catSql)->fetchAll();

// 4. Event Performance Table
$topEventsSql = "
    SELECT
        e.id,
        e.title,
        e.slug,
        e.category,
        e.event_date,
        e.capacity,
        e.registered_count,
        e.registration_fee,
        e.prize_pool,
        d.code AS department_code,
        (
            SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'ATTENDED'
        ) AS attended_count,
        (
            SELECT COALESCE(SUM(r2.amount_paid), 0) FROM registrations r2 WHERE r2.event_id = e.id AND r2.payment_status = 'PAID'
        ) AS revenue,
        (
            SELECT ROUND(AVG(f.rating), 1) FROM event_feedback f WHERE f.event_id = e.id
        ) AS avg_rating
    FROM events e
    INNER JOIN departments d ON e.department_id = d.id
    $eventWhereNoCancelled
    ORDER BY (e.registered_count / GREATEST(1, e.capacity)) DESC, e.registered_count DESC
";
$eventsPerformance = $pdo->query($topEventsSql)->fetchAll();

sendResponse(true, 'Analytics summary fetched successfully', [
    'kpis' => [
        'total_events'              => (int) ($kpis['total_events'] ?? 0),
        'total_capacity'            => (int) ($kpis['total_capacity'] ?? 0),
        'total_registered'          => $totalReg,
        'total_attended'            => $totalAtt,
        'fill_rate_pct'             => $fillRatePct,
        'attendance_conversion_pct' => $attendanceConversionPct,
        'total_revenue'             => (float) ($kpis['total_revenue'] ?? 0),
        'avg_rating'                => $kpis['avg_rating'] !== null ? (float) $kpis['avg_rating'] : 5.0,
    ],
    'by_department'      => $byDepartment,
    'by_category'        => $byCategory,
    'events_performance' => $eventsPerformance,
]);
