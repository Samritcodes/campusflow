<?php
// backend/api/registrations/register.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/payment.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$user = requireRole([ROLE_STUDENT]);
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$eventId = isset($input['event_id']) ? (int) $input['event_id'] : 0;

if ($eventId <= 0) {
    sendResponse(false, 'Valid event_id is required', null, 422);
}

$pdo = getDBConnection();

try {
    $pdo->beginTransaction();

    // Lock the event row for capacity check
    $evStmt = $pdo->prepare("
        SELECT e.*, d.code AS event_dept_code
        FROM events e
        INNER JOIN departments d ON e.department_id = d.id
        WHERE e.id = :id
        FOR UPDATE
    ");
    $evStmt->execute(['id' => $eventId]);
    $event = $evStmt->fetch();

    if (!$event) {
        $pdo->rollBack();
        sendResponse(false, 'Event not found', null, 404);
    }

    if ($event['status'] === 'CANCELLED' || $event['status'] === 'COMPLETED') {
        $pdo->rollBack();
        sendResponse(false, 'Registration is closed for this event', null, 400);
    }

    // Check if user already has a registration row
    $existingStmt = $pdo->prepare("
        SELECT id, pass_id, status
        FROM registrations
        WHERE event_id = :eid AND student_id = :uid
        FOR UPDATE
    ");
    $existingStmt->execute([
        'eid' => $eventId,
        'uid' => $user['id'],
    ]);
    $existing = $existingStmt->fetch();

    if ($existing && $existing['status'] !== 'CANCELLED') {
        $pdo->rollBack();
        sendResponse(false, 'You are already registered for this event (Pass ID: ' . $existing['pass_id'] . ')', [
            'pass_id' => $existing['pass_id'],
            'status'  => $existing['status'],
        ], 409);
    }

    $hasSeat = (int) $event['registered_count'] < (int) $event['capacity'];
    $newStatus = $hasSeat ? 'CONFIRMED' : 'WAITLISTED';

    $fee = round((float) ($event['registration_fee'] ?? 0), 2);
    $isPaidEvent = $fee > 0;

    $teamName       = trim($input['team_name'] ?? '') ?: null;
    $teamMembers    = trim($input['team_members'] ?? '') ?: null;
    $joinTeamCode   = strtoupper(trim($input['join_team_code'] ?? ''));
    $shareProfile   = isset($input['share_profile']) ? (!empty($input['share_profile']) ? 1 : 0) : 1;
    $lookingForTeam = !empty($input['looking_for_team']) ? 1 : 0;
    $teammateNote   = trim($input['teammate_note'] ?? '') ?: null;

    if ($joinTeamCode !== '') {
        // Look up existing squad by team_code on this event
        $sqStmt = $pdo->prepare("
            SELECT id, team_name, team_code, team_members, u.full_name AS leader_name
            FROM registrations r
            INNER JOIN users u ON r.student_id = u.id
            WHERE r.event_id = :eid AND UPPER(r.team_code) = :tcode AND r.status != 'CANCELLED'
            ORDER BY r.id ASC
            LIMIT 1
        ");
        $sqStmt->execute(['eid' => $eventId, 'tcode' => $joinTeamCode]);
        $existingSquad = $sqStmt->fetch();

        if (!$existingSquad) {
            $pdo->rollBack();
            sendResponse(false, 'Squad Code "' . $joinTeamCode . '" was not found for this event. Please verify the code with your team leader.', null, 404);
        }

        $teamName = $existingSquad['team_name'];
        $teamCode = $existingSquad['team_code'];
        $baseMembers = $existingSquad['team_members'] ?: $existingSquad['leader_name'];
        if (stripos((string) $baseMembers, $user['full_name']) === false) {
            $teamMembers = trim($baseMembers . ', ' . $user['full_name'], ', ');
        } else {
            $teamMembers = $baseMembers;
        }

        // Sync updated team_members across all members of this squad
        $syncSquad = $pdo->prepare("
            UPDATE registrations
            SET team_members = :members
            WHERE event_id = :eid AND team_code = :tcode
        ");
        $syncSquad->execute([
            'members' => $teamMembers,
            'eid'     => $eventId,
            'tcode'   => $teamCode,
        ]);
    } else {
        $teamCode = $teamName ? ('TEAM-' . strtoupper(substr(md5($teamName . '-' . $eventId), 0, 4))) : null;
    }

    if ($isPaidEvent) {
        $orderId   = strtoupper(trim($input['order_id'] ?? ''));
        $clientSig = trim($input['payment_signature'] ?? '');

        if ($orderId === '' || $clientSig === '') {
            $pdo->rollBack();
            sendResponse(false, 'Security Check: Verified payment order and cryptographic signature are required for paid events (₹' . number_format($fee, 0) . ').', [
                'requires_payment' => true,
                'registration_fee' => $fee,
            ], 402);
        }

        // Lock and verify the server-side payment order
        $ordStmt = $pdo->prepare("
            SELECT *
            FROM payment_orders
            WHERE order_id = :oid AND student_id = :uid AND event_id = :eid
            FOR UPDATE
        ");
        $ordStmt->execute([
            'oid' => $orderId,
            'uid' => $user['id'],
            'eid' => $eventId,
        ]);
        $payOrder = $ordStmt->fetch();

        if (!$payOrder) {
            $pdo->rollBack();
            sendResponse(false, 'Security Alert: Payment order not found or invalid.', null, 402);
        }

        if ($payOrder['status'] !== 'VERIFIED') {
            $pdo->rollBack();
            sendResponse(false, 'Security Alert: Payment order has not completed OTP verification or was already used (Status: ' . $payOrder['status'] . ').', null, 402);
        }

        if (round((float) $payOrder['amount'], 2) !== $fee) {
            $pdo->rollBack();
            sendResponse(false, 'Security Alert: Payment order amount mismatch.', null, 402);
        }

        $expectedSig = computePaymentSignature(
            $payOrder['order_id'],
            (int) $payOrder['student_id'],
            (int) $payOrder['event_id'],
            (float) $payOrder['amount'],
            (string) $payOrder['transaction_id']
        );

        if (!hash_equals($expectedSig, $clientSig) || !hash_equals((string) $payOrder['payment_signature'], $clientSig)) {
            $pdo->rollBack();
            sendResponse(false, 'Security Alert: Invalid cryptographic payment signature.', null, 402);
        }

        // Consume the payment order so it can never be replayed
        $consumeStmt = $pdo->prepare("UPDATE payment_orders SET status = 'CONSUMED' WHERE id = :id");
        $consumeStmt->execute(['id' => $payOrder['id']]);

        $amountPaid    = (float) $payOrder['amount'];
        $paymentStatus = 'PAID';
        $finalMethod   = $payOrder['payment_method'];
        $transactionId = $payOrder['transaction_id'];
    } else {
        $amountPaid    = 0.00;
        $paymentStatus = 'FREE';
        $finalMethod   = 'FREE_ENTRY';
        $transactionId = null;
    }

    if ($existing && $existing['status'] === 'CANCELLED') {
        // Reactivate cancelled pass with fresh payment status
        $passId = $existing['pass_id'];
        $updReg = $pdo->prepare("
            UPDATE registrations
            SET
                status = :status,
                amount_paid = :amount_paid,
                payment_status = :payment_status,
                payment_method = :payment_method,
                transaction_id = :transaction_id,
                team_name = :team_name,
                team_code = :team_code,
                team_members = :team_members,
                share_profile = :share_profile,
                looking_for_team = :looking_for_team,
                teammate_note = :teammate_note,
                cancelled_at = NULL,
                registered_at = NOW()
            WHERE id = :id
        ");
        $updReg->execute([
            'status'           => $newStatus,
            'amount_paid'      => $amountPaid,
            'payment_status'   => $paymentStatus,
            'payment_method'   => $finalMethod,
            'transaction_id'   => $transactionId,
            'team_name'        => $teamName,
            'team_code'        => $teamCode,
            'team_members'     => $teamMembers,
            'share_profile'    => $shareProfile,
            'looking_for_team' => $lookingForTeam,
            'teammate_note'    => $teammateNote,
            'id'               => $existing['id'],
        ]);
        $registrationId = (int) $existing['id'];
    } else {
        // Generate unique CampusFlow Pass ID: CF-26-{USER_DEPT}-{EVENT_CODE}-{5_DIGIT_SEQ}
        $userDept = strtoupper($user['department_code'] ?? $event['event_dept_code'] ?? 'GEN');
        $eventCode = strtoupper($event['event_code'] ?? 'EVT');

        $maxIdStmt = $pdo->query("SELECT COALESCE(MAX(id), 0) + 482 FROM registrations");
        $seqNum = (int) $maxIdStmt->fetchColumn();
        $passId = sprintf("CF-26-%s-%s-%05d", $userDept, $eventCode, $seqNum);

        $insStmt = $pdo->prepare("
            INSERT INTO registrations (
                pass_id, event_id, student_id, status,
                amount_paid, payment_status, payment_method, transaction_id,
                team_name, team_code, team_members,
                share_profile, looking_for_team, teammate_note, registered_at
            ) VALUES (
                :pass_id, :event_id, :student_id, :status,
                :amount_paid, :payment_status, :payment_method, :transaction_id,
                :team_name, :team_code, :team_members,
                :share_profile, :looking_for_team, :teammate_note, NOW()
            )
        ");
        $insStmt->execute([
            'pass_id'          => $passId,
            'event_id'         => $eventId,
            'student_id'       => $user['id'],
            'status'           => $newStatus,
            'amount_paid'      => $amountPaid,
            'payment_status'   => $paymentStatus,
            'payment_method'   => $finalMethod,
            'transaction_id'   => $transactionId,
            'team_name'        => $teamName,
            'team_code'        => $teamCode,
            'team_members'     => $teamMembers,
            'share_profile'    => $shareProfile,
            'looking_for_team' => $lookingForTeam,
            'teammate_note'    => $teammateNote,
        ]);
        $registrationId = (int) $pdo->lastInsertId();
    }

    if ($newStatus === 'CONFIRMED') {
        $incStmt = $pdo->prepare("UPDATE events SET registered_count = registered_count + 1 WHERE id = :id");
        $incStmt->execute(['id' => $eventId]);
    }

    $pdo->commit();

    // Fetch complete pass payload for frontend Pass Card
    $passStmt = $pdo->prepare("
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
        WHERE r.id = :rid
        LIMIT 1
    ");
    $passStmt->execute(['rid' => $registrationId]);
    $passData = $passStmt->fetch();

    $msg = $newStatus === 'CONFIRMED'
        ? ($isPaidEvent
            ? 'Payment verified (₹' . number_format($amountPaid, 0) . ')! Your CampusFlow Digital Pass is ready.'
            : 'Event registered! Your CampusFlow Digital Pass is ready.')
        : 'Event is at capacity — you have been added to the waitlist.';

    sendResponse(true, $msg, [
        'pass' => $passData,
    ], 201);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse(false, 'Could not complete registration', null, 500, $e->getMessage());
}
