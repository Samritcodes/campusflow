<?php
// backend/utils/response.php

function sendResponse(bool $success, string $message, $data = null, int $statusCode = 200, $errors = null): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    $payload = [
        'success' => $success,
        'message' => $message,
    ];

    if ($data !== null) {
        $payload['data'] = $data;
    }

    if ($errors !== null) {
        $payload['errors'] = $errors;
    }

    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}
