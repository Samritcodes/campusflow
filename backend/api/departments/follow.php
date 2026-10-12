<?php
// backend/api/departments/follow.php
// Toggles following/unfollowing a Department or Campus Community for the Personalized Campus Feed

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$user = requireAuth();
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$deptId = isset($input['department_id']) ? (int) $input['department_id'] : 0;

if ($deptId <= 0) {
    sendResponse(false, 'Valid department_id is required', null, 422);
}

$pdo = getDBConnection();

$chk = $pdo->prepare("SELECT id FROM department_follows WHERE user_id = :uid AND department_id = :did LIMIT 1");
$chk->execute(['uid' => $user['id'], 'did' => $deptId]);
$existing = $chk->fetch();

if ($existing) {
    $del = $pdo->prepare("DELETE FROM department_follows WHERE id = :id");
    $del->execute(['id' => $existing['id']]);
    $isFollowed = false;
    $msg = 'Unfollowed department updates.';
} else {
    $ins = $pdo->prepare("INSERT IGNORE INTO department_follows (user_id, department_id) VALUES (:uid, :did)");
    $ins->execute(['uid' => $user['id'], 'did' => $deptId]);
    $isFollowed = true;
    $msg = 'Following department! Upcoming events will appear in your For You feed.';
}

$cntStmt = $pdo->prepare("SELECT COUNT(*) FROM department_follows WHERE department_id = :did");
$cntStmt->execute(['did' => $deptId]);
$followerCount = (int) $cntStmt->fetchColumn();

sendResponse(true, $msg, [
    'department_id'  => $deptId,
    'is_followed'    => $isFollowed,
    'follower_count' => $followerCount,
]);
