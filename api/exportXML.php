<?php
require_once '../includes/config.php';   //PDO config file

// Get table name from URL
$table = $_GET['table'] ?? null;

if (!$table) {
    die("No table specified.");
}

// Get PDO connection
$pdo = getPDO();

// Query MySQL using PDO
$stmt = $pdo->prepare("SELECT * FROM `$table`");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Don't generate XML if table is empty
if (empty($rows)) {
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'No data found in the table: ' . $table
    ]);
    exit;
}

// Create XML document
$dom = new DOMDocument('1.0', 'UTF-8');
$dom->formatOutput = true;

$rootTag = ucfirst($table) . "Data";   // ProductsData
$entryTag = rtrim(ucfirst($table), 's'); // Product

$root = $dom->createElement($rootTag);
$dom->appendChild($root);

// Build XML from rows
foreach ($rows as $row) {
    $entry = $dom->createElement($entryTag);

    foreach ($row as $key => $value) {
        // Clean tag names
        $safeKey = preg_replace('/[^a-zA-Z0-9_]/', '', $key);
        if (preg_match('/^[0-9]/', $safeKey)) {
            $safeKey = '_' . $safeKey;
        }

        $element = $dom->createElement($safeKey, htmlspecialchars($value));
        $entry->appendChild($element);
    }

    $root->appendChild($entry);
}

// Output XML to browser
header('Content-Type: text/xml');
echo $dom->saveXML();

