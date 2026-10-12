<?php
// backend/api/events/create.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$user = requireRole([ROLE_ORGANIZER, ROLE_DEPT_MANAGER, ROLE_ADMIN]);
$input = json_decode(file_get_contents('php://input'), true) ?? [];

$title           = trim($input['title'] ?? '');
$eventCode       = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', trim($input['event_code'] ?? 'EVT')));
$category        = trim($input['category'] ?? 'Workshop');
$description     = trim($input['description'] ?? '');
$agendaText      = trim($input['agenda_text'] ?? '');
$rulesText       = trim($input['rules_text'] ?? '');
$departmentId    = !empty($input['department_id']) ? (int) $input['department_id'] : (int) ($user['department_id'] ?? 1);
$venue           = trim($input['venue'] ?? '');
$eventDate       = trim($input['event_date'] ?? '');
$startTime       = trim($input['start_time'] ?? '10:00');
$endTime         = trim($input['end_time'] ?? '13:00');
$capacity        = max(1, (int) ($input['capacity'] ?? 100));
$registrationFee = max(0, round((float) ($input['registration_fee'] ?? 0), 2));
$prizePool       = trim($input['prize_pool'] ?? '');
$bannerUrl       = trim($input['banner_url'] ?? '');
$isFeatured      = !empty($input['is_featured']) ? 1 : 0;

if ($title === '' || $description === '' || $venue === '' || $eventDate === '') {
    sendResponse(false, 'Title, description, venue, and event date are required', null, 422);
}

if ($eventCode === '') {
    $eventCode = 'EVT';
}
$eventCode = substr($eventCode, 0, 10);

// Generate unique slug
$baseSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $title), '-'));
$slug = $baseSlug . '-' . substr(uniqid(), -4);

if ($bannerUrl === '') {
    $bannerUrl = 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80';
}

$pdo = getDBConnection();

$stmt = $pdo->prepare("
    INSERT INTO events (
        title, slug, event_code, category, description, agenda_text, rules_text,
        department_id, organizer_id, venue, event_date,
        start_time, end_time, capacity, registration_fee, prize_pool, registered_count,
        banner_url, is_featured, status
    ) VALUES (
        :title, :slug, :event_code, :category, :description, :agenda_text, :rules_text,
        :department_id, :organizer_id, :venue, :event_date,
        :start_time, :end_time, :capacity, :registration_fee, :prize_pool, 0,
        :banner_url, :is_featured, 'UPCOMING'
    )
");

$stmt->execute([
    'title'            => $title,
    'slug'             => $slug,
    'event_code'       => $eventCode,
    'category'         => $category,
    'description'      => $description,
    'agenda_text'      => $agendaText !== '' ? $agendaText : null,
    'rules_text'       => $rulesText !== '' ? $rulesText : null,
    'department_id'    => $departmentId,
    'organizer_id'     => $user['id'],
    'venue'            => $venue,
    'event_date'       => $eventDate,
    'start_time'       => strlen($startTime) === 5 ? $startTime . ':00' : $startTime,
    'end_time'         => strlen($endTime) === 5 ? $endTime . ':00' : $endTime,
    'capacity'         => $capacity,
    'registration_fee' => $registrationFee,
    'prize_pool'       => $prizePool !== '' ? $prizePool : null,
    'banner_url'       => $bannerUrl,
    'is_featured'      => $isFeatured,
]);

$eventId = (int) $pdo->lastInsertId();

sendResponse(true, 'Event published to CampusFlow calendar', [
    'id'   => $eventId,
    'slug' => $slug,
], 201);
