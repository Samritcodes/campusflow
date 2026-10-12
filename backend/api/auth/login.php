<?php
// backend/api/auth/login.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    sendResponse(false, 'Email and password are required', null, 422);
}

$pdo = getDBConnection();

$sql = "
    SELECT
        u.id,
        u.full_name,
        u.email,
        u.password_hash,
        u.role,
        u.department_id,
        u.year_of_study,
        u.roll_number,
        u.interests,
        u.is_active,
        d.code AS department_code,
        d.name AS department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.email = :email
    LIMIT 1
";

$stmt = $pdo->prepare($sql);
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    sendResponse(false, 'Invalid email or password', null, 401);
}

if (!(int) $user['is_active']) {
    sendResponse(false, 'Your account has been deactivated. Contact Admin.', null, 403);
}

unset($user['password_hash']);

initSession();
session_regenerate_id(true);
$_SESSION['user'] = $user;

sendResponse(true, 'Welcome back, ' . $user['full_name'] . '!', [
    'user' => $user,
]);
