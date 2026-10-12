<?php
// backend/api/health.php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';

$pdo = getDBConnection();
$stmt = $pdo->query("SELECT VERSION() AS mysql_version, DATABASE() AS db_name");
$dbInfo = $stmt->fetch();

// Check Phase 2A table counts if tables exist
$tables = ['departments', 'users', 'events', 'registrations', 'announcements'];
$tableCounts = [];

foreach ($tables as $table) {
    try {
        $countStmt = $pdo->query("SELECT COUNT(*) AS cnt FROM `$table`");
        $tableCounts[$table] = (int) $countStmt->fetchColumn();
    } catch (PDOException $e) {
        $tableCounts[$table] = null;
    }
}

sendResponse(true, 'CampusFlow API & MySQL Schema (Phase 2A) active', [
    'service'       => 'CampusFlow Backend API',
    'php_version'   => PHP_VERSION,
    'mysql_version' => $dbInfo['mysql_version'],
    'database'      => $dbInfo['db_name'],
    'roles'         => [ROLE_STUDENT, ROLE_ORGANIZER, ROLE_DEPT_MANAGER, ROLE_ADMIN],
    'tables'        => $tableCounts,
    'timestamp'     => date('c'),
]);
