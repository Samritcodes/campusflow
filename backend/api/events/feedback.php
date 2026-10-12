<?php
// backend/api/events/feedback.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$user = requireAuth();
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$eventId = isset($input['event_id']) ? (int) $input['event_id'] : 0;
$rating  = isset($input['rating']) ? (int) $input['rating'] : 5;
$comment = trim($input['comment'] ?? '');

if ($eventId <= 0 || $rating < 1 || $rating > 5) {
    sendResponse(false, 'Valid event_id and rating (1 to 5 stars) are required', null, 422);
}

$pdo = getDBConnection();

// Verify student has a registration for this event
$regStmt = $pdo->prepare("SELECT status FROM registrations WHERE event_id = :eid AND student_id = :uid LIMIT 1");
$regStmt->execute(['eid' => $eventId, 'uid' => $user['id']]);
$reg = $regStmt->fetch();

if (!$reg || $reg['status'] === 'CANCELLED') {
    sendResponse(false, 'Only registered or attended participants can submit event feedback', null, 403);
}

$stmt = $pdo->prepare("
    INSERT INTO event_feedback (event_id, student_id, rating, comment)
    VALUES (:eid, :uid, :rating, :comment)
    ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        comment = VALUES(comment),
        created_at = CURRENT_TIMESTAMP
");
$stmt->execute([
    'eid'     => $eventId,
    'uid'     => $user['id'],
    'rating'  => $rating,
    'comment' => $comment !== '' ? $comment : null,
]);

sendResponse(true, 'Thank you! Your rating and feedback have been recorded.', [
    'rating'  => $rating,
    'comment' => $comment,
]);
