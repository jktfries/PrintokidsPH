<?php
// /logic/seed_db.php

$host = "localhost";
$username = "root";
$password = "";
$database = "printokidsph_db";
// $port = 3307; // Your custom port

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "Starting Database Seed...<br><br>";

// Array Banks for Randomization
$first_names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Chris', 'Mia', 'Josh', 'Chloe', 'Mark', 'Bea'];
$last_names = ['Smith', 'Cruz', 'Santos', 'Reyes', 'Bautista', 'Garcia', 'Torres', 'Mendoza', 'Flores', 'Villanueva'];
$cities = ['Makati', 'Taguig', 'Manila', 'Quezon City', 'Pasig', 'Mandaluyong', 'Alabang'];
$product_adjs = ['Premium', 'Classic', 'Custom', 'Eco-friendly', 'Pro', 'Basic'];
$product_nouns = ['Mug', 'T-Shirt', 'Tote Bag', 'Lanyard', 'Tumbler', 'Cap', 'Jacket'];

// Clear existing data to prevent duplicate errors
$conn->query("SET FOREIGN_KEY_CHECKS = 0");
$tables = ['customers', 'customer_addresses', 'products', 'products_attributes', 'product_images', 'staff', 'roles', 'staff_roles', 'event_orders', 'services', 'assets', 'order_services', 'event_staff_assignments'];
foreach($tables as $table) { $conn->query("TRUNCATE TABLE $table"); }
$conn->query("SET FOREIGN_KEY_CHECKS = 1");

// GENERATE 50 CUSTOMERS & ADDRESSES
for ($i = 1; $i <= 50; $i++) {
    $fn = $first_names[array_rand($first_names)];
    $ln = $last_names[array_rand($last_names)];
    $email = strtolower($fn) . "." . strtolower($ln) . $i . "@example.com";
    $phone = "09" . rand(100000000, 999999999);
    
    $conn->query("INSERT INTO customers (id, first_name, last_name, email, phone) VALUES ($i, '$fn', '$ln', '$email', '$phone')");
    
    $city = $cities[array_rand($cities)];
    $conn->query("INSERT INTO customer_addresses (customer_id, address_label, street_address, city, province, postal_code, is_default) VALUES ($i, 'Home', 'Block $i Lot $i Main St', '$city', 'Metro Manila', '1000', 1)");
}
echo "✅ 50 Customers & Addresses generated.<br>";

// GENERATE 50 PRODUCTS
for ($i = 1; $i <= 50; $i++) {
    $name = $product_adjs[array_rand($product_adjs)] . " " . $product_nouns[array_rand($product_nouns)];
    $cost = rand(100, 1500) . ".00";
    $conn->query("INSERT INTO products (id, name, category, base_cost) VALUES ($i, '$name', 'General', $cost)");
    $conn->query("INSERT INTO products_attributes (product_id, attribute_name, attribute_value) VALUES ($i, 'Size', 'Standard')");
}
echo "✅ 50 Products generated.<br>";

// GENERATE 50 STAFF MEMBERS
for ($i = 1; $i <= 50; $i++) {
    $fn = $first_names[array_rand($first_names)];
    $ln = $last_names[array_rand($last_names)];
    $phone = "09" . rand(100000000, 999999999);
    $status = ($i % 5 == 0) ? 'On Leave' : 'Active'; // Every 5th staff is on leave
    $conn->query("INSERT INTO staff (id, first_name, last_name, contact_number, status) VALUES ($i, '$fn', '$ln', '$phone', '$status')");
}
echo "✅ 50 Staff Members generated.<br>";

// GENERATE REALISTIC LOOKUP DATA (Roles, Services, Assets)
$conn->query("INSERT INTO roles (id, title, standard_rate) VALUES (1, 'Event Coordinator', 1000), (2, 'Booth Operator', 600), (3, 'Graphic Artist', 800)");
$conn->query("INSERT INTO services (id, service_name, description) VALUES (1, 'Pick and Press Booth', 'Live printing'), (2, 'Bulk Delivery', 'Pre-printed')");
$conn->query("INSERT INTO assets (id, asset_name, asset_type) VALUES (1, 'Heat Press A', 'Machinery'), (2, 'Epson Printer', 'Printer')");

// Assign random roles to the 50 staff members
for ($i = 1; $i <= 50; $i++) {
    $role_id = rand(1, 3);
    $conn->query("INSERT INTO staff_roles (staff_id, role_id) VALUES ($i, $role_id)");
}

// GENERATE 50 EVENT ORDERS & ASSIGNMENTS
for ($i = 1; $i <= 50; $i++) {
    $cust_id = rand(1, 50); // Pick a random customer
    $status = ($i % 3 == 0) ? 'Pending' : 'Confirmed';
    $loc = $cities[array_rand($cities)] . " Convention Center";
    
    $conn->query("INSERT INTO event_orders (id, customer_id, event_location, status) VALUES ($i, $cust_id, '$loc', '$status')");
    
    // Assign a random service to the order
    $conn->query("INSERT INTO order_services (order_id, service_id, asset_id, start_time, end_time, price_charged) VALUES ($i, 1, 1, '2026-08-01 08:00', '2026-08-01 17:00', 8000.00)");
    
    // Assign 2 random staff members to work this event
    $staff1 = rand(1, 25);
    $staff2 = rand(26, 50);
    $conn->query("INSERT INTO event_staff_assignments (order_id, staff_id, role_id) VALUES ($i, $staff1, 1), ($i, $staff2, 2)");
}
echo "✅ 50 Event Orders & Staff Assignments generated.<br><br>";

echo "Database successfully seeded! Check phpMyAdmin.";

$conn->close();
?>