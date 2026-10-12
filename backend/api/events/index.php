<?php
// backend/api/events/index.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$pdo = getDBConnection();
$sessionUser = getAuthenticatedUser();

$search     = trim($_GET['q'] ?? '');
$category   = trim($_GET['category'] ?? '');
$department = trim($_GET['department'] ?? '');
$featured   = isset($_GET['featured']) ? (int) $_GET['featured'] : null;

$where = ["e.status != 'CANCELLED'"];
$params = [];

if ($search !== '') {
    $where[] = "(e.title LIKE :q OR e.description LIKE :q OR e.venue LIKE :q OR d.name LIKE :q OR d.code LIKE :q)";
    $params['q'] = '%' . $search . '%';
}

if ($category !== '' && strtoupper($category) !== 'ALL') {
    $where[] = "e.category = :category";
    $params['category'] = $category;
}

if ($department !== '' && strtoupper($department) !== 'ALL') {
    $where[] = "d.code = :department";
    $params['department'] = strtoupper($department);
}

if ($featured !== null) {
    $where[] = "e.is_featured = :featured";
    $params['featured'] = $featured;
}

$whereSql = implode(' AND ', $where);

$sql = "
    SELECT
        e.id,
        e.title,
        e.slug,
        e.event_code,
        e.category,
        e.description,
        e.venue,
        e.event_date,
        e.start_time,
        e.end_time,
        e.capacity,
        e.registration_fee,
        e.prize_pool,
        e.registered_count,
        e.banner_url,
        e.is_featured,
        e.status,
        d.id AS department_id,
        d.code AS department_code,
        d.name AS department_name,
        u.full_name AS organizer_name,
        (SELECT ROUND(AVG(f.rating), 1) FROM event_feedback f WHERE f.event_id = e.id) AS avg_rating,
        (SELECT COUNT(*) FROM event_feedback f2 WHERE f2.event_id = e.id) AS feedback_count
    FROM events e
    INNER JOIN departments d ON e.department_id = d.id
    INNER JOIN users u ON e.organizer_id = u.id
    WHERE $whereSql
    ORDER BY e.event_date ASC, e.start_time ASC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$events = $stmt->fetchAll();

// If student is logged in, attach their registration status/pass_id, saved bookmark state, and Personalized Feed score
$userRegistrations = [];
$userSavedEvents = [];
$followedDepts = [];
$followedDeptCodes = [];
$userInterestKeywords = [];

if ($sessionUser && !empty($sessionUser['id'])) {
    $regStmt = $pdo->prepare("
        SELECT event_id, pass_id, status, amount_paid, payment_status, payment_method, transaction_id
        FROM registrations
        WHERE student_id = :uid
    ");
    $regStmt->execute(['uid' => $sessionUser['id']]);
    foreach ($regStmt->fetchAll() as $row) {
        $userRegistrations[(int) $row['event_id']] = [
            'pass_id'        => $row['pass_id'],
            'status'         => $row['status'],
            'amount_paid'    => (float) $row['amount_paid'],
            'payment_status' => $row['payment_status'],
            'payment_method' => $row['payment_method'],
            'transaction_id' => $row['transaction_id'],
        ];
    }

    $savStmt = $pdo->prepare("SELECT event_id FROM saved_events WHERE user_id = :uid");
    $savStmt->execute(['uid' => $sessionUser['id']]);
    foreach ($savStmt->fetchAll() as $sRow) {
        $userSavedEvents[(int) $sRow['event_id']] = true;
    }

    $fStmt = $pdo->prepare("
        SELECT df.department_id, d.code
        FROM department_follows df
        INNER JOIN departments d ON df.department_id = d.id
        WHERE df.user_id = :uid
    ");
    $fStmt->execute(['uid' => $sessionUser['id']]);
    foreach ($fStmt->fetchAll() as $fRow) {
        $followedDepts[(int) $fRow['department_id']] = $fRow['code'];
        $followedDeptCodes[] = $fRow['code'];
    }

    // Fetch latest user interests from DB
    $uStmt = $pdo->prepare("SELECT interests, department_id FROM users WHERE id = :uid LIMIT 1");
    $uStmt->execute(['uid' => $sessionUser['id']]);
    $uRow = $uStmt->fetch();
    $rawInterests = $uRow['interests'] ?? ($sessionUser['interests'] ?? '');
    foreach (explode(',', (string) $rawInterests) as $tag) {
        $clean = trim($tag);
        if ($clean !== '') {
            $userInterestKeywords[] = $clean;
        }
    }
}

foreach ($events as &$ev) {
    $ev['id']               = (int) $ev['id'];
    $ev['department_id']    = (int) $ev['department_id'];
    $ev['capacity']         = (int) $ev['capacity'];
    $ev['registration_fee'] = (float) $ev['registration_fee'];
    $ev['registered_count'] = (int) $ev['registered_count'];
    $ev['is_featured']      = (bool) $ev['is_featured'];
    $ev['is_saved']         = !empty($userSavedEvents[$ev['id']]);
    $ev['avg_rating']       = $ev['avg_rating'] !== null ? (float) $ev['avg_rating'] : null;
    $ev['feedback_count']   = (int) ($ev['feedback_count'] ?? 0);
    $ev['my_registration']  = $userRegistrations[$ev['id']] ?? null;

    // Personalized "For You" Feed scoring
    $score = 0;
    $reasons = [];

    if ($sessionUser) {
        $isHomeDept = !empty($sessionUser['department_id']) && (int) $sessionUser['department_id'] === $ev['department_id'];
        $isFollowedDept = isset($followedDepts[$ev['department_id']]);

        if ($isHomeDept) {
            $score += 4;
            $reasons[] = 'Your Dept (' . $ev['department_code'] . ')';
        } elseif ($isFollowedDept) {
            $score += 3;
            $reasons[] = 'Followed (' . $ev['department_code'] . ')';
        }

        $haystack = strtolower($ev['title'] . ' ' . $ev['category'] . ' ' . $ev['description'] . ' ' . $ev['department_name']);
        foreach ($userInterestKeywords as $kw) {
            if (stripos($haystack, strtolower($kw)) !== false) {
                $score += 3;
                $reasons[] = 'Interest: ' . $kw;
            }
        }
    }

    $ev['is_followed_dept']     = isset($followedDepts[$ev['department_id']]);
    $ev['recommendation_score'] = $score;
    $ev['match_reasons']        = array_values(array_unique($reasons));
}
unset($ev);

sendResponse(true, 'Events fetched successfully', [
    'events'                    => $events,
    'followed_department_codes' => array_values(array_unique($followedDeptCodes)),
]);
