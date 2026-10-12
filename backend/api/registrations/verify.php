<?php
// backend/api/registrations/verify.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$verifier = requireRole([ROLE_ORGANIZER, ROLE_DEPT_MANAGER, ROLE_ADMIN]);
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$passId = strtoupper(trim($input['pass_id'] ?? ''));
$action = trim($input['action'] ?? 'lookup'); // 'lookup' or 'mark_attended'

if ($passId === '') {
    sendResponse(false, 'Please enter a Pass ID (e.g., CF-26-CSE-AI-00482)', null, 422);
}

$pdo = getDBConnection();

$sql = "
    SELECT
        r.id,
        r.pass_id,
        r.status,
        r.amount_paid,
        r.payment_status,
        r.payment_method,
        r.transaction_id,
        r.registered_at,
        r.attended_at,
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
        d.code AS department_code,
        d.name AS department_name,
        u.id AS student_id,
        u.full_name AS student_name,
        u.email AS student_email,
        u.year_of_study,
        u.roll_number,
        ud.code AS student_department_code
    FROM registrations r
    INNER JOIN events e ON r.event_id = e.id
    INNER JOIN departments d ON e.department_id = d.id
    INNER JOIN users u ON r.student_id = u.id
    LEFT JOIN departments ud ON u.department_id = ud.id
    WHERE r.pass_id = :pass_id
    LIMIT 1
";

$stmt = $pdo->prepare($sql);
$stmt->execute(['pass_id' => $passId]);
$pass = $stmt->fetch();

if (!$pass) {
    sendResponse(false, 'PASS NOT FOUND — No registration matches ' . $passId, null, 404);
}

if ($action === 'mark_attended') {
    if ($pass['status'] === 'CANCELLED') {
        sendResponse(false, 'Cannot mark attendance on a CANCELLED pass', ['pass' => $pass], 400);
    }

    $upd = $pdo->prepare("
        UPDATE registrations
        SET status = 'ATTENDED', attended_at = NOW(), verified_by = :verifier_id
        WHERE id = :id
    ");
    $upd->execute([
        'verifier_id' => $verifier['id'],
        'id'          => $pass['id'],
    ]);

    $stmt->execute(['pass_id' => $passId]);
    $pass = $stmt->fetch();

    sendResponse(true, 'Attendance marked! Participant status updated to ATTENDED.', [
        'pass' => $pass,
    ]);
}

sendResponse(true, 'Valid CampusFlow Pass verified', [
    'pass' => $pass,
]);
