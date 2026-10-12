<?php
// backend/api/events/community.php
// Handles Event Discussion Spaces, Official Organizer Replies, Attendee Networking Consent/Teammate Finder, and Event Resource Hub

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

$user = requireAuth();
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = trim($input['action'] ?? '');
$pdo = getDBConnection();

$isStaff = in_array($user['role'], [ROLE_ADMIN, ROLE_DEPARTMENT_MANAGER, ROLE_ORGANIZER], true);

// 1. Post a message in Event Discussion Space / Q&A Board
if ($action === 'post_discussion') {
    $eventId  = isset($input['event_id']) ? (int) $input['event_id'] : 0;
    $topicTag = strtoupper(trim($input['topic_tag'] ?? 'QUESTION'));
    $message  = trim($input['message'] ?? '');

    if ($eventId <= 0 || strlen($message) < 3) {
        sendResponse(false, 'Please enter a valid message (at least 3 characters).', null, 422);
    }

    $allowedTags = ['QUESTION', 'TEAMMATE_FINDER', 'GENERAL'];
    if (!in_array($topicTag, $allowedTags, true)) {
        $topicTag = 'QUESTION';
    }

    $stmt = $pdo->prepare("
        INSERT INTO event_discussions (event_id, user_id, topic_tag, message)
        VALUES (:eid, :uid, :tag, :msg)
    ");
    $stmt->execute([
        'eid' => $eventId,
        'uid' => $user['id'],
        'tag' => $topicTag,
        'msg' => $message,
    ]);

    sendResponse(true, 'Posted to Event Discussion Space!', [
        'discussion_id' => (int) $pdo->lastInsertId(),
    ], 201);
}

// 2. Official Organizer Reply / Pin Discussion (Staff Only)
if ($action === 'reply_discussion') {
    if (!$isStaff) {
        sendResponse(false, 'Only organizers and administrators can post official replies.', null, 403);
    }

    $discussionId = isset($input['discussion_id']) ? (int) $input['discussion_id'] : 0;
    $replyText    = trim($input['official_reply'] ?? '');
    $isPinned     = !empty($input['is_pinned']) ? 1 : 0;

    if ($discussionId <= 0 || $replyText === '') {
        sendResponse(false, 'Reply text is required.', null, 422);
    }

    $stmt = $pdo->prepare("
        UPDATE event_discussions
        SET official_reply = :reply,
            replied_by = :uid,
            replied_at = NOW(),
            is_pinned = :pinned
        WHERE id = :id
    ");
    $stmt->execute([
        'reply'  => $replyText,
        'uid'    => $user['id'],
        'pinned' => $isPinned,
        'id'     => $discussionId,
    ]);

    sendResponse(true, 'Official organizer response published.');
}

// 3. Delete a Discussion Post (Author or Staff)
if ($action === 'delete_discussion') {
    $discussionId = isset($input['discussion_id']) ? (int) $input['discussion_id'] : 0;
    if ($discussionId <= 0) {
        sendResponse(false, 'Valid discussion_id is required.', null, 422);
    }

    if ($isStaff) {
        $del = $pdo->prepare("DELETE FROM event_discussions WHERE id = :id");
        $del->execute(['id' => $discussionId]);
    } else {
        $del = $pdo->prepare("DELETE FROM event_discussions WHERE id = :id AND user_id = :uid");
        $del->execute(['id' => $discussionId, 'uid' => $user['id']]);
    }

    sendResponse(true, 'Discussion post removed.');
}

// 4. Update Student Attendee Networking Consent & Teammate Finder Preferences
if ($action === 'update_networking') {
    $eventId        = isset($input['event_id']) ? (int) $input['event_id'] : 0;
    $shareProfile   = !empty($input['share_profile']) ? 1 : 0;
    $lookingForTeam = !empty($input['looking_for_team']) ? 1 : 0;
    $teammateNote   = trim($input['teammate_note'] ?? '') ?: null;

    if ($eventId <= 0) {
        sendResponse(false, 'Valid event_id is required.', null, 422);
    }

    $stmt = $pdo->prepare("
        UPDATE registrations
        SET share_profile = :share,
            looking_for_team = :looking,
            teammate_note = :note
        WHERE event_id = :eid AND student_id = :uid
    ");
    $stmt->execute([
        'share'   => $shareProfile,
        'looking' => $lookingForTeam,
        'note'    => $teammateNote,
        'eid'     => $eventId,
        'uid'     => $user['id'],
    ]);

    sendResponse(true, 'Campus Community & Teammate Finder preferences updated!');
}

// 5. Add Event Resource Link (Staff Only)
if ($action === 'add_resource') {
    if (!$isStaff) {
        sendResponse(false, 'Only organizers and administrators can attach event resources.', null, 403);
    }

    $eventId      = isset($input['event_id']) ? (int) $input['event_id'] : 0;
    $title        = trim($input['title'] ?? '');
    $resourceType = strtoupper(trim($input['resource_type'] ?? 'DOCUMENT'));
    $url          = trim($input['url'] ?? '');

    if ($eventId <= 0 || $title === '' || $url === '') {
        sendResponse(false, 'Resource title and URL are required.', null, 422);
    }

    $allowedTypes = ['PROBLEM_STATEMENT', 'SLIDES', 'GITHUB_REPO', 'PHOTO_GALLERY', 'DOCUMENT'];
    if (!in_array($resourceType, $allowedTypes, true)) {
        $resourceType = 'DOCUMENT';
    }

    $stmt = $pdo->prepare("
        INSERT INTO event_resources (event_id, title, resource_type, url, added_by)
        VALUES (:eid, :title, :rtype, :url, :uid)
    ");
    $stmt->execute([
        'eid'   => $eventId,
        'title' => $title,
        'rtype' => $resourceType,
        'url'   => $url,
        'uid'   => $user['id'],
    ]);

    sendResponse(true, 'Event resource attached to the Resource Hub!', [
        'resource_id' => (int) $pdo->lastInsertId(),
    ], 201);
}

// 6. Delete Event Resource Link (Staff Only)
if ($action === 'delete_resource') {
    if (!$isStaff) {
        sendResponse(false, 'Unauthorized.', null, 403);
    }

    $resourceId = isset($input['resource_id']) ? (int) $input['resource_id'] : 0;
    if ($resourceId <= 0) {
        sendResponse(false, 'Valid resource_id is required.', null, 422);
    }

    $del = $pdo->prepare("DELETE FROM event_resources WHERE id = :id");
    $del->execute(['id' => $resourceId]);

    sendResponse(true, 'Resource removed.');
}

sendResponse(false, 'Unsupported community action.', null, 422);
