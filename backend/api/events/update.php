<?php
// backend/api/events/update.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$user = requireRole([ROLE_ORGANIZER, ROLE_DEPT_MANAGER, ROLE_ADMIN]);
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$eventId = isset($input['event_id']) ? (int) $input['event_id'] : 0;
if ($eventId <= 0) {
    sendResponse(false, 'Valid event_id is required', null, 422);
}

$pdo = getDBConnection();

$evStmt = $pdo->prepare("SELECT * FROM events WHERE id = :id LIMIT 1");
$evStmt->execute(['id' => $eventId]);
$event = $evStmt->fetch();

if (!$event) {
    sendResponse(false, 'Event not found', null, 404);
}

if ($user['role'] !== ROLE_ADMIN && (int) $event['department_id'] !== (int) $user['department_id']) {
    sendResponse(false, 'You can only edit events belonging to your department', null, 403);
}

$title           = trim($input['title'] ?? $event['title']);
$category        = trim($input['category'] ?? $event['category']);
$description     = trim($input['description'] ?? $event['description']);
$agendaText      = array_key_exists('agenda_text', $input)
    ? trim((string) $input['agenda_text'])
    : (string) ($event['agenda_text'] ?? '');
$rulesText       = array_key_exists('rules_text', $input)
    ? trim((string) $input['rules_text'])
    : (string) ($event['rules_text'] ?? '');
$venue           = trim($input['venue'] ?? $event['venue']);
$eventDate       = trim($input['event_date'] ?? $event['event_date']);
$startTime       = trim($input['start_time'] ?? $event['start_time']);
$endTime         = trim($input['end_time'] ?? $event['end_time']);
$capacity        = max((int) $event['registered_count'], max(1, (int) ($input['capacity'] ?? $event['capacity'])));
$registrationFee = isset($input['registration_fee'])
    ? max(0, round((float) $input['registration_fee'], 2))
    : (float) $event['registration_fee'];
$prizePool       = array_key_exists('prize_pool', $input)
    ? trim((string) $input['prize_pool'])
    : (string) ($event['prize_pool'] ?? '');
$bannerUrl       = trim($input['banner_url'] ?? $event['banner_url']);

if ($title === '' || $description === '' || $venue === '' || $eventDate === '') {
    sendResponse(false, 'Title, description, venue, and event date cannot be empty', null, 422);
}

$upd = $pdo->prepare("
    UPDATE events
    SET
        title = :title,
        category = :category,
        description = :description,
        agenda_text = :agenda_text,
        rules_text = :rules_text,
        venue = :venue,
        event_date = :event_date,
        start_time = :start_time,
        end_time = :end_time,
        capacity = :capacity,
        registration_fee = :registration_fee,
        prize_pool = :prize_pool,
        banner_url = :banner_url
    WHERE id = :id
");

$upd->execute([
    'title'            => $title,
    'category'         => $category,
    'description'      => $description,
    'agenda_text'      => $agendaText !== '' ? $agendaText : null,
    'rules_text'       => $rulesText !== '' ? $rulesText : null,
    'venue'            => $venue,
    'event_date'       => $eventDate,
    'start_time'       => strlen($startTime) === 5 ? $startTime . ':00' : $startTime,
    'end_time'         => strlen($endTime) === 5 ? $endTime . ':00' : $endTime,
    'capacity'         => $capacity,
    'registration_fee' => $registrationFee,
    'prize_pool'       => $prizePool !== '' ? $prizePool : null,
    'banner_url'       => $bannerUrl,
    'id'               => $eventId,
]);

sendResponse(true, 'Event details updated successfully', [
    'event_id' => $eventId,
]);
