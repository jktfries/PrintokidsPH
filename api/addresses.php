<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

if (empty($_SESSION['customer_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$session_customer_id = (int) $_SESSION['customer_id'];

// GET — list all addresses for the logged-in customer
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, address_label, street_address, city, province, postal_code, is_default
         FROM customer_addresses
         WHERE customer_id = ?
         ORDER BY is_default DESC, id ASC'
    );
    $stmt->execute([$session_customer_id]);
    echo json_encode($stmt->fetchAll());
    exit;
}

// POST — add a new address
if ($method === 'POST') {
    $data       = json_decode(file_get_contents('php://input'), true) ?? [];
    $street     = trim($data['street_address'] ?? '');
    $city       = trim($data['city'] ?? '');
    $province   = trim($data['province'] ?? '');
    $postal     = trim($data['postal_code'] ?? '');
    $label      = trim($data['address_label'] ?? '');
    $is_default = !empty($data['is_default']) ? 1 : 0;

    if ($street === '' || $city === '' || $province === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Street address, city, and province are required']);
        exit;
    }

    // First address is always default
    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM customer_addresses WHERE customer_id = ?');
    $countStmt->execute([$session_customer_id]);
    if ((int) $countStmt->fetchColumn() === 0) {
        $is_default = 1;
    }

    // Clear existing default before setting a new one
    if ($is_default) {
        $pdo->prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?')
            ->execute([$session_customer_id]);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO customer_addresses
             (customer_id, address_label, street_address, city, province, postal_code, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$session_customer_id, $label ?: null, $street, $city, $province, $postal ?: null, $is_default]);

    echo json_encode(['success' => true, 'id' => (int) $pdo->lastInsertId()]);
    exit;
}

// PUT — update an address, or set it as default
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Address ID required']);
        exit;
    }

    // Ownership check
    $check = $pdo->prepare('SELECT customer_id FROM customer_addresses WHERE id = ?');
    $check->execute([$id]);
    $addr = $check->fetch();

    if (!$addr || (int) $addr['customer_id'] !== $session_customer_id) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }

    // Set-default only
    if (!empty($data['set_default'])) {
        $pdo->prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?')
            ->execute([$session_customer_id]);
        $pdo->prepare('UPDATE customer_addresses SET is_default = 1 WHERE id = ?')
            ->execute([$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    // Full update
    $street     = trim($data['street_address'] ?? '');
    $city       = trim($data['city'] ?? '');
    $province   = trim($data['province'] ?? '');
    $postal     = trim($data['postal_code'] ?? '');
    $label      = trim($data['address_label'] ?? '');
    $is_default = !empty($data['is_default']) ? 1 : 0;

    if ($street === '' || $city === '' || $province === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Street address, city, and province are required']);
        exit;
    }

    if ($is_default) {
        $pdo->prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?')
            ->execute([$session_customer_id]);
    }

    $stmt = $pdo->prepare(
        'UPDATE customer_addresses
         SET address_label = ?, street_address = ?, city = ?, province = ?,
             postal_code = ?, is_default = ?
         WHERE id = ?'
    );
    $stmt->execute([$label ?: null, $street, $city, $province, $postal ?: null, $is_default, $id]);
    echo json_encode(['success' => true]);
    exit;
}

// DELETE — remove an address
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Address ID required']);
        exit;
    }

    // Ownership check
    $check = $pdo->prepare('SELECT customer_id, is_default FROM customer_addresses WHERE id = ?');
    $check->execute([$id]);
    $addr = $check->fetch();

    if (!$addr || (int) $addr['customer_id'] !== $session_customer_id) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }

    $pdo->prepare('DELETE FROM customer_addresses WHERE id = ?')->execute([$id]);

    // If the deleted address was the default, promote the next one
    if ($addr['is_default']) {
        $next = $pdo->prepare(
            'SELECT id FROM customer_addresses WHERE customer_id = ? ORDER BY id ASC LIMIT 1'
        );
        $next->execute([$session_customer_id]);
        $nextAddr = $next->fetch();
        if ($nextAddr) {
            $pdo->prepare('UPDATE customer_addresses SET is_default = 1 WHERE id = ?')
                ->execute([$nextAddr['id']]);
        }
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
