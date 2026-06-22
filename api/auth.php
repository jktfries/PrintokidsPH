<?php
header('Content-Type: application/json');
include '../includes/config.php';

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// REGISTER - Create new customer account
if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $first_name = $data['first_name'] ?? '';
    $last_name = $data['last_name'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    $password = $data['password'] ?? '';
    $password_confirm = $data['password_confirm'] ?? '';
    
    // Validation
    if (empty($first_name) || empty($last_name) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'First name, last name, email, and password are required']);
        exit;
    }
    
    if ($password !== $password_confirm) {
        http_response_code(400);
        echo json_encode(['error' => 'Passwords do not match']);
        exit;
    }
    
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        exit;
    }
    
    // Check if email already exists
    $check_stmt = $conn->prepare("SELECT id FROM customers WHERE email = ?");
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    
    if ($result->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        $check_stmt->close();
        exit;
    }
    $check_stmt->close();
    
    // Hash password
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);
    
    // Insert new customer
    $stmt = $conn->prepare("INSERT INTO customers (first_name, last_name, email, phone, password) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $first_name, $last_name, $email, $phone, $hashed_password);
    
    if ($stmt->execute()) {
        // Log them in by returning customer data (without password)
        $customer_id = $stmt->insert_id;
        echo json_encode([
            'success' => true,
            'message' => 'Account created successfully',
            'customer' => [
                'id' => $customer_id,
                'first_name' => $first_name,
                'last_name' => $last_name,
                'email' => $email
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Registration failed: ' . $stmt->error]);
    }
    $stmt->close();
}

// LOGIN - Authenticate customer
else if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        exit;
    }
    
    // Get customer by email
    $stmt = $conn->prepare("SELECT id, first_name, last_name, email, password FROM customers WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        $stmt->close();
        exit;
    }
    
    $customer = $result->fetch_assoc();
    $stmt->close();
    
    // Verify password
    if (!password_verify($password, $customer['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit;
    }
    
    // Successful login - return customer data without password
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'customer' => [
            'id' => $customer['id'],
            'first_name' => $customer['first_name'],
            'last_name' => $customer['last_name'],
            'email' => $customer['email']
        ]
    ]);
}

// CHECK SESSION - Verify if customer is logged in
else if ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'check') {
    // Check if session exists (in this case, we'll check localStorage via JWT or session cookie)
    if (isset($_COOKIE['customer_token'])) {
        // TODO: Validate JWT token
        http_response_code(200);
        echo json_encode(['authenticated' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['authenticated' => false]);
    }
}

// LOGOUT
else if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    // Clear authentication cookie
    setcookie('customer_token', '', time() - 3600);
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>
