<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && !isset($_GET['id'])) {
    $stmt = $pdo->query('SELECT id, service_name, description FROM services ORDER BY id');
    $services = $stmt->fetchAll();

    // Attach assets to each service
    $assetStmt = $pdo->prepare(
        'SELECT id, asset_name, asset_type FROM assets WHERE id IN (
             SELECT DISTINCT asset_id FROM order_services WHERE service_id = ?
         )'
    );
    foreach ($services as &$svc) {
        $assetStmt->execute([$svc['id']]);
        $svc['assets'] = $assetStmt->fetchAll();
    }

    echo json_encode($services);

} elseif ($method === 'GET' && isset($_GET['id'])) {
    $stmt = $pdo->prepare('SELECT id, service_name, description FROM services WHERE id = ?');
    $stmt->execute([(int) $_GET['id']]);
    $service = $stmt->fetch();

    if (!$service) {
        http_response_code(404);
        echo json_encode(['error' => 'Service not found']);
        exit;
    }

    echo json_encode($service);

} elseif ($method === 'POST') {
    $data        = json_decode(file_get_contents('php://input'), true) ?? [];
    $name        = trim($data['service_name'] ?? '');
    $description = trim($data['description'] ?? '');

    if ($name === '') {
        http_response_code(400);
        echo json_encode(['error' => 'service_name is required']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO services (service_name, description) VALUES (?, ?)');
    $stmt->execute([$name, $description]);
    echo json_encode(['id' => (int) $pdo->lastInsertId(), 'success' => true]);

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Service ID required']);
        exit;
    }

    $fields = [];
    $params = [];
    if (!empty($data['service_name'])) { $fields[] = 'service_name = ?'; $params[] = trim($data['service_name']); }
    if (isset($data['description']))   { $fields[] = 'description = ?';  $params[] = trim($data['description']); }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }

    $params[] = $id;
    $stmt = $pdo->prepare('UPDATE services SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($params);
    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Service ID required']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM services WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
