<?php
// /logic/seed_db.php
// Uses config.php (PDO) — consistent with the rest of the app.
// NOTE: database/printokidsph_db.sql already has all seed data.
// Only use this to verify database connectivity.

require_once '../includes/config.php';

$pdo = getPDO();

echo "<pre>PrintokidsPH — DB Check\n========================\n\n";

$tables = ['customers', 'staff', 'products', 'product_orders', 'event_orders', 'newsletter_subscribers'];
foreach ($tables as $table) {
    $count = $pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
    echo "  {$table}: {$count} rows\n";
}

echo "\nConnection OK. If tables are empty, import database/printokidsph_db.sql via phpMyAdmin.\n</pre>";