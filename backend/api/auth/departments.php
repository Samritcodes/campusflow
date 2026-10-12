<?php
// backend/api/auth/departments.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

$pdo = getDBConnection();
$stmt = $pdo->query("SELECT id, code, name, description FROM departments ORDER BY id ASC");
$departments = $stmt->fetchAll();

sendResponse(true, 'Departments fetched successfully', [
    'departments' => $departments,
]);
