<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];


if ($method === 'GET' && !isset($_GET['id'])) {
    $stmt = $pdo->query(
        'SELECT eo.id, eo.customer_id, c.first_name, c.last_name,
                eo.event_name, eo.event_date, eo.event_location, eo.status,
                eo.order_date
         FROM event_orders eo
         JOIN customers c ON eo.customer_id = c.id
         ORDER BY eo.order_date DESC
         LIMIT 100'
    );
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'GET' && isset($_GET['id'])) {
    $stmt = $pdo->prepare(
        'SELECT eo.id, eo.customer_id, c.first_name, c.last_name,
                eo.event_name, eo.event_date, eo.event_location, eo.status,
                eo.order_date
         FROM event_orders eo
         JOIN customers c ON eo.customer_id = c.id
         WHERE eo.id = ?'
    );
    $stmt->execute([(int) $_GET['id']]);
    $order = $stmt->fetch();
    if ($order) {
        echo json_encode($order);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
    }

} elseif ($method === 'POST') {
    $data        = json_decode(file_get_contents('php://input'), true) ?? [];
    $customer_id = (int) ($data['customer_id'] ?? 0);
    $event_loc   = trim($data['event_location'] ?? '');
    $event_name  = trim($data['event_name'] ?? '');
    $event_date  = trim($data['event_date'] ?? '');
    $status      = trim($data['status'] ?? 'Pending');

    if ($customer_id === 0 || $event_loc === '') {
        http_response_code(400);
        echo json_encode(['error' => 'customer_id and event_location are required']);
        exit;
    }

    $allowed = ['Pending', 'Confirmed', 'In Production', 'Completed', 'Cancelled'];
    if (!in_array($status, $allowed, true)) $status = 'Pending';

    $stmt = $pdo->prepare(
        'INSERT INTO event_orders (customer_id, event_name, event_date, event_location, status)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$customer_id, $event_name ?: null, $event_date ?: null, $event_loc, $status]);
    echo json_encode(['id' => (int) $pdo->lastInsertId(), 'success' => true]);

} elseif ($method === 'PUT') {
    $data   = json_decode(file_get_contents('php://input'), true) ?? [];
    $id     = (int) ($data['id'] ?? 0);
    $status = trim($data['status'] ?? '');

    if ($id === 0 || $status === '') {
        http_response_code(400);
        echo json_encode(['error' => 'id and status are required']);
        exit;
    }

    $allowed = ['Pending', 'Confirmed', 'In Production', 'Completed', 'Cancelled'];
    if (!in_array($status, $allowed, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status value']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE event_orders SET status = ? WHERE id = ?');
    $stmt->execute([$status, $id]);
    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Order ID required']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM event_orders WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
