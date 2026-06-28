<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

// GET all products / inventory
if ($method === 'GET' && !isset($_GET['id'])) {
    $stmt = $pdo->query("
        SELECT
            p.id, p.name, p.base_cost, p.category, p.description, p.is_active,
            p.stock_count, p.reorder_level, p.stock_status, p.force_out_of_stock, p.created_at,
            CASE
                WHEN p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1
                ELSE 0
            END AS is_new,
            pi.image_url AS primary_image
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
        ORDER BY p.id DESC
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
            stock_count, reorder_level, stock_status, force_out_of_stock, created_at,
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

    $name              = trim($data['name'] ?? '');
    $category          = trim($data['category'] ?? 'General');
    $base_cost         = (float) ($data['base_cost'] ?? 0);
    $description       = trim($data['description'] ?? '');
    $is_active         = isset($data['is_active']) ? (int) $data['is_active'] : 1;
    $stock_count       = (int) ($data['stock_count'] ?? 0);
    $reorder_level     = (int) ($data['reorder_level'] ?? 10);
    $force_out_of_stock = isset($data['force_out_of_stock']) ? (int) $data['force_out_of_stock'] : 0;

    // stock_status: forced override takes precedence
    if ($force_out_of_stock) {
        $stock_status = 'Out of Stock';
    } elseif ($stock_count <= 0) {
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
        INSERT INTO products (name, category, base_cost, description, is_active, stock_count, reorder_level, stock_status, force_out_of_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$name, $category, $base_cost, $description ?: null, $is_active, $stock_count, $reorder_level, $stock_status, $force_out_of_stock]);

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
    }
    // Handle force_out_of_stock toggle (may come with or without stock_count change)
    if (isset($data['force_out_of_stock'])) {
        $foos = (int) $data['force_out_of_stock'];
        $fields[] = 'force_out_of_stock = ?';
        $values[] = $foos;

        // Recalculate stock_status from the most up-to-date values
        $sc2 = isset($data['stock_count'])   ? (int) $data['stock_count']   : null;
        $rl2 = isset($data['reorder_level']) ? (int) $data['reorder_level'] : null;
        if ($sc2 === null || $rl2 === null) {
            // Fetch current values from DB
            $cur = $pdo->prepare('SELECT stock_count, reorder_level FROM products WHERE id = ?');
            $cur->execute([$id]);
            $row = $cur->fetch();
            if ($sc2 === null) $sc2 = (int) ($row['stock_count']   ?? 0);
            if ($rl2 === null) $rl2 = (int) ($row['reorder_level'] ?? 10);
        }

        if ($foos) {
            $ss = 'Out of Stock';
        } elseif ($sc2 <= 0) {
            $ss = 'Out of Stock';
        } elseif ($sc2 <= $rl2) {
            $ss = 'Low Stock';
        } else {
            $ss = 'In Stock';
        }
        $fields[] = 'stock_status = ?';
        $values[] = $ss;
    } elseif (isset($data['stock_count'])) {
        // stock_count changed but no force override — recalculate status
        $sc2 = (int) $data['stock_count'];
        $rl2 = isset($data['reorder_level']) ? (int) $data['reorder_level'] : null;
        if ($rl2 === null) {
            $cur = $pdo->prepare('SELECT reorder_level, force_out_of_stock FROM products WHERE id = ?');
            $cur->execute([$id]);
            $row = $cur->fetch();
            $rl2  = (int) ($row['reorder_level']     ?? 10);
            $foos = (int) ($row['force_out_of_stock'] ?? 0);
        } else {
            $cur  = $pdo->prepare('SELECT force_out_of_stock FROM products WHERE id = ?');
            $cur->execute([$id]);
            $row  = $cur->fetch();
            $foos = (int) ($row['force_out_of_stock'] ?? 0);
        }
        if ($foos) {
            $ss = 'Out of Stock';
        } elseif ($sc2 <= 0) {
            $ss = 'Out of Stock';
        } elseif ($sc2 <= $rl2) {
            $ss = 'Low Stock';
        } else {
            $ss = 'In Stock';
        }
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
