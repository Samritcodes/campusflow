<?php
// backend/api/events/bookmark.php

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

if ($eventId <= 0) {
    sendResponse(false, 'Valid event_id is required', null, 422);
}

$pdo = getDBConnection();

$chk = $pdo->prepare("SELECT id FROM saved_events WHERE user_id = :uid AND event_id = :eid LIMIT 1");
$chk->execute(['uid' => $user['id'], 'eid' => $eventId]);
$existing = $chk->fetch();

if ($existing) {
    $del = $pdo->prepare("DELETE FROM saved_events WHERE id = :id");
    $del->execute(['id' => $existing['id']]);
    sendResponse(true, 'Event removed from saved bookmarks', [
        'saved'    => false,
        'event_id' => $eventId,
    ]);
} else {
    $ins = $pdo->prepare("INSERT INTO saved_events (user_id, event_id) VALUES (:uid, :eid)");
    $ins->execute(['uid' => $user['id'], 'eid' => $eventId]);
    sendResponse(true, 'Event saved to your bookmarks', [
        'saved'    => true,
        'event_id' => $eventId,
    ]);
}
