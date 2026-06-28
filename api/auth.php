<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$action = $_GET['action'] ?? (json_decode(file_get_contents('php://input'), true)['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'];

// ── GET /api/auth.php?action=check-- ───────────────────────────────────────────
if ($method === 'GET' && $action === 'check') {
    if (isset($_SESSION['customer_id'])) {
        echo json_encode([
            'logged_in'  => true,
            'user_type'  => 'customer',
            'id'         => $_SESSION['customer_id'],
            'first_name' => $_SESSION['first_name'],
            'last_name'  => $_SESSION['last_name'],
            'email'      => $_SESSION['email'],
        ]);
    } elseif (isset($_SESSION['staff_id'])) {
        echo json_encode([
            'logged_in'  => true,
            'user_type'  => 'admin',
            'id'         => $_SESSION['staff_id'],
            'first_name' => $_SESSION['first_name'],
            'last_name'  => $_SESSION['last_name'],
            'is_admin'   => $_SESSION['is_admin'] ?? false,
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
    exit;
}

// ── POST actions ─────────────────────────────────────────────────────────────
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $data['action'] ?? $action;

// ── register ──────────────────────────────────────────────────────────────────
if ($action === 'register') {
    $first_name = trim($data['first_name'] ?? '');
    $last_name  = trim($data['last_name'] ?? '');
    $email      = trim($data['email'] ?? '');
    $password   = $data['password'] ?? '';
    $phone      = trim($data['phone'] ?? '');

    if ($first_name === '' || $last_name === '' || $email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['error' => 'first_name, last_name, email, and password are required']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email address']);
        exit;
    }

    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters']);
        exit;
    }

    // Check duplicate email
    $check = $pdo->prepare('SELECT id FROM customers WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'An account with this email already exists']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare(
        'INSERT INTO customers (first_name, last_name, email, phone, password_hash)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$first_name, $last_name, $email, $phone, $hash]);
    $new_id = (int) $pdo->lastInsertId();

    $_SESSION['customer_id'] = $new_id;
    $_SESSION['first_name']  = $first_name;
    $_SESSION['last_name']   = $last_name;
    $_SESSION['email']       = $email;

    echo json_encode([
        'success'    => true,
        'user_type'  => 'customer',
        'id'         => $new_id,
        'first_name' => $first_name,
        'last_name'  => $last_name,
        'email'      => $email,
    ]);
    exit;
}

// ── login ─────────────────────────────────────────────────────────────────────
if ($action === 'login') {
    $email     = trim($data['email'] ?? '');
    $password  = $data['password'] ?? '';
    $user_type = $data['user_type'] ?? 'customer'; // 'customer' or 'admin'

    if ($email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        exit;
    }

    if ($user_type === 'admin') {
        // Staff log in using their numeric staff ID (entered in the email field)
        $staff_id_input = (int) $email;
        $stmt = $pdo->prepare(
            'SELECT id, first_name, last_name, password_hash, is_admin
             FROM staff WHERE id = ? AND status = "Active"'
        );
        $stmt->execute([$staff_id_input]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'] ?? '')) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid staff ID or password']);
            exit;
        }

        // Only staff flagged as admin may access the admin panel
        if (!$user['is_admin']) {
            http_response_code(403);
            echo json_encode(['error' => 'This account does not have admin access']);
            exit;
        }

        session_regenerate_id(true);
        $_SESSION['staff_id']   = $user['id'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name']  = $user['last_name'];
        $_SESSION['is_admin']   = (bool) $user['is_admin'];
        unset($_SESSION['customer_id']);

        echo json_encode([
            'success'    => true,
            'user_type'  => 'admin',
            'id'         => $user['id'],
            'first_name' => $user['first_name'],
            'last_name'  => $user['last_name'],
            'is_admin'   => (bool) $user['is_admin'],
        ]);
        exit;
    }

    // Customer login
    $stmt = $pdo->prepare(
        'SELECT id, first_name, last_name, email, password_hash
         FROM customers WHERE email = ?'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'] ?? '')) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['customer_id'] = $user['id'];
    $_SESSION['first_name']  = $user['first_name'];
    $_SESSION['last_name']   = $user['last_name'];
    $_SESSION['email']       = $user['email'];
    unset($_SESSION['staff_id']);

    echo json_encode([
        'success'    => true,
        'user_type'  => 'customer',
        'id'         => $user['id'],
        'first_name' => $user['first_name'],
        'last_name'  => $user['last_name'],
        'email'      => $user['email'],
    ]);
    exit;
}

// ── logout ────────────────────────────────────────────────────────────────────
if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    echo json_encode(['success' => true, 'logged_in' => false]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action']);
