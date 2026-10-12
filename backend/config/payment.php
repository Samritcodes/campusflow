<?php
// backend/config/payment.php

define('CAMPUSFLOW_PAYMENT_SECRET', getenv('CAMPUSFLOW_PAYMENT_SECRET') ?: 'cf26_hmac_live_gate_98f3a1b7e4c2d09182736455');

function computePaymentSignature(string $orderId, int $studentId, int $eventId, float $amount, string $transactionId): string
{
    $payload = sprintf('%s|%d|%d|%0.2f|%s', $orderId, $studentId, $eventId, $amount, $transactionId);
    return hash_hmac('sha256', $payload, CAMPUSFLOW_PAYMENT_SECRET);
}
