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
    $stmt = $conn->prepare("SELECT id, first_name, last_name, email, phone FROM customers WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $result->num_rows > 0) {
        $customer = $result->fetch_assoc();
        
        // Get customer addresses
        $addr_stmt = $conn->prepare("SELECT * FROM customer_addresses WHERE customer_id = ?");
        $addr_stmt->bind_param("i", $id);
        $addr_stmt->execute();
        $addr_result = $addr_stmt->get_result();
        $customer['addresses'] = $addr_result->fetch_all(MYSQLI_ASSOC);
        $addr_stmt->close();
        
        echo json_encode($customer);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Customer not found']);
    }
    $stmt->close();
}

// POST - Create new customer
else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $first_name = $data['first_name'] ?? '';
    $last_name = $data['last_name'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    
    if (empty($first_name) || empty($last_name) || empty($email)) {
        http_response_code(400);
        echo json_encode(['error' => 'First name, last name, and email are required']);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO customers (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $first_name, $last_name, $email, $phone);
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $stmt->insert_id, 'success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Insert failed: ' . $stmt->error]);
    }
    $stmt->close();
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
    
    $first_name = $data['first_name'] ?? '';
    $last_name = $data['last_name'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    
    $updates = [];
    if (!empty($first_name)) $updates[] = ['field' => 'first_name', 'value' => $first_name, 'type' => 's'];
    if (!empty($last_name)) $updates[] = ['field' => 'last_name', 'value' => $last_name, 'type' => 's'];
    if (!empty($email)) $updates[] = ['field' => 'email', 'value' => $email, 'type' => 's'];
    if (!empty($phone)) $updates[] = ['field' => 'phone', 'value' => $phone, 'type' => 's'];
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }
    
    $set_clause = implode(', ', array_map(fn($u) => $u['field'] . ' = ?', $updates));
    $query = "UPDATE customers SET " . $set_clause . " WHERE id = ?";
    
    $stmt = $conn->prepare($query);
    $types = implode('', array_map(fn($u) => $u['type'], $updates)) . 'i';
    $values = array_merge(array_map(fn($u) => $u['value'], $updates), [$id]);
    $stmt->bind_param($types, ...$values);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed: ' . $stmt->error]);
    }
    $stmt->close();
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
    
    $stmt = $conn->prepare("DELETE FROM customers WHERE id = ?");
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
