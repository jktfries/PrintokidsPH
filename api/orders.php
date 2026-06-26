<?php
header('Content-Type: application/json');
include '../includes/config.php';

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET all orders
if ($method === 'GET' && !isset($_GET['id'])) {
    $query = "SELECT eo.id, eo.customer_id, c.first_name, c.last_name, eo.event_location, eo.status 
              FROM event_orders eo 
              JOIN customers c ON eo.customer_id = c.id 
              LIMIT 100";
    $result = $conn->query($query);
    
    if ($result) {
        $orders = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($orders);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Query failed: ' . $conn->error]);
    }
}

// GET single order
else if ($method === 'GET' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $stmt = $conn->prepare("SELECT eo.id, eo.customer_id, c.first_name, c.last_name, eo.event_location, eo.status 
              FROM event_orders eo 
              JOIN customers c ON eo.customer_id = c.id 
              WHERE eo.id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $result->num_rows > 0) {
        $order = $result->fetch_assoc();
        echo json_encode($order);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
    }
    $stmt->close();
}

// POST - Create new order
else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $customer_id = intval($data['customer_id'] ?? 0);
    $event_location = $data['event_location'] ?? '';
    $status = $data['status'] ?? 'Pending';
    
    if ($customer_id === 0 || empty($event_location)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid order data']);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO event_orders (customer_id, event_location, status) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $customer_id, $event_location, $status);
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $stmt->insert_id, 'success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Insert failed: ' . $stmt->error]);
    }
    $stmt->close();
}

// PUT - Update order status
// PUT - Update order
else if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    $id = intval($data['id'] ?? 0);
    $customer_id = intval($data['customer_id'] ?? 0);
    $event_location = trim($data['event_location'] ?? '');
    $status = trim($data['status'] ?? '');

    if ($id === 0 || $customer_id === 0 || empty($event_location) || empty($status)) {
        http_response_code(400);
        echo json_encode(['error' => 'Order ID, customer ID, event location, and status are required']);
        exit;
    }

    $stmt = $conn->prepare("
        UPDATE event_orders
        SET customer_id = ?, event_location = ?, status = ?
        WHERE id = ?
    ");

    $stmt->bind_param("issi", $customer_id, $event_location, $status, $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed: ' . $stmt->error]);
    }

    $stmt->close();
}

// DELETE - Remove order
else if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Order ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("DELETE FROM event_orders WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Delete failed: ' . $stmt->error]);
    }
    $stmt->close();
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>
