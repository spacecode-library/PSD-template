<?php
// Simple proxy to serve PSD files with proper headers
// This would be replaced with a proper backend service in production

$psdFile = $_GET['file'] ?? '';
$allowedFiles = ['5248770.psd', '8039429.psd', '39690114_8731898.psd'];

if (!in_array(basename($psdFile), $allowedFiles)) {
    http_response_code(404);
    die('File not found');
}

$filePath = __DIR__ . '/PSD-files/' . basename($psdFile);

if (!file_exists($filePath)) {
    http_response_code(404);
    die('File not found');
}

header('Content-Type: application/octet-stream');
header('Content-Length: ' . filesize($filePath));
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=3600');

readfile($filePath);
?>