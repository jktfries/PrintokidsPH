<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

// ── Session guard — must be logged-in customer or admin staff ──
if (empty($_SESSION['customer_id']) && empty($_SESSION['staff_id'])) {
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
$imageMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
$imageExts  = ['jpg', 'jpeg', 'png', 'webp'];
$videoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
$videoExts  = ['mp4', 'webm', 'mov'];

$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $_FILES['file']['tmp_name']);
finfo_close($finfo);

$ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));

$isImage = in_array($mimeType, $imageMimes, true) && in_array($ext, $imageExts, true);
$isVideo = in_array($mimeType, $videoMimes, true) && in_array($ext, $videoExts, true);

if (!$isImage && !$isVideo) {
    http_response_code(400);
    echo json_encode(['error' => 'Only jpg, png, webp images or mp4, webm, mov videos are allowed.']);
    exit;
}

$mediaType = $isImage ? 'image' : 'video';

// ── Validate file size (5 MB for images, 50 MB for videos) ─
$maxBytes = $isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
if ($_FILES['file']['size'] > $maxBytes) {
    $limit = $isVideo ? '50MB' : '5MB';
    http_response_code(400);
    echo json_encode(['error' => "File size must be {$limit} or less."]);
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
    'success'    => true,
    'url'        => $fileUrl,
    'filename'   => $filename,
    'media_type' => $mediaType,
]);
