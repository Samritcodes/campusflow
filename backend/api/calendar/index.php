<?php
// backend/api/calendar/index.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();
$pdo  = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 1. Fetch user's personal calendar reminders
    $remStmt = $pdo->prepare("
        SELECT
            ur.id,
            ur.event_id,
            ur.title,
            ur.reminder_date,
            ur.reminder_time,
            ur.note,
            ur.color_tag,
            ur.is_completed,
            ur.created_at,
            e.title AS event_title,
            e.slug AS event_slug
        FROM user_reminders ur
        LEFT JOIN events e ON ur.event_id = e.id
        WHERE ur.user_id = :uid
        ORDER BY ur.reminder_date ASC, ur.reminder_time ASC, ur.id ASC
    ");
    $remStmt->execute(['uid' => $user['id']]);
    $reminders = $remStmt->fetchAll();

    foreach ($reminders as &$rem) {
        $rem['id']           = (int) $rem['id'];
        $rem['event_id']     = $rem['event_id'] !== null ? (int) $rem['event_id'] : null;
        $rem['is_completed'] = (bool) $rem['is_completed'];
    }
    unset($rem);

    // 2. Fetch all active campus events + user's registration & bookmark status
    $evStmt = $pdo->prepare("
        SELECT
            e.id,
            e.title,
            e.slug,
            e.category,
            e.venue,
            e.event_date,
            e.start_time,
            e.end_time,
            e.registration_fee,
            e.prize_pool,
            e.status,
            d.code AS department_code,
            d.name AS department_name,
            r.pass_id AS my_pass_id,
            r.status AS my_reg_status,
            CASE WHEN se.id IS NOT NULL THEN 1 ELSE 0 END AS is_saved
        FROM events e
        INNER JOIN departments d ON e.department_id = d.id
        LEFT JOIN registrations r
            ON r.event_id = e.id AND r.student_id = :uid1 AND r.status != 'CANCELLED'
        LEFT JOIN saved_events se
            ON se.event_id = e.id AND se.user_id = :uid2
        WHERE e.status != 'CANCELLED'
        ORDER BY e.event_date ASC, e.start_time ASC
    ");
    $evStmt->execute([
        'uid1' => $user['id'],
        'uid2' => $user['id'],
    ]);
    $events = $evStmt->fetchAll();

    foreach ($events as &$ev) {
        $ev['id']               = (int) $ev['id'];
        $ev['registration_fee'] = (float) $ev['registration_fee'];
        $ev['is_saved']         = (bool) $ev['is_saved'];
        $ev['is_registered']    = !empty($ev['my_pass_id']);
    }
    unset($ev);

    sendResponse(true, 'Calendar data loaded', [
        'reminders' => $reminders,
        'events'    => $events,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input  = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = trim($input['action'] ?? 'create');

    if ($action === 'create') {
        $title        = mb_substr(trim($input['title'] ?? ''), 0, 140);
        $reminderDate = trim($input['reminder_date'] ?? '');
        $reminderTime = trim($input['reminder_time'] ?? '09:00');
        $note         = mb_substr(trim($input['note'] ?? ''), 0, 255) ?: null;
        $colorTag     = trim($input['color_tag'] ?? 'vermilion');
        $eventId      = !empty($input['event_id']) ? (int) $input['event_id'] : null;

        if ($title === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $reminderDate)) {
            sendResponse(false, 'Reminder title and a valid date (YYYY-MM-DD) are required.', null, 422);
        }

        if (!in_array($colorTag, ['vermilion', 'emerald', 'amber', 'indigo'], true)) {
            $colorTag = 'vermilion';
        }

        if (strlen($reminderTime) === 5) {
            $reminderTime .= ':00';
        }

        $insStmt = $pdo->prepare("
            INSERT INTO user_reminders (
                user_id, event_id, title, reminder_date, reminder_time, note, color_tag, is_completed
            ) VALUES (
                :user_id, :event_id, :title, :reminder_date, :reminder_time, :note, :color_tag, 0
            )
        ");
        $insStmt->execute([
            'user_id'       => $user['id'],
            'event_id'      => $eventId,
            'title'         => $title,
            'reminder_date' => $reminderDate,
            'reminder_time' => $reminderTime,
            'note'          => $note,
            'color_tag'     => $colorTag,
        ]);

        sendResponse(true, 'Reminder marked on your calendar!', [
            'id' => (int) $pdo->lastInsertId(),
        ], 201);
    } elseif ($action === 'toggle') {
        $id = isset($input['id']) ? (int) $input['id'] : 0;
        if ($id <= 0) {
            sendResponse(false, 'Valid reminder id is required', null, 422);
        }

        $updStmt = $pdo->prepare("
            UPDATE user_reminders
            SET is_completed = 1 - is_completed
            WHERE id = :id AND user_id = :uid
        ");
        $updStmt->execute(['id' => $id, 'uid' => $user['id']]);
        sendResponse(true, 'Reminder status updated');
    } elseif ($action === 'delete') {
        $id = isset($input['id']) ? (int) $input['id'] : 0;
        if ($id <= 0) {
            sendResponse(false, 'Valid reminder id is required', null, 422);
        }

        $delStmt = $pdo->prepare("DELETE FROM user_reminders WHERE id = :id AND user_id = :uid");
        $delStmt->execute(['id' => $id, 'uid' => $user['id']]);
        sendResponse(true, 'Reminder removed from calendar');
    } else {
        sendResponse(false, 'Unsupported calendar action', null, 400);
    }
}

sendResponse(false, 'Method not allowed', null, 405);
