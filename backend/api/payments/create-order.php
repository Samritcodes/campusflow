<?php
// backend/api/payments/create-order.php

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
$method  = trim($input['payment_method'] ?? '');

if ($eventId <= 0) {
    sendResponse(false, 'Valid event_id is required', null, 422);
}

$allowedMethods = ['UPI / QR', 'Credit / Debit Card', 'NetBanking'];
if (!in_array($method, $allowedMethods, true)) {
    sendResponse(false, 'Please select a valid payment method (UPI / QR, Card, or NetBanking).', null, 422);
}

$pdo = getDBConnection();

// Fetch event & verify fee
$evStmt = $pdo->prepare("SELECT id, title, status, registration_fee, capacity, registered_count FROM events WHERE id = :id LIMIT 1");
$evStmt->execute(['id' => $eventId]);
$event = $evStmt->fetch();

if (!$event) {
    sendResponse(false, 'Event not found', null, 404);
}

if ($event['status'] === 'CANCELLED' || $event['status'] === 'COMPLETED') {
    sendResponse(false, 'Registration is closed for this event', null, 400);
}

$fee = round((float) ($event['registration_fee'] ?? 0), 2);
if ($fee <= 0) {
    sendResponse(false, 'This event is free and does not require a payment order.', null, 400);
}

// Check if already registered
$regCheck = $pdo->prepare("SELECT pass_id, status FROM registrations WHERE event_id = :eid AND student_id = :uid LIMIT 1");
$regCheck->execute(['eid' => $eventId, 'uid' => $user['id']]);
$existingReg = $regCheck->fetch();
if ($existingReg && $existingReg['status'] !== 'CANCELLED') {
    sendResponse(false, 'You already have an active pass for this event (' . $existingReg['pass_id'] . ').', null, 409);
}

// Strict Payment Instrument Validation per Method
$maskedInstrument = '';
$utrReference = null;

if ($method === 'UPI / QR') {
    $upiMode = trim($input['upi_mode'] ?? 'UPI_ID');
    $upiId   = strtolower(trim($input['upi_id'] ?? ''));
    $utr     = preg_replace('/\D/', '', trim($input['utr_reference'] ?? ''));

    if (!preg_match('/^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{2,}$/', $upiId)) {
        sendResponse(false, 'Please enter a valid UPI ID (e.g., yourname@okaxis or rollno@sbi).', null, 422);
    }

    if ($upiMode === 'QR_UTR') {
        if (strlen($utr) !== 12) {
            sendResponse(false, 'QR Scan requires the 12-digit UPI UTR / Reference Number from your payment app.', null, 422);
        }
        $utrReference = $utr;
        $maskedInstrument = 'QR Scan (' . $upiId . ' · UTR ' . substr($utr, 0, 4) . '****' . substr($utr, -4) . ')';
    } else {
        $maskedInstrument = 'UPI VPA: ' . $upiId;
    }
} elseif ($method === 'Credit / Debit Card') {
    $cardHolder = trim($input['card_holder'] ?? '');
    $cardNumber = preg_replace('/\D/', '', trim($input['card_number'] ?? ''));
    $cardExpiry = trim($input['card_expiry'] ?? '');
    $cardCvv    = preg_replace('/\D/', '', trim($input['card_cvv'] ?? ''));

    if (strlen($cardHolder) < 3) {
        sendResponse(false, 'Please enter the cardholder name as printed on the card.', null, 422);
    }
    if (strlen($cardNumber) !== 16) {
        sendResponse(false, 'Please enter a valid 16-digit Credit or Debit card number.', null, 422);
    }
    if (!preg_match('/^(0[1-9]|1[0-2])\/(\d{2})$/', $cardExpiry, $m)) {
        sendResponse(false, 'Card expiry must be in MM/YY format (e.g., 08/28).', null, 422);
    }
    $expMonth = (int) $m[1];
    $expYear  = 2000 + (int) $m[2];
    $curYear  = (int) date('Y');
    $curMonth = (int) date('n');
    if ($expYear < $curYear || ($expYear === $curYear && $expMonth < $curMonth)) {
        sendResponse(false, 'This card has expired. Please use an active card.', null, 422);
    }
    if (strlen($cardCvv) < 3 || strlen($cardCvv) > 4) {
        sendResponse(false, 'Please enter a valid 3-digit CVV security code.', null, 422);
    }

    $maskedInstrument = 'Card ending in **** ' . substr($cardNumber, -4) . ' (' . strtoupper($cardHolder) . ')';
} elseif ($method === 'NetBanking') {
    $bankName   = trim($input['bank_name'] ?? '');
    $customerId = trim($input['netbanking_user_id'] ?? '');

    if ($bankName === '') {
        sendResponse(false, 'Please select your bank for NetBanking.', null, 422);
    }
    if (strlen($customerId) < 4) {
        sendResponse(false, 'Please enter your NetBanking Customer ID / User ID (at least 4 characters).', null, 422);
    }

    $maskedInstrument = $bankName . ' (ID: ' . substr($customerId, 0, 2) . '***' . substr($customerId, -2) . ')';
}

// Generate Order ID & 6-digit OTP Challenge
$orderId = sprintf('ORD-CF26-%06d', random_int(100000, 999999));
$otpCode = (string) random_int(100000, 999999);
$otpHash = password_hash($otpCode, PASSWORD_DEFAULT);

$insStmt = $pdo->prepare("
    INSERT INTO payment_orders (
        order_id, event_id, student_id, amount, payment_method,
        masked_instrument, utr_reference, otp_code_hash, status, expires_at
    ) VALUES (
        :order_id, :event_id, :student_id, :amount, :payment_method,
        :masked_instrument, :utr_reference, :otp_code_hash, 'PENDING_OTP', DATE_ADD(NOW(), INTERVAL 10 MINUTE)
    )
");
$insStmt->execute([
    'order_id'          => $orderId,
    'event_id'          => $eventId,
    'student_id'        => $user['id'],
    'amount'            => $fee,
    'payment_method'    => $method,
    'masked_instrument' => $maskedInstrument,
    'utr_reference'     => $utrReference,
    'otp_code_hash'     => $otpHash,
]);

sendResponse(true, 'Payment order initiated. Enter the 6-digit verification OTP to authorize ₹' . number_format($fee, 0) . '.', [
    'order' => [
        'order_id'            => $orderId,
        'event_id'            => $eventId,
        'amount'              => $fee,
        'payment_method'      => $method,
        'masked_instrument'   => $maskedInstrument,
        'expires_in_seconds'  => 600,
        // Simulated Bank/UPI SMS OTP dispatch for campus test environment
        'bank_otp_simulation' => $otpCode,
    ],
], 201);
