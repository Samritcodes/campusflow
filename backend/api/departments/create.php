<?php
// backend/api/departments/create.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

requireRole([ROLE_ADMIN]);

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$code        = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', trim($input['code'] ?? '')));
$name        = trim($input['name'] ?? '');
$description = trim($input['description'] ?? '');

if ($code === '' || $name === '') {
    sendResponse(false, 'Department code and name are required', null, 422);
}

$pdo = getDBConnection();

$chk = $pdo->prepare("SELECT id FROM departments WHERE code = :code LIMIT 1");
$chk->execute(['code' => $code]);
if ($chk->fetch()) {
    sendResponse(false, 'A department with code ' . $code . ' already exists', null, 409);
}

$ins = $pdo->prepare("INSERT INTO departments (code, name, description) VALUES (:code, :name, :description)");
$ins->execute([
    'code'        => $code,
    'name'        => $name,
    'description' => $description,
]);

sendResponse(true, 'Department ' . $code . ' created successfully', [
    'id' => (int) $pdo->lastInsertId(),
], 201);
