<?php
header('Content-Type: application/json');
include '../includes/config.php';

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET all customers
if ($method === 'GET' && !isset($_GET['id'])) {
    $query = "SELECT id, first_name, last_name, email, phone FROM customers LIMIT 100";
    $result = $conn->query($query);
    
    if ($result) {
        $customers = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($customers);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Query failed: ' . $conn->error]);
    }
}

// GET single customer with addresses
else if ($method === 'GET' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $query = "SELECT id, first_name, last_name, email, phone FROM customers WHERE id = $id";
    $result = $conn->query($query);
    
    if ($result && $result->num_rows > 0) {
        $customer = $result->fetch_assoc();
        
        // Get customer addresses
        $addr_query = "SELECT * FROM customer_addresses WHERE customer_id = $id";
        $addr_result = $conn->query($addr_query);
        $customer['addresses'] = $addr_result->fetch_all(MYSQLI_ASSOC);
        
        echo json_encode($customer);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Customer not found']);
    }
}

// POST - Create new customer
else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $first_name = $conn->real_escape_string($data['first_name'] ?? '');
    $last_name = $conn->real_escape_string($data['last_name'] ?? '');
    $email = $conn->real_escape_string($data['email'] ?? '');
    $phone = $conn->real_escape_string($data['phone'] ?? '');
    
    if (empty($first_name) || empty($last_name) || empty($email)) {
        http_response_code(400);
        echo json_encode(['error' => 'First name, last name, and email are required']);
        exit;
    }
    
    $query = "INSERT INTO customers (first_name, last_name, email, phone) VALUES ('$first_name', '$last_name', '$email', '$phone')";
    
    if ($conn->query($query)) {
        echo json_encode(['id' => $conn->insert_id, 'success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Insert failed: ' . $conn->error]);
    }
}

// PUT - Update customer
else if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Customer ID required']);
        exit;
    }
    
    $first_name = $conn->real_escape_string($data['first_name'] ?? '');
    $last_name = $conn->real_escape_string($data['last_name'] ?? '');
    $email = $conn->real_escape_string($data['email'] ?? '');
    $phone = $conn->real_escape_string($data['phone'] ?? '');
    
    $query = "UPDATE customers SET ";
    $updates = [];
    if (!empty($first_name)) $updates[] = "first_name = '$first_name'";
    if (!empty($last_name)) $updates[] = "last_name = '$last_name'";
    if (!empty($email)) $updates[] = "email = '$email'";
    if (!empty($phone)) $updates[] = "phone = '$phone'";
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }
    
    $query .= implode(', ', $updates) . " WHERE id = $id";
    
    if ($conn->query($query)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed: ' . $conn->error]);
    }
}

// DELETE - Remove customer
else if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Customer ID required']);
        exit;
    }
    
    $query = "DELETE FROM customers WHERE id = $id";
    
    if ($conn->query($query)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Delete failed: ' . $conn->error]);
    }
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>
