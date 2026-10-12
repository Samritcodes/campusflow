<?php
// backend/middleware/auth.php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/response.php';

function initSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 86400 * 7, // 7 days
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function getAuthenticatedUser(): ?array {
    initSession();
    return $_SESSION['user'] ?? null;
}

function requireAuth(): array {
    $user = getAuthenticatedUser();
    if (!$user || empty($user['id'])) {
        sendResponse(false, 'Authentication required. Please log in.', null, 401);
    }
    return $user;
}

function requireRole(array $allowedRoles): array {
    $user = requireAuth();
    if (!in_array($user['role'], $allowedRoles, true)) {
        sendResponse(
            false,
            'Access denied. Required role: ' . implode(' or ', $allowedRoles),
            null,
            403
        );
    }
    return $user;
}
