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

$root = $dom->createElement("Orders");
$dom->appendChild($root);

foreach ($rows as $row) {
    $order = $dom->createElement("Order");

    // OrderInfo group
    $orderInfo = $dom->createElement("OrderInfo");
    $orderInfo->appendChild($dom->createElement("ID", $row["id"]));
    $orderInfo->appendChild($dom->createElement("CustomerID", $row["customer_id"]));
    $orderInfo->appendChild($dom->createElement("EmployeeID", $row["employee_id"]));
    $orderInfo->appendChild($dom->createElement("ShippingAddressID", $row["shipping_address_id"]));
    $orderInfo->appendChild($dom->createElement("OrderDate", $row["order_date"]));
    $orderInfo->appendChild($dom->createElement("Status", $row["status"]));
    $order->appendChild($orderInfo);

    // PaymentInfo group
    $paymentInfo = $dom->createElement("PaymentInfo");
    $paymentInfo->appendChild($dom->createElement("TotalAmount", $row["total_amount"]));
    $paymentInfo->appendChild($dom->createElement("PaymentMethod", $row["payment_method"]));
    $paymentInfo->appendChild($dom->createElement("PaymentStatus", $row["payment_status"]));
    $paymentInfo->appendChild($dom->createElement("ProofOfPaymentURL", $row["proof_of_payment_url"]));
    $order->appendChild($paymentInfo);

    $root->appendChild($order);
}

// Load XSL
$xsl = new DOMDocument();
$xsl->load("../xslt/ordersXSLT.xsl");

$proc = new XSLTProcessor();
$proc->importStylesheet($xsl);

$transformedXml = $proc->transformToXML($dom);

// Validate
$finalDom = new DOMDocument();
$finalDom->loadXML($transformedXml);
$finalDom->schemaValidate('../xslt/orders.xsd');

header("Content-Type: text/xml");
echo $transformedXml;
