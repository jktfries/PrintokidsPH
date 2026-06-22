<?php
header('Content-Type: application/json');
include '../includes/config.php';

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// POST - Subscribe to newsletter
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $location = $data['location'] ?? '';
    
    if (empty($name) || empty($email)) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and email are required']);
        exit;
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }
    
    // Check if email already subscribed
    $check_stmt = $conn->prepare("SELECT id FROM newsletter_subscribers WHERE email = ?");
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    
    if ($result->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['message' => 'Already subscribed', 'info' => 'You are already on our newsletter list']);
        $check_stmt->close();
        exit;
    }
    $check_stmt->close();
    
    // Insert newsletter subscriber
    $stmt = $conn->prepare("INSERT INTO newsletter_subscribers (name, email, location, subscribed_at) VALUES (?, ?, ?, NOW())");
    $stmt->bind_param("sss", $name, $email, $location);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Thank you for subscribing!',
            'info' => 'Check your email for exclusive offers from PrintoKids PH'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Subscription failed: ' . $stmt->error]);
    }
    $stmt->close();
}

// GET - Retrieve all newsletter subscribers (admin use only - should add authentication later)
else if ($method === 'GET') {
    // TODO: Add authentication check for admin access
    $query = "SELECT id, name, email, location, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT 100";
    $result = $conn->query($query);
    
    if ($result) {
        $subscribers = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode([
            'success' => true,
            'total' => count($subscribers),
            'subscribers' => $subscribers
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve subscribers: ' . $conn->error]);
    }
}

// DELETE - Unsubscribe from newsletter
else if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    
    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        exit;
    }
    
    $stmt = $conn->prepare("DELETE FROM newsletter_subscribers WHERE email = ?");
    $stmt->bind_param("s", $email);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'You have been unsubscribed from our newsletter'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Unsubscribe failed: ' . $stmt->error]);
    }
    $stmt->close();
}

else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>
