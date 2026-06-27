<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo = getPDO();

// Event service revenue
$eventRevenue = $pdo->query(
    'SELECT COALESCE(SUM(price_charged), 0) AS total FROM order_services'
)->fetch()['total'];

// Product order revenue
$productRevenue = $pdo->query(
    'SELECT COALESCE(SUM(total_amount), 0) AS total FROM product_orders'
)->fetch()['total'];

// Active event orders
$activeEventOrders = $pdo->query(
    "SELECT COUNT(*) AS cnt FROM event_orders WHERE status NOT IN ('Completed','Cancelled')"
)->fetch()['cnt'];

// Active product orders
$activeProductOrders = $pdo->query(
    "SELECT COUNT(*) AS cnt FROM product_orders WHERE status NOT IN ('Completed','Cancelled')"
)->fetch()['cnt'];

// Pending event bookings
$pendingBookings = $pdo->query(
    "SELECT COUNT(*) AS cnt FROM event_orders WHERE status = 'Pending'"
)->fetch()['cnt'];

// Total clients
$totalClients = $pdo->query(
    'SELECT COUNT(*) AS cnt FROM customers'
)->fetch()['cnt'];

// Low stock products
$lowStockProducts = $pdo->query(
    "SELECT COUNT(*) AS cnt FROM products WHERE stock_status IN ('Low Stock', 'Out of Stock') AND is_active = 1"
)->fetch()['cnt'];

// Total active products
$totalProducts = $pdo->query(
    'SELECT COUNT(*) AS cnt FROM products WHERE is_active = 1'
)->fetch()['cnt'];

echo json_encode([
    'total_revenue'        => (float) $eventRevenue + (float) $productRevenue,
    'event_revenue'        => (float) $eventRevenue,
    'product_revenue'      => (float) $productRevenue,
    'active_orders'        => (int) $activeEventOrders + (int) $activeProductOrders,
    'active_event_orders'  => (int) $activeEventOrders,
    'active_product_orders'=> (int) $activeProductOrders,
    'pending_bookings'     => (int) $pendingBookings,
    'total_clients'        => (int) $totalClients,
    'low_stock_products'   => (int) $lowStockProducts,
    'total_products'       => (int) $totalProducts,
]);
