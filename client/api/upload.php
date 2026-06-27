<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

// ── Session guard — must be logged-in customer ──────────────
session_start();
if (empty($_SESSION['user_type']) || $_SESSION['user_type'] !== 'customer') {
    http_response_code(401);
    echo json_encode(['error' => 'You must be signed in to upload files.']);
    exit;
}

// ── Validate file present ───────────────────────────────────
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errCodes = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit.',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form size limit.',
        UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder.',
        UPLOAD_ERR_CANT_WRITE => 'Could not write file to disk.',
        UPLOAD_ERR_EXTENSION  => 'Upload blocked by server extension.',
    ];
    $code = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
    http_response_code(400);
    echo json_encode(['error' => $errCodes[$code] ?? 'Upload error.']);
    exit;
}

// ── Validate file type ──────────────────────────────────────
$allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
$allowedExts  = ['jpg', 'jpeg', 'png'];

$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $_FILES['file']['tmp_name']);
finfo_close($finfo);

$ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));

if (!in_array($mimeType, $allowedMimes) || !in_array($ext, $allowedExts)) {
    http_response_code(400);
    echo json_encode(['error' => 'Only .jpg and .png images are allowed.']);
    exit;
}

// ── Validate file size (max 5MB) ────────────────────────────
$maxBytes = 5 * 1024 * 1024;
if ($_FILES['file']['size'] > $maxBytes) {
    http_response_code(400);
    echo json_encode(['error' => 'File size must be 5MB or less.']);
    exit;
}

// ── Create uploads directory if needed ─────────────────────
// Stored one level above api/ at /uploads/  (i.e. your project root/uploads/)
$uploadDir = dirname(__DIR__) . '/uploads/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not create uploads directory.']);
        exit;
    }
}

// ── Generate unique filename ────────────────────────────────
$filename  = uniqid('media_', true) . '.' . $ext;
$destPath  = $uploadDir . $filename;

// ── Move file ───────────────────────────────────────────────
if (!move_uploaded_file($_FILES['file']['tmp_name'], $destPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save the uploaded file.']);
    exit;
}

// ── Return the public-facing URL ────────────────────────────
// Adjust this base URL to match your XAMPP server path if needed
$protocol  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host      = $_SERVER['HTTP_HOST'];
$scriptDir = dirname(dirname($_SERVER['SCRIPT_NAME'])); // go up from /api/
$baseUrl   = $protocol . '://' . $host . rtrim($scriptDir, '/');
$fileUrl   = $baseUrl . '/uploads/' . $filename;

echo json_encode([
    'success'  => true,
    'url'      => $fileUrl,
    'filename' => $filename,
]);
