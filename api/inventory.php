<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && !isset($_GET['id'])) {
    $stmt = $pdo->query(
        'SELECT id, name, base_cost, category FROM products ORDER BY name LIMIT 100'
    );
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'GET' && isset($_GET['id'])) {
    $stmt = $pdo->prepare(
        'SELECT id, name, base_cost, category FROM products WHERE id = ?'
    );
    $stmt->execute([(int) $_GET['id']]);
    $product = $stmt->fetch();
    if ($product) {
        echo json_encode($product);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
    }

} elseif ($method === 'POST') {
    $data     = json_decode(file_get_contents('php://input'), true) ?? [];
    $name     = trim($data['name'] ?? '');
    $category = trim($data['category'] ?? 'General');
    $base_cost = (float) ($data['base_cost'] ?? 0);

    if ($name === '' || $base_cost <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and a positive base_cost are required']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO products (name, category, base_cost) VALUES (?, ?, ?)'
    );
    $stmt->execute([$name, $category, $base_cost]);
    echo json_encode(['id' => (int) $pdo->lastInsertId(), 'success' => true]);

} elseif ($method === 'PUT') {
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

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }

    $params[] = $id;
    $stmt = $pdo->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($params);
    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID required']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
