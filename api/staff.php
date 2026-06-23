<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && !isset($_GET['id'])) {
    $status_filter = trim($_GET['status'] ?? '');
    $allowed_status = ['Active', 'On Leave', 'Terminated'];

    if ($status_filter !== '' && in_array($status_filter, $allowed_status, true)) {
        $stmt = $pdo->prepare(
            'SELECT s.id, s.first_name, s.last_name, s.contact_number, s.status,
                    r.title AS role_title, r.standard_rate
             FROM staff s
             LEFT JOIN staff_roles sr ON sr.staff_id = s.id
             LEFT JOIN roles r ON r.id = sr.role_id
             WHERE s.status = ?
             ORDER BY s.last_name'
        );
        $stmt->execute([$status_filter]);
    } else {
        $stmt = $pdo->query(
            'SELECT s.id, s.first_name, s.last_name, s.contact_number, s.status,
                    r.title AS role_title, r.standard_rate
             FROM staff s
             LEFT JOIN staff_roles sr ON sr.staff_id = s.id
             LEFT JOIN roles r ON r.id = sr.role_id
             ORDER BY s.last_name'
        );
    }
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'GET' && isset($_GET['id'])) {
    $id   = (int) $_GET['id'];
    $stmt = $pdo->prepare(
        'SELECT s.id, s.first_name, s.last_name, s.contact_number, s.status,
                r.title AS role_title, r.id AS role_id, r.standard_rate
         FROM staff s
         LEFT JOIN staff_roles sr ON sr.staff_id = s.id
         LEFT JOIN roles r ON r.id = sr.role_id
         WHERE s.id = ?'
    );
    $stmt->execute([$id]);
    $staff = $stmt->fetch();

    if (!$staff) {
        http_response_code(404);
        echo json_encode(['error' => 'Staff member not found']);
        exit;
    }

    // Event assignments
    $assignStmt = $pdo->prepare(
        'SELECT esa.order_id, eo.event_location, eo.status AS order_status,
                r.title AS role_assigned
         FROM event_staff_assignments esa
         JOIN event_orders eo ON eo.id = esa.order_id
         JOIN roles r ON r.id = esa.role_id
         WHERE esa.staff_id = ?
         ORDER BY eo.order_date DESC
         LIMIT 20'
    );
    $assignStmt->execute([$id]);
    $staff['assignments'] = $assignStmt->fetchAll();

    echo json_encode($staff);

} elseif ($method === 'POST') {
    $data           = json_decode(file_get_contents('php://input'), true) ?? [];
    $first_name     = trim($data['first_name'] ?? '');
    $last_name      = trim($data['last_name'] ?? '');
    $contact_number = trim($data['contact_number'] ?? '');
    $status         = trim($data['status'] ?? 'Active');
    $role_id        = (int) ($data['role_id'] ?? 0);

    if ($first_name === '' || $last_name === '') {
        http_response_code(400);
        echo json_encode(['error' => 'first_name and last_name are required']);
        exit;
    }

    $allowed = ['Active', 'On Leave', 'Terminated'];
    if (!in_array($status, $allowed, true)) $status = 'Active';

    $stmt = $pdo->prepare(
        'INSERT INTO staff (first_name, last_name, contact_number, status) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$first_name, $last_name, $contact_number, $status]);
    $new_id = (int) $pdo->lastInsertId();

    if ($role_id > 0) {
        $roleStmt = $pdo->prepare('INSERT INTO staff_roles (staff_id, role_id) VALUES (?, ?)');
        $roleStmt->execute([$new_id, $role_id]);
    }

    echo json_encode(['id' => $new_id, 'success' => true]);

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Staff ID required']);
        exit;
    }

    $fields = [];
    $params = [];
    foreach (['first_name', 'last_name', 'contact_number'] as $col) {
        if (!empty($data[$col])) {
            $fields[] = "$col = ?";
            $params[] = trim($data[$col]);
        }
    }
    if (!empty($data['status'])) {
        $allowed = ['Active', 'On Leave', 'Terminated'];
        if (in_array($data['status'], $allowed, true)) {
            $fields[] = 'status = ?';
            $params[] = $data['status'];
        }
    }

    if (!empty($fields)) {
        $params[] = $id;
        $stmt = $pdo->prepare('UPDATE staff SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($params);
    }

    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Staff ID required']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM staff WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
