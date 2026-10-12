<?php
// backend/api/registrations/cancel.php

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
$passId  = trim($input['pass_id'] ?? '');

if ($eventId <= 0 && $passId === '') {
    sendResponse(false, 'event_id or pass_id is required', null, 422);
}

$pdo = getDBConnection();

try {
    $pdo->beginTransaction();

    $where = $passId !== '' ? 'pass_id = :val AND student_id = :uid' : 'event_id = :val AND student_id = :uid';
    $stmt = $pdo->prepare("SELECT * FROM registrations WHERE $where FOR UPDATE");
    $stmt->execute([
        'val' => $passId !== '' ? $passId : $eventId,
        'uid' => $user['id'],
    ]);
    $reg = $stmt->fetch();

    if (!$reg) {
        $pdo->rollBack();
        sendResponse(false, 'Registration not found', null, 404);
    }

    if ($reg['status'] === 'CANCELLED') {
        $pdo->rollBack();
        sendResponse(false, 'Registration is already cancelled', null, 400);
    }

    if ($reg['status'] === 'ATTENDED' || $reg['status'] === 'COMPLETED') {
        $pdo->rollBack();
        sendResponse(false, 'Cannot cancel a pass after attendance has been marked', null, 400);
    }

    $wasConfirmed = ($reg['status'] === 'CONFIRMED');
    $wasPaid      = (($reg['payment_status'] ?? 'FREE') === 'PAID' && (float) ($reg['amount_paid'] ?? 0) > 0);
    $newPayStatus = $wasPaid ? 'REFUNDED' : ($reg['payment_status'] ?? 'FREE');

    $cancelStmt = $pdo->prepare("
        UPDATE registrations
        SET status = 'CANCELLED', payment_status = :pay_status, cancelled_at = NOW()
        WHERE id = :id
    ");
    $cancelStmt->execute([
        'pay_status' => $newPayStatus,
        'id'         => $reg['id'],
    ]);

    if ($wasConfirmed) {
        // Check if someone is WAITLISTED for this event and promote them
        $waitStmt = $pdo->prepare("
            SELECT id FROM registrations
            WHERE event_id = :eid AND status = 'WAITLISTED'
            ORDER BY registered_at ASC
            LIMIT 1
            FOR UPDATE
        ");
        $waitStmt->execute(['eid' => $reg['event_id']]);
        $waitlisted = $waitStmt->fetch();

        if ($waitlisted) {
            $promoStmt = $pdo->prepare("UPDATE registrations SET status = 'CONFIRMED' WHERE id = :id");
            $promoStmt->execute(['id' => $waitlisted['id']]);
        } else {
            $decStmt = $pdo->prepare("
                UPDATE events
                SET registered_count = GREATEST(0, registered_count - 1)
                WHERE id = :eid
            ");
            $decStmt->execute(['eid' => $reg['event_id']]);
        }
    }

    $pdo->commit();

    $cancelMsg = $wasPaid
        ? 'Registration cancelled. Refund of ₹' . number_format((float) $reg['amount_paid'], 0) . ' initiated to ' . ($reg['payment_method'] ?? 'original method') . '.'
        : 'Registration cancelled successfully';

    sendResponse(true, $cancelMsg, [
        'pass_id'        => $reg['pass_id'],
        'status'         => 'CANCELLED',
        'payment_status' => $newPayStatus,
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse(false, 'Failed to cancel registration', null, 500, $e->getMessage());
}
