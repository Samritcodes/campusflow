<?php
// backend/api/events/manage.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireRole([ROLE_ORGANIZER, ROLE_DEPT_MANAGER, ROLE_ADMIN]);
$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $eventId = isset($_GET['event_id']) ? (int) $_GET['event_id'] : 0;
    if ($eventId <= 0) {
        sendResponse(false, 'Valid event_id is required', null, 422);
    }

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
            u.id AS student_id,
            u.full_name AS student_name,
            u.email AS student_email,
            u.year_of_study,
            u.roll_number,
            d.code AS student_department_code
        FROM registrations r
        INNER JOIN users u ON r.student_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE r.event_id = :eid
        ORDER BY FIELD(r.status, 'ATTENDED', 'CONFIRMED', 'WAITLISTED', 'CANCELLED'), r.registered_at ASC
    ");
    $stmt->execute(['eid' => $eventId]);

    sendResponse(true, 'Event participants fetched', [
        'participants' => $stmt->fetchAll(),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $eventId = isset($input['event_id']) ? (int) $input['event_id'] : 0;
    $action  = trim($input['action'] ?? '');

    if ($eventId <= 0 || $action === '') {
        sendResponse(false, 'event_id and action are required', null, 422);
    }

    $evStmt = $pdo->prepare("SELECT * FROM events WHERE id = :id LIMIT 1");
    $evStmt->execute(['id' => $eventId]);
    $event = $evStmt->fetch();

    if (!$event) {
        sendResponse(false, 'Event not found', null, 404);
    }

    // Non-admin staff can only manage events within their own department
    if ($user['role'] !== ROLE_ADMIN && (int) $event['department_id'] !== (int) $user['department_id']) {
        sendResponse(false, 'You can only manage events belonging to your department', null, 403);
    }

    if ($action === 'toggle_featured') {
        $newVal = (int) $event['is_featured'] ? 0 : 1;
        $upd = $pdo->prepare("UPDATE events SET is_featured = :val WHERE id = :id");
        $upd->execute(['val' => $newVal, 'id' => $eventId]);
        sendResponse(true, $newVal ? 'Event marked as Featured' : 'Event removed from Featured', [
            'is_featured' => (bool) $newVal,
        ]);
    }

    if ($action === 'update_status') {
        $newStatus = strtoupper(trim($input['status'] ?? 'UPCOMING'));
        $validStatuses = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
        if (!in_array($newStatus, $validStatuses, true)) {
            sendResponse(false, 'Invalid status', null, 422);
        }
        $upd = $pdo->prepare("UPDATE events SET status = :status WHERE id = :id");
        $upd->execute(['status' => $newStatus, 'id' => $eventId]);
        sendResponse(true, 'Event status updated to ' . $newStatus, [
            'status' => $newStatus,
        ]);
    }

    if ($action === 'update_capacity') {
        $newCap = max((int) $event['registered_count'], (int) ($input['capacity'] ?? $event['capacity']));
        $upd = $pdo->prepare("UPDATE events SET capacity = :cap WHERE id = :id");
        $upd->execute(['cap' => $newCap, 'id' => $eventId]);
        sendResponse(true, 'Event capacity updated to ' . $newCap, [
            'capacity' => $newCap,
        ]);
    }

    if ($action === 'assign_award') {
        $passId     = trim($input['pass_id'] ?? '');
        $awardTitle = trim($input['award_title'] ?? '');
        if ($passId === '') {
            sendResponse(false, 'pass_id is required', null, 422);
        }

        if ($awardTitle !== '') {
            $upd = $pdo->prepare("
                UPDATE registrations
                SET award_title = :award, status = 'ATTENDED', attended_at = COALESCE(attended_at, NOW()), verified_by = :vid
                WHERE pass_id = :pid AND event_id = :eid
            ");
            $upd->execute([
                'award' => $awardTitle,
                'vid'   => $user['id'],
                'pid'   => $passId,
                'eid'   => $eventId,
            ]);
            sendResponse(true, 'Crowned ' . $awardTitle . ' (' . $passId . ')! Merit Certificate unlocked.', [
                'pass_id'     => $passId,
                'award_title' => $awardTitle,
            ]);
        } else {
            $upd = $pdo->prepare("
                UPDATE registrations
                SET award_title = NULL
                WHERE pass_id = :pid AND event_id = :eid
            ");
            $upd->execute([
                'pid' => $passId,
                'eid' => $eventId,
            ]);
            sendResponse(true, 'Award removed for ' . $passId, [
                'pass_id'     => $passId,
                'award_title' => null,
            ]);
        }
    }

    sendResponse(false, 'Unknown action', null, 400);
}
