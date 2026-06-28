<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

// Auth guard — GET list requires admin session
if ($method === 'GET' && !isset($_GET['id'])) {
    if (empty($_SESSION['staff_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
}

if ($method === 'GET' && !isset($_GET['id'])) {
    $stmt = $pdo->query(
        'SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.is_active, c.created_at,
                (SELECT COUNT(*) FROM product_orders po WHERE po.customer_id = c.id) AS order_count
         FROM customers c
         ORDER BY c.last_name
         LIMIT 100'
    );
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'GET' && isset($_GET['id'])) {
    $id   = (int) $_GET['id'];
    $stmt = $pdo->prepare(
        'SELECT id, first_name, last_name, email, phone, is_active, created_at FROM customers WHERE id = ?'
    );
    $stmt->execute([$id]);
    $customer = $stmt->fetch();

    if (!$customer) {
        http_response_code(404);
        echo json_encode(['error' => 'Customer not found']);
        exit;
    }

    $addrStmt = $pdo->prepare(
        'SELECT id, address_label, street_address, city, province, postal_code, is_default
         FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC'
    );
    $addrStmt->execute([$id]);
    $customer['addresses'] = $addrStmt->fetchAll();

    echo json_encode($customer);

} elseif ($method === 'POST') {
    $data       = json_decode(file_get_contents('php://input'), true) ?? [];
    $first_name = trim($data['first_name'] ?? '');
    $last_name  = trim($data['last_name'] ?? '');
    $email      = trim($data['email'] ?? '');
    $phone      = trim($data['phone'] ?? '');

    if ($first_name === '' || $last_name === '' || $email === '') {
        http_response_code(400);
        echo json_encode(['error' => 'first_name, last_name, and email are required']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email address']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO customers (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$first_name, $last_name, $email, $phone]);
    echo json_encode(['id' => (int) $pdo->lastInsertId(), 'success' => true]);

} elseif ($method === 'PUT') {
    if (empty($_SESSION['staff_id'])) {
        // Allow customers to update their own profile
        if (empty($_SESSION['customer_id'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Authentication required']);
            exit;
        }
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Customer ID required']);
        exit;
    }

    $fields = [];
    $params = [];
    foreach (['first_name', 'last_name', 'phone'] as $col) {
        if (array_key_exists($col, $data) && $data[$col] !== null) {
            $fields[] = "$col = ?";
            $params[] = trim((string)$data[$col]);
        }
    }
    if (!empty($data['email'])) {
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email address']);
            exit;
        }
        $fields[] = 'email = ?';
        $params[] = trim($data['email']);
    }

    // Admin-only fields
    if (!empty($_SESSION['staff_id'])) {
        // is_active toggle
        if (isset($data['is_active'])) {
            $fields[] = 'is_active = ?';
            $params[] = $data['is_active'] ? 1 : 0;
        }
        // Password reset by admin
        if (!empty($data['new_password'])) {
            if (strlen($data['new_password']) < 8) {
                http_response_code(400);
                echo json_encode(['error' => 'New password must be at least 8 characters']);
                exit;
            }
            $fields[] = 'password_hash = ?';
            $params[] = password_hash($data['new_password'], PASSWORD_DEFAULT);
        }
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }

    $params[] = $id;
    $stmt = $pdo->prepare('UPDATE customers SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($params);
    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    if (empty($_SESSION['staff_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Customer ID required']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM customers WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
