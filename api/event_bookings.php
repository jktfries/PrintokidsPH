<?php
header('Content-Type: application/json');
include '../includes/config.php';

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = "
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
    ";

    $result = $conn->query($query);

    if ($result) {
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Query failed: ' . $conn->error]);
    }
}

else if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    $order_id = intval($data['order_id'] ?? 0);
    $status = trim($data['status'] ?? '');

    $allowedStatuses = ['Pending', 'Confirmed', 'In Production', 'Completed'];

    if ($order_id === 0 || !in_array($status, $allowedStatuses)) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid order ID and status are required']);
        exit;
    }

    $stmt = $conn->prepare("
        UPDATE event_orders
        SET status = ?
        WHERE id = ?
    ");

    $stmt->bind_param("si", $status, $order_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed: ' . $stmt->error]);
    }

    $stmt->close();
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>