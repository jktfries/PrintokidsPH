<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

// GET - List all event bookings with details
if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT 
            os.id AS booking_id,
            eo.id AS order_id,
            eo.event_location,
            eo.status,
            c.first_name,
            c.last_name,
            s.service_name,
            a.asset_name,
            os.start_time,
            os.end_time,
            os.price_charged
        FROM order_services os
        INNER JOIN event_orders eo ON os.order_id = eo.id
        INNER JOIN customers c ON eo.customer_id = c.id
        INNER JOIN services s ON os.service_id = s.id
        INNER JOIN assets a ON os.asset_id = a.id
        ORDER BY os.start_time DESC
        LIMIT 100
    ");
    echo json_encode($stmt->fetchAll());
}

// PUT - Update event booking status
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    $order_id = (int) ($data['order_id'] ?? 0);
    $status   = trim($data['status'] ?? '');

    $allowed = ['Pending', 'Confirmed', 'In Production', 'Completed'];

    if ($order_id === 0 || !in_array($status, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid order ID and status are required']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE event_orders SET status = ? WHERE id = ?");
    $stmt->execute([$status, $order_id]);

    echo json_encode(['success' => true]);
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
