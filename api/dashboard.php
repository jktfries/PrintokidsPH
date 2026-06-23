<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$pdo = getPDO();


$totalRevenue = $pdo->query(
    'SELECT COALESCE(SUM(price_charged), 0) AS total FROM order_services'
)->fetch()['total'];

$activeOrders = $pdo->query(
    "SELECT COUNT(*) AS cnt FROM event_orders WHERE status NOT IN ('Completed','Cancelled')"
)->fetch()['cnt'];

$pendingBookings = $pdo->query(
    "SELECT COUNT(*) AS cnt FROM event_orders WHERE status = 'Pending'"
)->fetch()['cnt'];

$totalClients = $pdo->query(
    'SELECT COUNT(*) AS cnt FROM customers'
)->fetch()['cnt'];

echo json_encode([
    'total_revenue'   => (float) $totalRevenue,
    'active_orders'   => (int) $activeOrders,
    'pending_bookings'=> (int) $pendingBookings,
    'total_clients'   => (int) $totalClients,
]);
