<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data     = json_decode(file_get_contents('php://input'), true) ?? [];
    $name     = trim($data['name'] ?? '');
    $email    = trim($data['email'] ?? '');
    $location = trim($data['location'] ?? '');

    if ($name === '' || $email === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Name and email are required']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }

    $check = $pdo->prepare('SELECT id FROM newsletter_subscribers WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(['message' => 'Already subscribed', 'info' => 'You are already on our newsletter list']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO newsletter_subscribers (name, email, location, subscribed_at)
         VALUES (?, ?, ?, NOW())'
    );
    $stmt->execute([$name, $email, $location ?: null]);
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for subscribing!',
        'info'    => 'Check your email for exclusive offers from PrintoKids PH',
    ]);

} elseif ($method === 'GET') {
    // TODO: Add authentication check for admin access
    $stmt = $pdo->query(
        'SELECT id, name, email, location, subscribed_at
         FROM newsletter_subscribers
         ORDER BY subscribed_at DESC
         LIMIT 100'
    );
    $subscribers = $stmt->fetchAll();
    echo json_encode([
        'success'     => true,
        'total'       => count($subscribers),
        'subscribers' => $subscribers,
    ]);

} elseif ($method === 'DELETE') {
    $data  = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = trim($data['email'] ?? '');

    if ($email === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM newsletter_subscribers WHERE email = ?');
    $stmt->execute([$email]);
    echo json_encode([
        'success' => true,
        'message' => 'You have been unsubscribed from our newsletter',
    ]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
