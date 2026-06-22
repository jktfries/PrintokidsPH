<?php
header('Content-Type: application/json');
include '../includes/config.php';

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET all products (inventory)
if ($method === 'GET' && !isset($_GET['id'])) {
    $query = "SELECT id, name, base_cost, category FROM products LIMIT 100";
    $result = $conn->query($query);
    
    if ($result) {
        $products = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($products);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Query failed: ' . $conn->error]);
    }
}

// GET single product
else if ($method === 'GET' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $stmt = $conn->prepare("SELECT id, name, base_cost, category FROM products WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $result->num_rows > 0) {
        $product = $result->fetch_assoc();
        echo json_encode($product);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
    }
    $stmt->close();
}

// POST - Create new product
else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $data['name'] ?? '';
    $category = $data['category'] ?? 'General';
    $base_cost = floatval($data['base_cost'] ?? 0);
    
    if (empty($name) || $base_cost <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid product data']);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO products (name, category, base_cost) VALUES (?, ?, ?)");
    $stmt->bind_param("ssd", $name, $category, $base_cost);
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $stmt->insert_id, 'success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Insert failed: ' . $stmt->error]);
    }
    $stmt->close();
}

// PUT - Update product
else if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID required']);
        exit;
    }
    
    $name = $data['name'] ?? '';
    $category = $data['category'] ?? '';
    $base_cost = floatval($data['base_cost'] ?? 0);
    
    $updates = [];
    if (!empty($name)) $updates[] = ['field' => 'name', 'value' => $name, 'type' => 's'];
    if (!empty($category)) $updates[] = ['field' => 'category', 'value' => $category, 'type' => 's'];
    if ($base_cost > 0) $updates[] = ['field' => 'base_cost', 'value' => $base_cost, 'type' => 'd'];
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }
    
    $set_clause = implode(', ', array_map(fn($u) => $u['field'] . ' = ?', $updates));
    $query = "UPDATE products SET " . $set_clause . " WHERE id = ?";
    
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

// DELETE - Remove product
else if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
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
