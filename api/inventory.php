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
    $query = "SELECT id, name, base_cost, category FROM products WHERE id = $id";
    $result = $conn->query($query);
    
    if ($result && $result->num_rows > 0) {
        $product = $result->fetch_assoc();
        echo json_encode($product);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
    }
}

// POST - Create new product
else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $conn->real_escape_string($data['name'] ?? '');
    $category = $conn->real_escape_string($data['category'] ?? 'General');
    $base_cost = floatval($data['base_cost'] ?? 0);
    
    if (empty($name) || $base_cost <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid product data']);
        exit;
    }
    
    $query = "INSERT INTO products (name, category, base_cost) VALUES ('$name', '$category', $base_cost)";
    
    if ($conn->query($query)) {
        echo json_encode(['id' => $conn->insert_id, 'success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Insert failed: ' . $conn->error]);
    }
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
    
    $name = $conn->real_escape_string($data['name'] ?? '');
    $category = $conn->real_escape_string($data['category'] ?? '');
    $base_cost = floatval($data['base_cost'] ?? 0);
    
    $query = "UPDATE products SET ";
    $updates = [];
    if (!empty($name)) $updates[] = "name = '$name'";
    if (!empty($category)) $updates[] = "category = '$category'";
    if ($base_cost > 0) $updates[] = "base_cost = $base_cost";
    
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

// DELETE - Remove product
else if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID required']);
        exit;
    }
    
    $query = "DELETE FROM products WHERE id = $id";
    
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
