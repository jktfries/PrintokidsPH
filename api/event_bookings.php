<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

// GET - List event bookings
// Admin sees all; logged-in customer sees only their own
if ($method === 'GET') {
    $customerFilter = null;
    if (!empty($_SESSION['customer_id']) && empty($_SESSION['staff_id'])) {
        $customerFilter = (int) $_SESSION['customer_id'];
    } elseif (isset($_GET['customer_id']) && !empty($_SESSION['staff_id'])) {
        $customerFilter = (int) $_GET['customer_id'];
    }

    $baseSql = "
        SELECT
            eo.id                                                      AS booking_id,
            eo.id                                                      AS order_id,
            eo.event_name,
            eo.event_type,
            eo.event_date,
            eo.event_location,
            eo.status,
            eo.admin_notes,
            eo.cancellation_reason,
            c.first_name,
            c.last_name,
            c.email,
            c.phone,
            GROUP_CONCAT(DISTINCT s.service_name SEPARATOR ', ')       AS service_name,
            GROUP_CONCAT(DISTINCT a.asset_name   SEPARATOR ', ')       AS asset_name,
            MIN(os.start_time)                                         AS start_time,
            MAX(os.end_time)                                           AS end_time
        FROM event_orders eo
        INNER JOIN customers c       ON eo.customer_id = c.id
        LEFT  JOIN order_services os ON os.order_id    = eo.id
        LEFT  JOIN services s        ON os.service_id  = s.id
        LEFT  JOIN assets a          ON os.asset_id    = a.id
    ";
    $groupOrder = "
        GROUP BY eo.id, eo.event_name, eo.event_type, eo.event_date,
                 eo.event_location, eo.status, eo.admin_notes, eo.cancellation_reason,
                 c.first_name, c.last_name, c.email, c.phone
        ORDER BY eo.id DESC
        LIMIT 100
    ";
    if ($customerFilter) {
        $stmt = $pdo->prepare($baseSql . " WHERE eo.customer_id = ? " . $groupOrder);
        $stmt->execute([$customerFilter]);
    } else {
        $stmt = $pdo->query($baseSql . $groupOrder);
    }
    echo json_encode($stmt->fetchAll());
    exit;
}

// PUT - Update booking
elseif ($method === 'PUT') {
    $data     = json_decode(file_get_contents('php://input'), true);
    $order_id = (int) ($data['order_id'] ?? 0);
    $status   = trim($data['status'] ?? '');

    if ($order_id === 0 || $status === '') {
        http_response_code(400);
        echo json_encode(['error' => 'order_id and status are required']);
        exit;
    }

    // ── Customer path: can only cancel their own pending/confirmed booking ──
    if (!empty($_SESSION['customer_id']) && empty($_SESSION['staff_id'])) {
        $customerId = (int) $_SESSION['customer_id'];

        if ($status !== 'Cancelled') {
            http_response_code(403);
            echo json_encode(['error' => 'Customers may only cancel bookings']);
            exit;
        }

        // Verify ownership and current status
        $check = $pdo->prepare(
            'SELECT id, status FROM event_orders WHERE id = ? AND customer_id = ?'
        );
        $check->execute([$order_id, $customerId]);
        $booking = $check->fetch();

        if (!$booking) {
            http_response_code(404);
            echo json_encode(['error' => 'Booking not found']);
            exit;
        }

        if (!in_array($booking['status'], ['Pending', 'Confirmed'])) {
            http_response_code(409);
            echo json_encode(['error' => 'Only pending or confirmed bookings can be cancelled']);
            exit;
        }

        $reason = isset($data['cancellation_reason']) ? trim($data['cancellation_reason']) : null;

        $stmt = $pdo->prepare(
            'UPDATE event_orders SET status = ?, cancellation_reason = ? WHERE id = ? AND customer_id = ?'
        );
        $stmt->execute(['Cancelled', $reason, $order_id, $customerId]);

        echo json_encode(['success' => true]);
        exit;
    }

    // ── Admin path ──
    if (empty($_SESSION['staff_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }

    $allowed = ['Pending', 'Confirmed', 'In Production', 'Completed', 'Cancelled'];
    if (!in_array($status, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status value']);
        exit;
    }

    $notes = $data['admin_notes'] ?? null;

    $stmt = $pdo->prepare(
        'UPDATE event_orders SET status = ?, admin_notes = ? WHERE id = ?'
    );
    $stmt->execute([$status, $notes !== null ? trim($notes) : null, $order_id]);

    echo json_encode(['success' => true]);
    exit;
}

// DELETE - Remove event booking(s) (admin only)
elseif ($method === 'DELETE') {
    if (empty($_SESSION['staff_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!empty($data['ids']) && is_array($data['ids'])) {
        $ids = array_filter(array_map('intval', $data['ids']));
        if (empty($ids)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid IDs provided']);
            exit;
        }
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $pdo->prepare("DELETE FROM event_orders WHERE id IN ($placeholders)")->execute($ids);
    } else {
        $order_id = (int) ($data['order_id'] ?? $data['id'] ?? 0);
        if ($order_id === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'order_id is required']);
            exit;
        }
        $pdo->prepare('DELETE FROM event_orders WHERE id = ?')->execute([$order_id]);
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
