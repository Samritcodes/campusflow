<?php
// backend/api/announcements/create.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$user = requireRole([ROLE_ORGANIZER, ROLE_DEPT_MANAGER, ROLE_ADMIN]);
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$title        = trim($input['title'] ?? '');
$message      = trim($input['message'] ?? '');
$priority     = strtoupper(trim($input['priority'] ?? 'NORMAL'));
$departmentId = !empty($input['department_id']) ? (int) $input['department_id'] : null;
$eventId      = !empty($input['event_id']) ? (int) $input['event_id'] : null;

if ($title === '' || $message === '') {
    sendResponse(false, 'Title and message are required', null, 422);
}

if (!in_array($priority, ['NORMAL', 'IMPORTANT', 'URGENT'], true)) {
    $priority = 'NORMAL';
}

$pdo = getDBConnection();

$stmt = $pdo->prepare("
    INSERT INTO announcements (title, message, priority, department_id, event_id, author_id)
    VALUES (:title, :message, :priority, :department_id, :event_id, :author_id)
");
$stmt->execute([
    'title'         => $title,
    'message'       => $message,
    'priority'      => $priority,
    'department_id' => $departmentId,
    'event_id'      => $eventId,
    'author_id'     => $user['id'],
]);

sendResponse(true, 'Announcement published', [
    'id' => (int) $pdo->lastInsertId(),
], 201);
