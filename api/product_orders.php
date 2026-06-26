<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];
$allowedStatuses = ['Pending', 'Confirmed', 'In Production', 'Completed'];

try {
    if ($method === 'GET' && !isset($_GET['id'])) {
        $stmt = $pdo->query(
            "SELECT po.id,
                    po.customer_id,
                    po.order_date,
                    po.status,
                    po.total_amount,
                    c.first_name,
                    c.last_name,
                    COALESCE(SUM(poi.quantity), 0) AS total_quantity,
                    GROUP_CONCAT(CONCAT(p.name, ' x', poi.quantity) SEPARATOR ', ') AS products_ordered
             FROM product_orders po
             JOIN customers c ON po.customer_id = c.id
             LEFT JOIN product_order_items poi ON po.id = poi.order_id
             LEFT JOIN products p ON poi.product_id = p.id
             GROUP BY po.id, po.customer_id, po.order_date, po.status,
                      po.total_amount, c.first_name, c.last_name
             ORDER BY po.order_date DESC
             LIMIT 100"
        );
        echo json_encode($stmt->fetchAll());

    } elseif ($method === 'GET' && isset($_GET['id'])) {
        $id   = (int) $_GET['id'];
        $stmt = $pdo->prepare(
            'SELECT po.id, po.customer_id, po.order_date, po.status, po.total_amount,
                    c.first_name, c.last_name
             FROM product_orders po
             JOIN customers c ON po.customer_id = c.id
             WHERE po.id = ?'
        );
        $stmt->execute([$id]);
        $order = $stmt->fetch();

        if (!$order) {
            http_response_code(404);
            echo json_encode(['error' => 'Product order not found']);
            exit;
        }

        $itemStmt = $pdo->prepare(
            'SELECT poi.id, poi.product_id, p.name, poi.quantity, poi.unit_price, poi.subtotal
             FROM product_order_items poi
             JOIN products p ON poi.product_id = p.id
             WHERE poi.order_id = ?'
        );
        $itemStmt->execute([$id]);
        $order['items'] = $itemStmt->fetchAll();

        echo json_encode($order);

    } elseif ($method === 'POST') {
        $data        = json_decode(file_get_contents('php://input'), true) ?? [];
        $customer_id = (int) ($data['customer_id'] ?? 0);
        $items       = $data['items'] ?? [];

        if ($customer_id === 0 || !is_array($items) || count($items) === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer and order items are required']);
            exit;
        }

        // Merge duplicate product lines into a single quantity.
        $cleanItems = [];
        foreach ($items as $item) {
            $productId = (int) ($item['product_id'] ?? 0);
            $quantity  = (int) ($item['quantity'] ?? 0);
            if ($productId > 0 && $quantity > 0) {
                $cleanItems[$productId] = ($cleanItems[$productId] ?? 0) + $quantity;
            }
        }

        if (count($cleanItems) === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid product items are required']);
            exit;
        }

        $pdo->beginTransaction();

        $customerStmt = $pdo->prepare('SELECT id FROM customers WHERE id = ?');
        $customerStmt->execute([$customer_id]);
        if (!$customerStmt->fetch()) {
            throw new Exception('Customer not found');
        }

        $productStmt = $pdo->prepare('SELECT id, name, base_cost FROM products WHERE id = ?');
        $productsForOrder = [];
        $totalAmount      = 0;

        foreach ($cleanItems as $productId => $quantity) {
            $productStmt->execute([$productId]);
            $product = $productStmt->fetch();
            if (!$product) {
                throw new Exception("Product ID {$productId} not found");
            }

            $unitPrice = (float) $product['base_cost'];
            $subtotal  = $unitPrice * $quantity;

            $productsForOrder[] = [
                'product_id' => $productId,
                'quantity'   => $quantity,
                'unit_price' => $unitPrice,
                'subtotal'   => $subtotal,
            ];
            $totalAmount += $subtotal;
        }

        $orderStmt = $pdo->prepare(
            "INSERT INTO product_orders (customer_id, status, total_amount)
             VALUES (?, 'Pending', ?)"
        );
        $orderStmt->execute([$customer_id, $totalAmount]);
        $orderId = (int) $pdo->lastInsertId();

        $itemStmt = $pdo->prepare(
            'INSERT INTO product_order_items (order_id, product_id, quantity, unit_price, subtotal)
             VALUES (?, ?, ?, ?, ?)'
        );
        foreach ($productsForOrder as $item) {
            $itemStmt->execute([
                $orderId,
                $item['product_id'],
                $item['quantity'],
                $item['unit_price'],
                $item['subtotal'],
            ]);
        }

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'id'      => $orderId,
            'message' => 'Product order created successfully',
        ]);

    } elseif ($method === 'PUT') {
        $data   = json_decode(file_get_contents('php://input'), true) ?? [];
        $id     = (int) ($data['id'] ?? 0);
        $status = trim($data['status'] ?? '');

        if ($id === 0 || !in_array($status, $allowedStatuses, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid order ID and status are required']);
            exit;
        }

        $stmt = $pdo->prepare('UPDATE product_orders SET status = ? WHERE id = ?');
        $stmt->execute([$status, $id]);
        echo json_encode(['success' => true]);

    } elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id   = (int) ($data['id'] ?? 0);

        if ($id === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Order ID is required']);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM product_orders WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
