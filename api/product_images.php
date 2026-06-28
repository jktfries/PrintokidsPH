<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET — public; all media for a product ──────────────────
if ($method === 'GET') {
    $product_id = (int) ($_GET['product_id'] ?? 0);
    if ($product_id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'product_id is required']);
        exit;
    }
    $stmt = $pdo->prepare(
        'SELECT id, product_id, image_url, media_type, is_primary, sort_order
         FROM product_images
         WHERE product_id = ?
         ORDER BY sort_order ASC, id ASC'
    );
    $stmt->execute([$product_id]);
    echo json_encode($stmt->fetchAll());
    exit;
}

// All write operations require admin session
if (empty($_SESSION['staff_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Admin access required']);
    exit;
}

// ── POST — add a new image/video to a product ──────────────
if ($method === 'POST') {
    $data       = json_decode(file_get_contents('php://input'), true) ?? [];
    $product_id = (int) ($data['product_id'] ?? 0);
    $image_url  = trim($data['image_url'] ?? '');
    $media_type = in_array($data['media_type'] ?? '', ['image', 'video'], true)
                  ? $data['media_type'] : 'image';
    $is_primary = isset($data['is_primary']) ? (int) $data['is_primary'] : 0;
    $sort_order = isset($data['sort_order']) ? (int) $data['sort_order'] : 0;

    if ($product_id === 0 || $image_url === '') {
        http_response_code(400);
        echo json_encode(['error' => 'product_id and image_url are required']);
        exit;
    }

    // Enforce 15-image limit
    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM product_images WHERE product_id = ?');
    $countStmt->execute([$product_id]);
    if ((int) $countStmt->fetchColumn() >= 15) {
        http_response_code(400);
        echo json_encode(['error' => 'Maximum of 15 media items per product']);
        exit;
    }

    // If this is being set as primary, clear existing primary
    if ($is_primary) {
        $pdo->prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?')
            ->execute([$product_id]);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO product_images (product_id, image_url, media_type, is_primary, sort_order)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$product_id, $image_url, $media_type, $is_primary, $sort_order]);

    echo json_encode(['success' => true, 'id' => (int) $pdo->lastInsertId()]);
    exit;
}

// ── PUT — update is_primary or sort_order ──────────────────
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'id is required']);
        exit;
    }

    // Fetch product_id for ownership scope
    $rowStmt = $pdo->prepare('SELECT product_id FROM product_images WHERE id = ?');
    $rowStmt->execute([$id]);
    $row = $rowStmt->fetch();
    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Image not found']);
        exit;
    }
    $product_id = (int) $row['product_id'];

    if (isset($data['is_primary']) && (int) $data['is_primary'] === 1) {
        // Clear existing primary for this product, then set new one
        $pdo->prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?')
            ->execute([$product_id]);
        $pdo->prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?')
            ->execute([$id]);
    }
    if (isset($data['sort_order'])) {
        $pdo->prepare('UPDATE product_images SET sort_order = ? WHERE id = ?')
            ->execute([(int) $data['sort_order'], $id]);
    }

    echo json_encode(['success' => true]);
    exit;
}

// ── DELETE — remove a media item ───────────────────────────
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int) ($data['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'id is required']);
        exit;
    }

    // Fetch row before deleting to check if it was primary
    $rowStmt = $pdo->prepare('SELECT product_id, is_primary FROM product_images WHERE id = ?');
    $rowStmt->execute([$id]);
    $row = $rowStmt->fetch();
    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Image not found']);
        exit;
    }
    $product_id = (int) $row['product_id'];
    $was_primary = (int) $row['is_primary'];

    $pdo->prepare('DELETE FROM product_images WHERE id = ?')->execute([$id]);

    // If deleted image was primary, promote the next one by sort_order
    if ($was_primary) {
        $next = $pdo->prepare(
            'SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1'
        );
        $next->execute([$product_id]);
        $nextRow = $next->fetch();
        if ($nextRow) {
            $pdo->prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?')
                ->execute([$nextRow['id']]);
        }
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
