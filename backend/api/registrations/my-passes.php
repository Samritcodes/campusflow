<?php
// backend/api/registrations/my-passes.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();
$pdo = getDBConnection();

$stmt = $pdo->prepare("
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
        r.attended_at,
        r.cancelled_at,
        e.id AS event_id,
        e.title AS event_title,
        e.slug AS event_slug,
        e.category,
        e.venue,
        e.event_date,
        e.start_time,
        e.end_time,
        e.registration_fee,
        e.prize_pool,
        e.banner_url,
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
    WHERE r.student_id = :uid
    ORDER BY r.registered_at DESC
");
$stmt->execute(['uid' => $user['id']]);
$passes = $stmt->fetchAll();

sendResponse(true, 'Passes fetched successfully', [
    'passes' => $passes,
]);
