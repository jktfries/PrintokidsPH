<?php
header('Content-Type: application/json');
include '../includes/config.php';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$method = $_SERVER['REQUEST_METHOD'];
$allowedStatuses = ['Pending', 'Confirmed', 'In Production', 'Completed'];

try {
    if ($method === 'GET' && !isset($_GET['id'])) {
        $query = "
            SELECT 
                po.id,
                po.customer_id,
                po.order_date,
                po.status,
                po.total_amount,
                c.first_name,
                c.last_name,
                COALESCE(SUM(poi.quantity), 0) AS total_quantity,
                GROUP_CONCAT(CONCAT(p.name, ' x', poi.quantity) SEPARATOR ', ') AS products_ordered
            FROM product_orders po
            INNER JOIN customers c ON po.customer_id = c.id
            LEFT JOIN product_order_items poi ON po.id = poi.order_id
            LEFT JOIN products p ON poi.product_id = p.id
            GROUP BY 
                po.id,
                po.customer_id,
                po.order_date,
                po.status,
                po.total_amount,
                c.first_name,
                c.last_name
            ORDER BY po.order_date DESC
            LIMIT 100
        ";

        $result = $conn->query($query);
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    else if ($method === 'GET' && isset($_GET['id'])) {
        $id = intval($_GET['id']);

        $stmt = $conn->prepare("
            SELECT 
                po.id,
                po.customer_id,
                po.order_date,
                po.status,
                po.total_amount,
                c.first_name,
                c.last_name
            FROM product_orders po
            INNER JOIN customers c ON po.customer_id = c.id
            WHERE po.id = ?
        ");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $orderResult = $stmt->get_result();

        if ($orderResult->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Product order not found']);
            exit;
        }

        $order = $orderResult->fetch_assoc();
        $stmt->close();

        $itemStmt = $conn->prepare("
            SELECT 
                poi.id,
                poi.product_id,
                p.name,
                poi.quantity,
                poi.unit_price,
                poi.subtotal
            FROM product_order_items poi
            INNER JOIN products p ON poi.product_id = p.id
            WHERE poi.order_id = ?
        ");
        $itemStmt->bind_param("i", $id);
        $itemStmt->execute();
        $itemsResult = $itemStmt->get_result();

        $order['items'] = $itemsResult->fetch_all(MYSQLI_ASSOC);

        echo json_encode($order);
    }

    else if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        $customer_id = intval($data['customer_id'] ?? 0);
        $items = $data['items'] ?? [];

        if ($customer_id === 0 || !is_array($items) || count($items) === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer and order items are required']);
            exit;
        }

        $cleanItems = [];

        foreach ($items as $item) {
            $productId = intval($item['product_id'] ?? 0);
            $quantity = intval($item['quantity'] ?? 0);

            if ($productId > 0 && $quantity > 0) {
                if (!isset($cleanItems[$productId])) {
                    $cleanItems[$productId] = 0;
                }

                $cleanItems[$productId] += $quantity;
            }
        }

        if (count($cleanItems) === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid product items are required']);
            exit;
        }

        $conn->begin_transaction();

        $customerStmt = $conn->prepare("SELECT id FROM customers WHERE id = ?");
        $customerStmt->bind_param("i", $customer_id);
        $customerStmt->execute();
        $customerResult = $customerStmt->get_result();

        if ($customerResult->num_rows === 0) {
            throw new Exception('Customer not found');
        }

        $customerStmt->close();

        $productsForOrder = [];
        $totalAmount = 0;

        $productStmt = $conn->prepare("
            SELECT id, name, base_cost, stock_count, reorder_level
            FROM products
            WHERE id = ?
            FOR UPDATE
        ");

        foreach ($cleanItems as $productId => $quantity) {
            $productStmt->bind_param("i", $productId);
            $productStmt->execute();
            $productResult = $productStmt->get_result();

            if ($productResult->num_rows === 0) {
                throw new Exception("Product ID {$productId} not found");
            }

            $product = $productResult->fetch_assoc();

            if (intval($product['stock_count']) < $quantity) {
                throw new Exception($product['name'] . ' does not have enough stock');
            }

            $unitPrice = floatval($product['base_cost']);
            $subtotal = $unitPrice * $quantity;

            $productsForOrder[] = [
                'product_id' => $productId,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal,
                'stock_count' => intval($product['stock_count']),
                'reorder_level' => intval($product['reorder_level'])
            ];

            $totalAmount += $subtotal;
        }

        $productStmt->close();

        $orderStmt = $conn->prepare("
            INSERT INTO product_orders (customer_id, status, total_amount)
            VALUES (?, 'Pending', ?)
        ");
        $orderStmt->bind_param("id", $customer_id, $totalAmount);
        $orderStmt->execute();

        $orderId = $orderStmt->insert_id;
        $orderStmt->close();

        $itemStmt = $conn->prepare("
            INSERT INTO product_order_items 
                (order_id, product_id, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, ?, ?)
        ");

        $stockStmt = $conn->prepare("
            UPDATE products
            SET 
                stock_count = ?,
                stock_status = ?
            WHERE id = ?
        ");

        foreach ($productsForOrder as $item) {
            $itemStmt->bind_param(
                "iiidd",
                $orderId,
                $item['product_id'],
                $item['quantity'],
                $item['unit_price'],
                $item['subtotal']
            );
            $itemStmt->execute();

            $newStock = $item['stock_count'] - $item['quantity'];

            if ($newStock <= 0) {
                $newStockStatus = 'Out of Stock';
            } else if ($newStock <= $item['reorder_level']) {
                $newStockStatus = 'Low Stock';
            } else {
                $newStockStatus = 'In Stock';
            }

            $stockStmt->bind_param(
                "isi",
                $newStock,
                $newStockStatus,
                $item['product_id']
            );
            $stockStmt->execute();
        }

        $itemStmt->close();
        $stockStmt->close();

        $conn->commit();

        echo json_encode([
            'success' => true,
            'id' => $orderId,
            'message' => 'Product order created successfully'
        ]);
    }

    else if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);

        $id = intval($data['id'] ?? 0);
        $status = trim($data['status'] ?? '');

        if ($id === 0 || !in_array($status, $allowedStatuses)) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid order ID and status are required']);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE product_orders
            SET status = ?
            WHERE id = ?
        ");
        $stmt->bind_param("si", $status, $id);
        $stmt->execute();

        echo json_encode(['success' => true]);
    }

    else if ($method === 'DELETE') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = intval($data['id'] ?? 0);

        if ($id === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Order ID is required']);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM product_orders WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        echo json_encode(['success' => true]);
    }

    else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

catch (Exception $e) {
    try {
        $conn->rollback();
    } catch (Exception $rollbackError) {
        // ignore rollback error
    }

    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>
