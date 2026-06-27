<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

// GET all products / inventory
if ($method === 'GET' && !isset($_GET['id'])) {
    $stmt = $pdo->query("
        SELECT 
            id, name, base_cost, category, description, is_active,
            stock_count, reorder_level, stock_status, created_at,
            CASE 
                WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1
                ELSE 0
            END AS is_new
        FROM products
        ORDER BY id DESC
        LIMIT 100
    ");
    echo json_encode($stmt->fetchAll());
}

// GET single product
elseif ($method === 'GET' && isset($_GET['id'])) {
    $id   = (int) $_GET['id'];
    $stmt = $pdo->prepare("
        SELECT 
            id, name, base_cost, category, description, is_active,
            stock_count, reorder_level, stock_status, created_at,
            CASE 
                WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1
                ELSE 0
            END AS is_new
        FROM products WHERE id = ?
    ");
    $stmt->execute([$id]);
    $product = $stmt->fetch();

    if (!$product) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
        exit;
    }
    echo json_encode($product);
}

// POST - Create new product
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $name          = trim($data['name'] ?? '');
    $category      = trim($data['category'] ?? 'General');
    $base_cost     = (float) ($data['base_cost'] ?? 0);
    $description   = trim($data['description'] ?? '');
    $is_active     = isset($data['is_active']) ? (int) $data['is_active'] : 1;
    $stock_count   = (int)   ($data['stock_count'] ?? 0);
    $reorder_level = (int)   ($data['reorder_level'] ?? 10);

    // Auto-calculate stock status
    if ($stock_count <= 0) {
        $stock_status = 'Out of Stock';
    } elseif ($stock_count <= $reorder_level) {
        $stock_status = 'Low Stock';
    } else {
        $stock_status = 'In Stock';
    }

    if ($name === '' || $base_cost <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and valid base_cost are required']);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO products (name, category, base_cost, description, is_active, stock_count, reorder_level, stock_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$name, $category, $base_cost, $description ?: null, $is_active, $stock_count, $reorder_level, $stock_status]);

    echo json_encode(['id' => (int) $pdo->lastInsertId(), 'success' => true]);
}

// PUT - Update product
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID required']);
        exit;
    }

    $fields = [];
    $values = [];

    if (!empty(trim($data['name'] ?? ''))) {
        $fields[] = 'name = ?';
        $values[] = trim($data['name']);
    }
    if (!empty(trim($data['category'] ?? ''))) {
        $fields[] = 'category = ?';
        $values[] = trim($data['category']);
    }
    if (($data['base_cost'] ?? 0) > 0) {
        $fields[] = 'base_cost = ?';
        $values[] = (float) $data['base_cost'];
    }
    if (array_key_exists('description', $data)) {
        $fields[] = 'description = ?';
        $values[] = trim($data['description']) ?: null;
    }
    if (isset($data['is_active'])) {
        $fields[] = 'is_active = ?';
        $values[] = (int) $data['is_active'];
    }
    if (isset($data['stock_count'])) {
        $sc = (int) $data['stock_count'];
        $rl = (int) ($data['reorder_level'] ?? 10);

        $fields[] = 'stock_count = ?';
        $values[] = $sc;

        if (isset($data['reorder_level'])) {
            $fields[] = 'reorder_level = ?';
            $values[] = $rl;
        }

        // Auto-calculate status
        if ($sc <= 0)       $ss = 'Out of Stock';
        elseif ($sc <= $rl) $ss = 'Low Stock';
        else                $ss = 'In Stock';

        $fields[] = 'stock_status = ?';
        $values[] = $ss;
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }

    $values[] = $id;
    $sql  = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    echo json_encode(['success' => true]);
}

// DELETE
elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID required']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
