<?php
require_once '../includes/config.php';

$table = $_GET['table'] ?? null;
if (!$table) die("No table specified.");

$pdo = getPDO();

// Fetch table data
$stmt = $pdo->prepare("SELECT * FROM `$table`");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($rows)) {
    die("<h3>No data found in the table: $table</h3>");
}

// Build XML
$dom = new DOMDocument('1.0', 'UTF-8');
$dom->formatOutput = true;

$root = $dom->createElement(ucfirst($table) . "Data");
$dom->appendChild($root);

foreach ($rows as $row) {
    $entry = $dom->createElement(rtrim(ucfirst($table), 's'));

    foreach ($row as $key => $value) {
        $safeKey = preg_replace('/[^a-zA-Z0-9_]/', '', $key);
        if (preg_match('/^[0-9]/', $safeKey)) {
            $safeKey = '_' . $safeKey;
        }
        $entry->appendChild($dom->createElement($safeKey, htmlspecialchars($value)));
    }

    $root->appendChild($entry);
}

// Load generic XSL
$xsl = new DOMDocument();
$xsl->load('../xslt/xml_html.xsl');

$proc = new XSLTProcessor();
$proc->importStylesheet($xsl);

header("Content-Type: text/html");
echo $proc->transformToXML($dom);


