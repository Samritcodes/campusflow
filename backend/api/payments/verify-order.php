<?php
// backend/api/payments/verify-order.php

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

$orderId = strtoupper(trim($input['order_id'] ?? ''));
$otpCode = preg_replace('/\D/', '', trim($input['otp_code'] ?? ''));

if ($orderId === '' || strlen($otpCode) !== 6) {
    sendResponse(false, 'Valid order_id and 6-digit verification OTP are required.', null, 422);
}

$pdo = getDBConnection();

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        SELECT *
        FROM payment_orders
        WHERE order_id = :oid AND student_id = :uid
        FOR UPDATE
    ");
    $stmt->execute([
        'oid' => $orderId,
        'uid' => $user['id'],
    ]);
    $order = $stmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        sendResponse(false, 'Payment order not found or does not belong to your account.', null, 404);
    }

    if ($order['status'] === 'CONSUMED') {
        $pdo->rollBack();
        sendResponse(false, 'This payment order has already been used to issue a pass.', null, 409);
    }

    if ($order['status'] === 'FAILED' || (int) $order['failed_attempts'] >= 3) {
        $pdo->rollBack();
        sendResponse(false, 'Payment order locked due to 3 incorrect OTP attempts. Please initiate a new payment.', null, 403);
    }

    if (strtotime($order['expires_at']) < time()) {
        $pdo->prepare("UPDATE payment_orders SET status = 'EXPIRED' WHERE id = :id")->execute(['id' => $order['id']]);
        $pdo->commit();
        sendResponse(false, 'Payment order expired. Please initiate a new payment.', null, 410);
    }

    if (!password_verify($otpCode, $order['otp_code_hash'])) {
        $newAttempts = (int) $order['failed_attempts'] + 1;
        $newStatus   = $newAttempts >= 3 ? 'FAILED' : 'PENDING_OTP';
        $updFail = $pdo->prepare("
            UPDATE payment_orders
            SET failed_attempts = :attempts, status = :status
            WHERE id = :id
        ");
        $updFail->execute([
            'attempts' => $newAttempts,
            'status'   => $newStatus,
            'id'       => $order['id'],
        ]);
        $pdo->commit();

        $remaining = max(0, 3 - $newAttempts);
        $msg = $remaining > 0
            ? "Invalid 6-digit verification OTP. Payment not authorized ({$remaining} attempt(s) remaining)."
            : 'Invalid OTP entered 3 times. This payment order has been cancelled for security.';
        sendResponse(false, $msg, ['remaining_attempts' => $remaining], 400);
    }

    // OTP Verified! Generate official Transaction ID and HMAC-SHA256 signature
    $transactionId = $order['utr_reference']
        ? ('UTR-' . $order['utr_reference'])
        : sprintf('TXN-CF26-%06d', random_int(100000, 999999));

    $signature = computePaymentSignature(
        $order['order_id'],
        (int) $order['student_id'],
        (int) $order['event_id'],
        (float) $order['amount'],
        $transactionId
    );

    $updSuccess = $pdo->prepare("
        UPDATE payment_orders
        SET
            status = 'VERIFIED',
            transaction_id = :txn,
            payment_signature = :sig,
            verified_at = NOW()
        WHERE id = :id
    ");
    $updSuccess->execute([
        'txn' => $transactionId,
        'sig' => $signature,
        'id'  => $order['id'],
    ]);

    $pdo->commit();

    sendResponse(true, 'Payment cryptographically verified!', [
        'verification' => [
            'order_id'          => $order['order_id'],
            'transaction_id'    => $transactionId,
            'payment_signature' => $signature,
            'payment_method'    => $order['payment_method'],
            'amount'            => (float) $order['amount'],
        ],
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse(false, 'Payment verification failed', null, 500, $e->getMessage());
}
