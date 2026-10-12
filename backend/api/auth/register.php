<?php
// backend/api/auth/register.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$fullName     = trim($input['full_name'] ?? '');
$email        = strtolower(trim($input['email'] ?? ''));
$password     = $input['password'] ?? '';
$departmentId = !empty($input['department_id']) ? (int) $input['department_id'] : null;
$yearOfStudy  = trim($input['year_of_study'] ?? '1st Year');
$rollNumber   = !empty(trim($input['roll_number'] ?? '')) ? strtoupper(trim($input['roll_number'])) : null;
$interests    = trim($input['interests'] ?? 'AI,Web,Workshop');

$errors = [];
if (strlen($fullName) < 2) {
    $errors['full_name'] = 'Full name must be at least 2 characters';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid campus email address';
}
if (strlen($password) < 6) {
    $errors['password'] = 'Password must be at least 6 characters';
}
if (!$departmentId) {
    $errors['department_id'] = 'Please select your department';
}

$validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'N/A'];
if (!in_array($yearOfStudy, $validYears, true)) {
    $yearOfStudy = '1st Year';
}

if (!empty($errors)) {
    sendResponse(false, reset($errors), null, 422, $errors);
}

$pdo = getDBConnection();

// Check existing email or roll number
$checkStmt = $pdo->prepare("SELECT id, email, roll_number FROM users WHERE email = :email OR (roll_number IS NOT NULL AND roll_number = :roll_number) LIMIT 1");
$checkStmt->execute([
    'email'       => $email,
    'roll_number' => $rollNumber,
]);
$existing = $checkStmt->fetch();

if ($existing) {
    if (strtolower($existing['email']) === $email) {
        sendResponse(false, 'An account with this email already exists', null, 409);
    }
    if ($rollNumber && $existing['roll_number'] === $rollNumber) {
        sendResponse(false, 'This roll number is already registered', null, 409);
    }
}

$passwordHash = password_hash($password, PASSWORD_BCRYPT);

$insertSql = "
    INSERT INTO users (full_name, email, password_hash, role, department_id, year_of_study, roll_number, interests)
    VALUES (:full_name, :email, :password_hash, :role, :department_id, :year_of_study, :roll_number, :interests)
";

$insertStmt = $pdo->prepare($insertSql);
$insertStmt->execute([
    'full_name'     => $fullName,
    'email'         => $email,
    'password_hash' => $passwordHash,
    'role'          => ROLE_STUDENT,
    'department_id' => $departmentId,
    'year_of_study' => $yearOfStudy,
    'roll_number'   => $rollNumber,
    'interests'     => $interests,
]);

$userId = (int) $pdo->lastInsertId();

// Automatically follow the student's home department + any extra followed_departments
$followIds = [$departmentId];
if (!empty($input['followed_departments']) && is_array($input['followed_departments'])) {
    foreach ($input['followed_departments'] as $fid) {
        $fidInt = (int) $fid;
        if ($fidInt > 0 && !in_array($fidInt, $followIds, true)) {
            $followIds[] = $fidInt;
        }
    }
}
$fStmt = $pdo->prepare("INSERT IGNORE INTO department_follows (user_id, department_id) VALUES (:uid, :did)");
foreach ($followIds as $fid) {
    if ($fid) {
        $fStmt->execute(['uid' => $userId, 'did' => $fid]);
    }
}

$userStmt = $pdo->prepare("
    SELECT
        u.id,
        u.full_name,
        u.email,
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
    WHERE u.id = :id
    LIMIT 1
");
$userStmt->execute(['id' => $userId]);
$user = $userStmt->fetch();

initSession();
session_regenerate_id(true);
$_SESSION['user'] = $user;

sendResponse(true, 'Account created successfully! Welcome to CampusFlow.', [
    'user' => $user,
], 201);
