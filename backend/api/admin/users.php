<?php
// backend/api/admin/users.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$currentUser = requireRole([ROLE_ADMIN, ROLE_DEPT_MANAGER]);
$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $whereClause = '';
    $params = [];

    // Department Managers only see users belonging to their own department
    if ($currentUser['role'] === ROLE_DEPT_MANAGER && !empty($currentUser['department_id'])) {
        $whereClause = 'WHERE u.department_id = :dept_id';
        $params['dept_id'] = (int) $currentUser['department_id'];
    }

    $stmt = $pdo->prepare("
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.role,
            u.department_id,
            u.year_of_study,
            u.roll_number,
            u.is_active,
            u.created_at,
            d.code AS department_code,
            d.name AS department_name,
            (SELECT COUNT(*) FROM registrations r WHERE r.student_id = u.id AND r.status != 'CANCELLED') AS active_passes_count
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        $whereClause
        ORDER BY FIELD(u.role, 'ADMIN', 'DEPARTMENT_MANAGER', 'ORGANIZER', 'STUDENT'), u.id ASC
    ");
    $stmt->execute($params);

    sendResponse(true, 'Users fetched successfully', [
        'users' => $stmt->fetchAll(),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $targetUserId = isset($input['user_id']) ? (int) $input['user_id'] : 0;
    $newRole      = strtoupper(trim($input['role'] ?? ''));
    $departmentId = array_key_exists('department_id', $input)
        ? (!empty($input['department_id']) ? (int) $input['department_id'] : null)
        : null;

    $validRoles = [ROLE_STUDENT, ROLE_ORGANIZER, ROLE_DEPT_MANAGER, ROLE_ADMIN];
    if ($targetUserId <= 0 || !in_array($newRole, $validRoles, true)) {
        sendResponse(false, 'Valid user_id and role are required', null, 422);
    }

    // Department Managers can only assign STUDENT or ORGANIZER within their own department
    if ($currentUser['role'] === ROLE_DEPT_MANAGER) {
        if (!in_array($newRole, [ROLE_STUDENT, ROLE_ORGANIZER], true)) {
            sendResponse(false, 'Department Managers can only assign STUDENT or ORGANIZER roles', null, 403);
        }
        $departmentId = (int) $currentUser['department_id'];
    }

    if ($targetUserId === (int) $currentUser['id'] && $newRole !== $currentUser['role']) {
        sendResponse(false, 'You cannot demote your own active account', null, 400);
    }

    // If new role is ADMIN, department_id should be NULL (Campus-wide)
    if ($newRole === ROLE_ADMIN) {
        $upd = $pdo->prepare("UPDATE users SET role = :role, department_id = NULL WHERE id = :id");
        $upd->execute(['role' => $newRole, 'id' => $targetUserId]);
    } else {
        $upd = $pdo->prepare("
            UPDATE users
            SET role = :role,
                department_id = COALESCE(:department_id, department_id)
            WHERE id = :id
        ");
        $upd->execute([
            'role'          => $newRole,
            'department_id' => $departmentId,
            'id'            => $targetUserId,
        ]);
    }

    sendResponse(true, 'User role updated to ' . $newRole);
}
