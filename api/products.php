<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

// GET all products with primary image
if ($method === 'GET' && !isset($_GET['id'])) {
    $category = trim($_GET['category'] ?? '');

    $base_sql = 'SELECT p.id, p.name, p.category, p.base_cost, p.description, p.is_active,
                        p.stock_status, p.force_out_of_stock,
                        pi.image_url AS primary_image
                 FROM products p
                 LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1';

    // By default, only show active products to clients
    $show_all = isset($_GET['show_all']) && $_GET['show_all'] === '1';

    $conditions = [];
    $params     = [];

    if (!$show_all) {
        $conditions[] = 'p.is_active = 1';
    }
    if ($category !== '') {
        $conditions[] = 'p.category = ?';
        $params[]     = $category;
    }

    if (!empty($conditions)) {
        $base_sql .= ' WHERE ' . implode(' AND ', $conditions);
    }

    $base_sql .= ' ORDER BY p.name LIMIT 100';

    $stmt = $pdo->prepare($base_sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());

// GET single product with attributes and all images
} elseif ($method === 'GET' && isset($_GET['id'])) {
    $id = (int) $_GET['id'];

    $stmt = $pdo->prepare(
        'SELECT id, name, category, base_cost, description, is_active,
                stock_status, stock_count, force_out_of_stock
         FROM products WHERE id = ?'
    );
    $stmt->execute([$id]);
    $product = $stmt->fetch();

    if (!$product) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
        exit;
    }

    // Attributes
    $attrStmt = $pdo->prepare(
        'SELECT attribute_name, attribute_value FROM products_attributes WHERE product_id = ?'
    );
    $attrStmt->execute([$id]);
    $product['attributes'] = $attrStmt->fetchAll();

    // Images
    $imgStmt = $pdo->prepare(
        'SELECT id, image_url, is_primary FROM product_images
         WHERE product_id = ? ORDER BY is_primary DESC'
    );
    $imgStmt->execute([$id]);
    $product['images'] = $imgStmt->fetchAll();

    echo json_encode($product);

} elseif ($method === 'POST') {
    if (empty($_SESSION['staff_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
    $data        = json_decode(file_get_contents('php://input'), true) ?? [];
    $name        = trim($data['name'] ?? '');
    $category    = trim($data['category'] ?? 'General');
    $base_cost   = (float) ($data['base_cost'] ?? 0);
    $description = trim($data['description'] ?? '');
    $is_active   = isset($data['is_active']) ? (int) $data['is_active'] : 1;

    if ($name === '' || $base_cost <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'name and a positive base_cost are required']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO products (name, category, base_cost, description, is_active)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$name, $category, $base_cost, $description ?: null, $is_active]);
    $new_id = (int) $pdo->lastInsertId();

    // Optional: insert attributes
    if (!empty($data['attributes']) && is_array($data['attributes'])) {
        $attrStmt = $pdo->prepare(
            'INSERT INTO products_attributes (product_id, attribute_name, attribute_value) VALUES (?, ?, ?)'
        );
        foreach ($data['attributes'] as $attr) {
            if (!empty($attr['name']) && !empty($attr['value'])) {
                $attrStmt->execute([$new_id, $attr['name'], $attr['value']]);
            }
        }
    }

    echo json_encode(['id' => $new_id, 'success' => true]);

} elseif ($method === 'PUT') {
    if (empty($_SESSION['staff_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID required']);
        exit;
    }

    $fields = [];
    $params = [];
    if (!empty($data['name']))     { $fields[] = 'name = ?';      $params[] = trim($data['name']); }
    if (!empty($data['category'])) { $fields[] = 'category = ?';  $params[] = trim($data['category']); }
    if (isset($data['base_cost']) && (float) $data['base_cost'] > 0) {
        $fields[] = 'base_cost = ?';
        $params[] = (float) $data['base_cost'];
    }
    if (array_key_exists('description', $data)) {
        $fields[] = 'description = ?';
        $params[] = trim($data['description']) ?: null;
    }
    if (isset($data['is_active'])) {
        $fields[] = 'is_active = ?';
        $params[] = (int) $data['is_active'];
    }
    if (isset($data['force_out_of_stock'])) {
        $foos = (int) $data['force_out_of_stock'];
        $fields[] = 'force_out_of_stock = ?';
        $params[] = $foos;
        if ($foos) {
            $fields[] = 'stock_status = ?';
            $params[] = 'Out of Stock';
        } else {
            // Recalculate from current stock counts (fetch them first)
            $sc = $pdo->prepare('SELECT stock_count, reorder_level FROM products WHERE id = ?');
            $sc->execute([$id]);
            $row = $sc->fetch();
            if ($row) {
                $cnt = (int) $row['stock_count'];
                $rl  = (int) $row['reorder_level'];
                $ss  = $cnt <= 0 ? 'Out of Stock' : ($cnt <= $rl ? 'Low Stock' : 'In Stock');
                $fields[] = 'stock_status = ?';
                $params[] = $ss;
            }
        }
    }

    if (!empty($fields)) {
        $params[] = $id;
        $stmt = $pdo->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($params);
    }

    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    if (empty($_SESSION['staff_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    if (!empty($data['ids']) && is_array($data['ids'])) {
        $ids = array_filter(array_map('intval', $data['ids']));
        if (empty($ids)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid IDs provided']);
            exit;
        }
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $pdo->prepare("DELETE FROM products WHERE id IN ($placeholders)")->execute($ids);
    } else {
        $id = (int) ($data['id'] ?? 0);
        if ($id === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID required']);
            exit;
        }
        $pdo->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    }
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
