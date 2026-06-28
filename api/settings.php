<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

// GET — public; returns all settings as { key: value }
if ($method === 'GET') {
    $stmt = $pdo->query('SELECT `key`, `value` FROM store_settings');
    $rows = $stmt->fetchAll();
    $out  = [];
    foreach ($rows as $r) {
        $out[$r['key']] = $r['value'];
    }
    echo json_encode($out);
    exit;
}

// PUT — admin only; accepts { key: value, ... } and upserts each pair
if ($method === 'PUT') {
    if (empty($_SESSION['staff_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    if (empty($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'No settings provided']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO store_settings (`key`, `value`) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)'
    );

    foreach ($data as $key => $value) {
        $stmt->execute([trim($key), $value === null ? null : (string) $value]);
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
