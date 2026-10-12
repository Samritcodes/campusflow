<?php
// backend/api/announcements/index.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

$pdo = getDBConnection();

$stmt = $pdo->query("
    SELECT
        a.id,
        a.title,
        a.message,
        a.priority,
        a.created_at,
        u.full_name AS author_name,
        u.role AS author_role,
        d.code AS department_code,
        d.name AS department_name,
        e.title AS event_title,
        e.slug AS event_slug
    FROM announcements a
    INNER JOIN users u ON a.author_id = u.id
    LEFT JOIN departments d ON a.department_id = d.id
    LEFT JOIN events e ON a.event_id = e.id
    ORDER BY a.created_at DESC
");

sendResponse(true, 'Announcements fetched successfully', [
    'announcements' => $stmt->fetchAll(),
]);
