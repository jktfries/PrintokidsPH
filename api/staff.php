<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && !isset($_GET['id'])) {
    if (empty($_SESSION['staff_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
    $status_filter  = trim($_GET['status'] ?? '');
    $allowed_status = ['Active', 'On Leave', 'Terminated'];

    if ($status_filter !== '' && in_array($status_filter, $allowed_status, true)) {
        $stmt = $pdo->prepare(
            'SELECT s.id, s.first_name, s.last_name, s.email, s.contact_number,
                    s.status, s.is_admin,
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
            'SELECT s.id, s.first_name, s.last_name, s.email, s.contact_number,
                    s.status, s.is_admin,
                    r.title AS role_title, r.standard_rate
             FROM staff s
             LEFT JOIN staff_roles sr ON sr.staff_id = s.id
             LEFT JOIN roles r ON r.id = sr.role_id
             ORDER BY s.last_name'
        );
    }
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'GET' && isset($_GET['id'])) {
    if (empty($_SESSION['staff_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
    $id   = (int) $_GET['id'];
    $stmt = $pdo->prepare(
        'SELECT s.id, s.first_name, s.last_name, s.email, s.contact_number,
                s.status, s.is_admin,
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
    if (empty($_SESSION['staff_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }

    $data           = json_decode(file_get_contents('php://input'), true) ?? [];
    $first_name     = trim($data['first_name'] ?? '');
    $last_name      = trim($data['last_name'] ?? '');
    $email          = trim($data['email'] ?? '');
    $contact_number = trim($data['contact_number'] ?? '');
    $status         = trim($data['status'] ?? 'Active');
    $is_admin       = isset($data['is_admin']) ? ($data['is_admin'] ? 1 : 0) : 0;
    $role_id        = (int) ($data['role_id'] ?? 0);
    $password       = $data['password'] ?? '';

    if ($first_name === '' || $last_name === '') {
        http_response_code(400);
        echo json_encode(['error' => 'first_name and last_name are required']);
        exit;
    }

    $allowed = ['Active', 'On Leave', 'Terminated'];
    if (!in_array($status, $allowed, true)) $status = 'Active';

    $hash = null;
    if ($password !== '') {
        if (strlen($password) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 8 characters']);
            exit;
        }
        $hash = password_hash($password, PASSWORD_DEFAULT);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO staff (first_name, last_name, email, contact_number, password_hash, status, is_admin)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$first_name, $last_name, $email, $contact_number, $hash, $status, $is_admin]);
    $new_id = (int) $pdo->lastInsertId();

    if ($role_id > 0) {
        $roleStmt = $pdo->prepare('INSERT INTO staff_roles (staff_id, role_id) VALUES (?, ?)');
        $roleStmt->execute([$new_id, $role_id]);
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
        echo json_encode(['error' => 'Staff ID required']);
        exit;
    }

    $fields = [];
    $params = [];

    foreach (['first_name', 'last_name', 'contact_number'] as $col) {
        if (array_key_exists($col, $data) && $data[$col] !== null) {
            $fields[] = "$col = ?";
            $params[] = trim((string)$data[$col]);
        }
    }

    if (array_key_exists('email', $data)) {
        $emailVal = trim($data['email'] ?? '');
        if ($emailVal !== '' && !filter_var($emailVal, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email address']);
            exit;
        }
        $fields[] = 'email = ?';
        $params[] = $emailVal !== '' ? $emailVal : null;
    }

    if (!empty($data['status'])) {
        $allowed = ['Active', 'On Leave', 'Terminated'];
        if (in_array($data['status'], $allowed, true)) {
            $fields[] = 'status = ?';
            $params[] = $data['status'];
        }
    }

    // is_admin toggle — only admin can change this
    if (isset($data['is_admin'])) {
        $fields[] = 'is_admin = ?';
        $params[] = $data['is_admin'] ? 1 : 0;
    }

    // Password reset
    if (!empty($data['new_password'])) {
        if (strlen($data['new_password']) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 8 characters']);
            exit;
        }
        $fields[] = 'password_hash = ?';
        $params[] = password_hash($data['new_password'], PASSWORD_DEFAULT);
    }

    if (!empty($fields)) {
        $params[] = $id;
        $stmt = $pdo->prepare('UPDATE staff SET ' . implode(', ', $fields) . ' WHERE id = ?');
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
        $pdo->prepare("DELETE FROM staff WHERE id IN ($placeholders)")->execute($ids);
    } else {
        $id = (int) ($data['id'] ?? 0);
        if ($id === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Staff ID required']);
            exit;
        }
        $pdo->prepare('DELETE FROM staff WHERE id = ?')->execute([$id]);
    }
    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
