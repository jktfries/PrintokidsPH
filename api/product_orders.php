<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo    = getPDO();
$method = $_SERVER['REQUEST_METHOD'];
$allowedStatuses = ['Pending', 'Confirmed', 'In Production', 'Completed', 'Cancelled'];

try {

    // GET all product orders — requires session (admin sees all, customer filtered by their own id)
    if ($method === 'GET' && !isset($_GET['id'])) {
        // Must be logged in as either admin or customer
        if (empty($_SESSION['staff_id']) && empty($_SESSION['customer_id'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Authentication required']);
            exit;
        }

        // If a customer is logged in (not admin), force filter to their own orders only
        if (!empty($_SESSION['customer_id']) && empty($_SESSION['staff_id'])) {
            $customer_id_filter = (int) $_SESSION['customer_id'];
        } else {
            $customer_id_filter = isset($_GET['customer_id']) ? (int) $_GET['customer_id'] : null;
        }

        $where = $customer_id_filter ? 'WHERE po.customer_id = ' . $customer_id_filter : '';
        $stmt = $pdo->query("
            SELECT
                po.id,
                po.customer_id,
                po.employee_id,
                po.shipping_address_id,
                po.order_date,
                po.status,
                po.total_amount,
                po.shipping_fee,
                po.payment_method,
                po.payment_status,
                po.proof_of_payment_url,
                po.tracking_number,
                c.first_name,
                c.last_name,
                s.first_name AS employee_first_name,
                s.last_name AS employee_last_name,
                COALESCE(SUM(poi.quantity), 0) AS total_quantity,
                GROUP_CONCAT(CONCAT(p.name, ' x', poi.quantity) SEPARATOR ', ') AS products_ordered
            FROM product_orders po
            INNER JOIN customers c ON po.customer_id = c.id
            LEFT JOIN staff s ON po.employee_id = s.id
            LEFT JOIN product_order_items poi ON po.id = poi.order_id
            LEFT JOIN products p ON poi.product_id = p.id
            $where
            GROUP BY po.id, po.customer_id, po.employee_id, po.shipping_address_id,
                     po.order_date, po.status, po.total_amount, po.shipping_fee,
                     po.payment_method, po.payment_status, po.proof_of_payment_url,
                     po.tracking_number, c.first_name, c.last_name, s.first_name, s.last_name
            ORDER BY po.order_date DESC
            LIMIT 100
        ");
        echo json_encode($stmt->fetchAll());
    }

    // GET single product order with items
    elseif ($method === 'GET' && isset($_GET['id'])) {
        $id = (int) $_GET['id'];

        $stmt = $pdo->prepare("
            SELECT po.id, po.customer_id, po.employee_id, po.shipping_address_id,
                   po.order_date, po.status, po.total_amount, po.shipping_fee,
                   po.payment_method, po.payment_status, po.proof_of_payment_url,
                   po.tracking_number,
                   c.first_name, c.last_name,
                   s.first_name AS employee_first_name,
                   s.last_name AS employee_last_name
            FROM product_orders po
            INNER JOIN customers c ON po.customer_id = c.id
            LEFT JOIN staff s ON po.employee_id = s.id
            WHERE po.id = ?
        ");
        $stmt->execute([$id]);
        $order = $stmt->fetch();

        if (!$order) {
            http_response_code(404);
            echo json_encode(['error' => 'Product order not found']);
            exit;
        }

        // Get items with customization data
        $itemStmt = $pdo->prepare("
            SELECT poi.id, poi.product_id, p.name,
                   poi.quantity, poi.unit_price, poi.subtotal,
                   poi.customization_notes, poi.media_upload_url
            FROM product_order_items poi
            INNER JOIN products p ON poi.product_id = p.id
            WHERE poi.order_id = ?
        ");
        $itemStmt->execute([$id]);
        $order['items'] = $itemStmt->fetchAll();

        // Get shipping address if set
        if ($order['shipping_address_id']) {
            $addrStmt = $pdo->prepare("
                SELECT address_label, street_address, city, province, postal_code
                FROM customer_addresses WHERE id = ?
            ");
            $addrStmt->execute([$order['shipping_address_id']]);
            $order['shipping_address'] = $addrStmt->fetch();
        }

        echo json_encode($order);
    }

    // POST - Create new product order with stock deduction
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        $customer_id         = (int) ($data['customer_id'] ?? 0);
        $employee_id         = !empty($data['employee_id']) ? (int) $data['employee_id'] : null;
        $shipping_address_id = !empty($data['shipping_address_id']) ? (int) $data['shipping_address_id'] : null;
        $items               = $data['items'] ?? [];

        $allowed_payment     = ['Cash on Delivery', 'QR Pay', 'Card'];
        $payment_method      = in_array($data['payment_method'] ?? '', $allowed_payment, true)
                               ? $data['payment_method']
                               : 'Cash on Delivery';
        $shipping_fee        = isset($data['shipping_fee']) ? round((float) $data['shipping_fee'], 2) : 0.00;
        $proof_url           = trim($data['proof_of_payment_url'] ?? '') ?: null;

        if ($customer_id === 0 || !is_array($items) || count($items) === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer and order items are required']);
            exit;
        }

        // Deduplicate and clean items
        $cleanItems = [];
        foreach ($items as $item) {
            $pid = (int) ($item['product_id'] ?? 0);
            $qty = (int) ($item['quantity'] ?? 0);
            if ($pid > 0 && $qty > 0) {
                // Keep customization data from the last entry for this product
                $cleanItems[$pid] = [
                    'quantity'            => ($cleanItems[$pid]['quantity'] ?? 0) + $qty,
                    'customization_notes' => trim($item['customization_notes'] ?? ($cleanItems[$pid]['customization_notes'] ?? '')),
                    'media_upload_url'    => trim($item['media_upload_url'] ?? ($cleanItems[$pid]['media_upload_url'] ?? '')),
                ];
            }
        }

        if (count($cleanItems) === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid product items are required']);
            exit;
        }

        $pdo->beginTransaction();

        // Verify customer exists
        $custCheck = $pdo->prepare("SELECT id FROM customers WHERE id = ?");
        $custCheck->execute([$customer_id]);
        if (!$custCheck->fetch()) {
            throw new Exception('Customer not found');
        }

        // Validate products and stock
        $productsForOrder = [];
        $totalAmount = 0;

        $prodStmt = $pdo->prepare("
            SELECT id, name, base_cost, stock_count, reorder_level
            FROM products WHERE id = ? AND is_active = 1 FOR UPDATE
        ");

        foreach ($cleanItems as $productId => $itemData) {
            $prodStmt->execute([$productId]);
            $product = $prodStmt->fetch();

            if (!$product) {
                throw new Exception("Product ID {$productId} not found or inactive");
            }
            if ((int) $product['stock_count'] < $itemData['quantity']) {
                throw new Exception($product['name'] . ' does not have enough stock');
            }

            $unitPrice = (float) $product['base_cost'];
            $subtotal  = $unitPrice * $itemData['quantity'];

            $productsForOrder[] = [
                'product_id'          => $productId,
                'quantity'            => $itemData['quantity'],
                'unit_price'          => $unitPrice,
                'subtotal'            => $subtotal,
                'customization_notes' => $itemData['customization_notes'] ?: null,
                'media_upload_url'    => $itemData['media_upload_url'] ?: null,
                'stock_count'         => (int) $product['stock_count'],
                'reorder_level'       => (int) $product['reorder_level'],
            ];

            $totalAmount += $subtotal;
        }

        // Insert order
        $orderStmt = $pdo->prepare("
            INSERT INTO product_orders
                (customer_id, employee_id, shipping_address_id, status,
                 total_amount, shipping_fee, payment_method, payment_status, proof_of_payment_url)
            VALUES (?, ?, ?, 'Pending', ?, ?, ?, 'Unpaid', ?)
        ");
        $orderStmt->execute([
            $customer_id, $employee_id, $shipping_address_id,
            $totalAmount, $shipping_fee, $payment_method, $proof_url
        ]);
        $orderId = (int) $pdo->lastInsertId();

        // Insert items + deduct stock
        $itemStmt = $pdo->prepare("
            INSERT INTO product_order_items
                (order_id, product_id, quantity, unit_price, subtotal, customization_notes, media_upload_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stockStmt = $pdo->prepare("
            UPDATE products SET stock_count = ?, stock_status = ? WHERE id = ?
        ");

        foreach ($productsForOrder as $item) {
            $itemStmt->execute([
                $orderId,
                $item['product_id'],
                $item['quantity'],
                $item['unit_price'],
                $item['subtotal'],
                $item['customization_notes'],
                $item['media_upload_url'],
            ]);

            $newStock = $item['stock_count'] - $item['quantity'];

            if ($newStock <= 0) {
                $newStatus = 'Out of Stock';
            } elseif ($newStock <= $item['reorder_level']) {
                $newStatus = 'Low Stock';
            } else {
                $newStatus = 'In Stock';
            }

            $stockStmt->execute([$newStock, $newStatus, $item['product_id']]);
        }

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'id'      => $orderId,
            'message' => 'Product order created successfully',
        ]);
    }

    // PUT - Update order status, assignment, tracking
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id   = (int) ($data['id'] ?? 0);

        if ($id === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Order ID is required']);
            exit;
        }

        $fields = [];
        $params = [];

        if (!empty($data['status'])) {
            if (in_array($data['status'], $allowedStatuses, true)) {
                $fields[] = 'status = ?';
                $params[] = $data['status'];
            }
        }
        if (array_key_exists('employee_id', $data)) {
            $fields[] = 'employee_id = ?';
            $params[] = !empty($data['employee_id']) ? (int) $data['employee_id'] : null;
        }
        if (array_key_exists('shipping_address_id', $data)) {
            $fields[] = 'shipping_address_id = ?';
            $params[] = !empty($data['shipping_address_id']) ? (int) $data['shipping_address_id'] : null;
        }
        if (array_key_exists('tracking_number', $data)) {
            $fields[] = 'tracking_number = ?';
            $params[] = trim($data['tracking_number']) ?: null;
        }
        $allowedPaymentStatuses = ['Unpaid', 'Paid', 'Verified'];
        if (!empty($data['payment_status']) && in_array($data['payment_status'], $allowedPaymentStatuses, true)) {
            $fields[] = 'payment_status = ?';
            $params[] = $data['payment_status'];
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }

        $params[] = $id;
        $stmt = $pdo->prepare('UPDATE product_orders SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($params);

        echo json_encode(['success' => true]);
    }

    // DELETE - Remove product order
    elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id   = (int) ($data['id'] ?? 0);

        if ($id === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Order ID is required']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM product_orders WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true]);
    }

    else {
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
