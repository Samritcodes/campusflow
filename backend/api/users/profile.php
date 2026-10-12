<?php
// backend/api/users/profile.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$input  = json_decode(file_get_contents('php://input'), true) ?? [];
$action = trim($input['action'] ?? 'update_profile');
$pdo    = getDBConnection();

if ($action === 'change_password') {
    $currentPassword = (string) ($input['current_password'] ?? '');
    $newPassword     = (string) ($input['new_password'] ?? '');

    if ($currentPassword === '' || strlen($newPassword) < 6) {
        sendResponse(false, 'Current password is required and new password must be at least 6 characters', null, 422);
    }

    $pwStmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = :id LIMIT 1");
    $pwStmt->execute(['id' => $user['id']]);
    $row = $pwStmt->fetch();

    if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
        sendResponse(false, 'Current password is incorrect', null, 403);
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $updPw   = $pdo->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");
    $updPw->execute(['hash' => $newHash, 'id' => $user['id']]);

    sendResponse(true, 'Password updated successfully');
}

$fullName     = substr(trim($input['full_name'] ?? $user['full_name']), 0, 120);
$departmentId = !empty($input['department_id']) ? (int) $input['department_id'] : $user['department_id'];
$yearOfStudy  = trim($input['year_of_study'] ?? $user['year_of_study']);
$rollNumber   = !empty(trim($input['roll_number'] ?? '')) ? substr(strtoupper(trim($input['roll_number'])), 0, 40) : null;
$interests    = substr(trim($input['interests'] ?? ($user['interests'] ?? '')), 0, 255);

if (strlen($fullName) < 2) {
    sendResponse(false, 'Full name must be at least 2 characters', null, 422);
}

$stmt = $pdo->prepare("
    UPDATE users
    SET full_name = :full_name,
        department_id = :department_id,
        year_of_study = :year_of_study,
        roll_number = :roll_number,
        interests = :interests
    WHERE id = :id
");
$stmt->execute([
    'full_name'     => $fullName,
    'department_id' => $departmentId,
    'year_of_study' => $yearOfStudy,
    'roll_number'   => $rollNumber,
    'interests'     => $interests,
    'id'            => $user['id'],
]);

sendResponse(true, 'Profile updated successfully');
