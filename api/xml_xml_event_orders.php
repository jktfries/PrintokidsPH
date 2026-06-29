<?php
require_once '../includes/config.php';

$table = $_GET['table'] ?? null;
if (!$table) die("No table specified.");

$pdo = getPDO();
$stmt = $pdo->prepare("SELECT * FROM `$table`");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$dom = new DOMDocument('1.0', 'UTF-8');
$dom->formatOutput = true;

$root = $dom->createElement("EventOrders");
$dom->appendChild($root);

foreach ($rows as $row) {
    $eventOrder = $dom->createElement("EventOrder");

    // OrderInfo
    $orderInfo = $dom->createElement("OrderInfo");
    $orderInfo->appendChild($dom->createElement("ID", $row["id"]));
    $orderInfo->appendChild($dom->createElement("CustomerID", $row["customer_id"]));
    $orderInfo->appendChild($dom->createElement("OrderDate", $row["order_date"]));
    $orderInfo->appendChild($dom->createElement("Status", $row["status"]));
    $eventOrder->appendChild($orderInfo);

    // EventInfo
    $eventInfo = $dom->createElement("EventInfo");
    $eventInfo->appendChild($dom->createElement("EventName", $row["event_name"]));
    $eventInfo->appendChild($dom->createElement("EventDate", $row["event_date"]));
    $eventInfo->appendChild($dom->createElement("EventType", $row["event_type"]));
    $eventInfo->appendChild($dom->createElement("EventLocation", $row["event_location"]));
    $eventOrder->appendChild($eventInfo);

    // AdminInfo
    $adminInfo = $dom->createElement("AdminInfo");
    $adminInfo->appendChild($dom->createElement("AdminNotes", $row["admin_notes"]));
    $adminInfo->appendChild($dom->createElement("CancellationReason", $row["cancellation_reason"]));
    $eventOrder->appendChild($adminInfo);

    $root->appendChild($eventOrder);
}

// Load XSL
$xsl = new DOMDocument();
$xsl->load(__DIR__ . '/../xslt/eventOrdersXSLT.xsl');

$proc = new XSLTProcessor();
$proc->importStylesheet($xsl);

$transformedXml = $proc->transformToXML($dom);

// Validate
$finalDom = new DOMDocument();
$finalDom->loadXML($transformedXml);
$finalDom->schemaValidate(__DIR__ . '/../xslt/eventOrders.xsd');

header("Content-Type: text/xml");
echo $transformedXml;

