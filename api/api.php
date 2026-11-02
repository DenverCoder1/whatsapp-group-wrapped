<?php

/**
 * WhatsApp Group Wrapped API
 * Handles file upload and processing
 */

header('Content-Type: application/json');

// Handle download requests
if (isset($_GET['download'])) {
    $filename = basename($_GET['download']);
    $filepath = '/tmp/output/' . $filename;

    if (file_exists($filepath)) {
        // Determine content type based on file extension
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $contentType = $extension === 'json' ? 'application/json' : 'text/plain';
        
        header('Content-Type: ' . $contentType);
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($filepath));
        readfile($filepath);
        
        // Note: Files are kept in /tmp which Vercel cleans up automatically
        // For local development, you may want to uncomment the line below:
        // unlink($filepath);
        exit;
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'File not found']);
        exit;
    }
}

// Only allow POST requests for processing
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Check if file upload failed due to size limits before anything else
if (!isset($_FILES['chatFile']) || ($_FILES['chatFile']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
    // Check if POST data was received but file wasn't - indicates size limit exceeded
    if ($_SERVER['CONTENT_LENGTH'] > 0 && empty($_FILES)) {
        $sizeInMB = round($_SERVER['CONTENT_LENGTH'] / 1048576, 2);
        $limitInMB = round(min(
            intval(str_replace('M', '', ini_get('post_max_size'))),
            intval(str_replace('M', '', ini_get('upload_max_filesize')))
        ));
        echo json_encode([
            'success' => false,
            'error' => "File size ({$sizeInMB}MB) exceeds the server limit ({$limitInMB}MB). Note: Vercel Hobby plan has a 4.5MB limit. Consider using Vercel Pro or processing locally for larger files."
        ]);
        exit;
    }
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit;
}

if ($_FILES['chatFile']['error'] !== UPLOAD_ERR_OK) {
    $errorMessage = 'File upload failed';
    switch ($_FILES['chatFile']['error']) {
        case UPLOAD_ERR_INI_SIZE:
            $errorMessage = 'File is too large (exceeds upload_max_filesize in php.ini). Current limit: ' . ini_get('upload_max_filesize');
            break;
        case UPLOAD_ERR_FORM_SIZE:
            $errorMessage = 'File is too large (exceeds MAX_FILE_SIZE in form)';
            break;
        case UPLOAD_ERR_PARTIAL:
            $errorMessage = 'File was only partially uploaded';
            break;
        case UPLOAD_ERR_NO_FILE:
            $errorMessage = 'No file was uploaded';
            break;
        case UPLOAD_ERR_NO_TMP_DIR:
            $errorMessage = 'Missing temporary folder';
            break;
        case UPLOAD_ERR_CANT_WRITE:
            $errorMessage = 'Failed to write file to disk';
            break;
        case UPLOAD_ERR_EXTENSION:
            $errorMessage = 'File upload stopped by extension';
            break;
        default:
            $errorMessage = 'Unknown upload error';
            break;
    }
    echo json_encode(['success' => false, 'error' => $errorMessage]);
    exit;
}

// Get form parameters
$startDate = $_POST['startDate'] ?? '2025-01-01';
$endDate = $_POST['endDate'] ?? '2025-12-31';
$topCount = intval($_POST['topCount'] ?? 25);
$language = $_POST['language'] ?? 'en';

// Validate parameters
if ($topCount < 1 || $topCount > 100) {
    echo json_encode(['success' => false, 'error' => 'Top count must be between 1 and 100']);
    exit;
}

// Validate language (only allow alphanumeric codes)
if (!preg_match('/^[a-z]{2}$/', $language)) {
    echo json_encode(['success' => false, 'error' => 'Invalid language code']);
    exit;
}

// Validate dates
if (!validateDate($startDate) || !validateDate($endDate)) {
    echo json_encode(['success' => false, 'error' => 'Invalid date format']);
    exit;
}

// Create uploads directory if it doesn't exist
$uploadDir = '/tmp/uploads';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        echo json_encode(['success' => false, 'error' => 'Failed to create uploads directory.']);
        exit;
    }
}

// Create output directory if it doesn't exist
$outputDir = '/tmp/output';
if (!is_dir($outputDir)) {
    if (!mkdir($outputDir, 0777, true)) {
        echo json_encode(['success' => false, 'error' => 'Failed to create output directory.']);
        exit;
    }
}

// Get file info
$uploadedFile = $_FILES['chatFile'];
$fileExtension = strtolower(pathinfo($uploadedFile['name'], PATHINFO_EXTENSION));

// Validate file type
if (!in_array($fileExtension, ['txt', 'zip'])) {
    echo json_encode(['success' => false, 'error' => 'Only .txt and .zip files are allowed']);
    exit;
}

// Generate unique filename
$uniqueId = uniqid();
$uploadedFileName = $uniqueId . '_' . basename($uploadedFile['name']);
$uploadedFilePath = $uploadDir . '/' . $uploadedFileName;

// Move uploaded file
if (!move_uploaded_file($uploadedFile['tmp_name'], $uploadedFilePath)) {
    $error = error_get_last();
    $errorDetail = $error ? $error['message'] : 'Unknown error';
    echo json_encode([
        'success' => false,
        'error' => 'Failed to save uploaded file. ' . $errorDetail . ' Check that uploads directory has write permissions (chmod 755 uploads).'
    ]);
    exit;
}

// Run the Node.js script with arguments
$outputFileName = 'results_' . $uniqueId . '.txt';
$outputFilePath = $outputDir . '/' . $outputFileName;
$jsonOutputPath = $outputDir . '/results_' . $uniqueId . '.json';

$scriptPath = dirname(__DIR__) . '/script/main.js';

// Run with JSON output format
$command = sprintf(
    'node %s %s %s %s %s json %s > %s 2>&1',
    escapeshellarg($scriptPath),
    escapeshellarg($uploadedFilePath),
    escapeshellarg($startDate),
    escapeshellarg($endDate),
    escapeshellarg((string)$topCount),
    escapeshellarg($language),
    escapeshellarg($jsonOutputPath)
);

exec($command, $output, $returnCode);

// Also generate text output for download
$textCommand = sprintf(
    'node %s %s %s %s %s text %s > %s 2>&1',
    escapeshellarg($scriptPath),
    escapeshellarg($uploadedFilePath),
    escapeshellarg($startDate),
    escapeshellarg($endDate),
    escapeshellarg((string)$topCount),
    escapeshellarg($language),
    escapeshellarg($outputFilePath)
);

exec($textCommand, $textOutput, $textReturnCode);

// Clean up uploaded file
if (file_exists($uploadedFilePath)) {
    unlink($uploadedFilePath);
}

// Check if processing was successful
if ($returnCode !== 0 || !file_exists($jsonOutputPath)) {
    $errorOutput = file_exists($jsonOutputPath) ? file_get_contents($jsonOutputPath) : implode("\n", $output);
    
    // Clean up output files before returning error
    if (file_exists($jsonOutputPath)) {
        unlink($jsonOutputPath);
    }
    if (file_exists($outputFilePath)) {
        unlink($outputFilePath);
    }
    
    echo json_encode([
        'success' => false,
        'error' => 'Processing failed: ' . $errorOutput
    ]);
    exit;
}

// Verify results were created
if (!file_exists($jsonOutputPath)) {
    echo json_encode([
        'success' => false,
        'error' => 'Processing failed: No output generated'
    ]);
    exit;
}

// Get file sizes for reference
$jsonSize = filesize($jsonOutputPath);
$textSize = file_exists($outputFilePath) ? filesize($outputFilePath) : 0;

// Generate download URLs
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
$jsonDownloadUrl = $baseUrl . '/api.php?download=results_' . $uniqueId . '.json';
$textDownloadUrl = $baseUrl . '/api.php?download=' . $outputFileName;

// For small results (< 500KB), include inline. Otherwise, client must download.
$inlineResults = null;
if ($jsonSize < 500000) {
    $jsonResults = file_get_contents($jsonOutputPath);
    $inlineResults = json_decode($jsonResults, true);
}

// Return success response with download URLs
echo json_encode([
    'success' => true,
    'downloadUrls' => [
        'json' => $jsonDownloadUrl,
        'text' => $textDownloadUrl
    ],
    'fileSizes' => [
        'json' => $jsonSize,
        'text' => $textSize
    ],
    'filename' => $outputFileName,
    'results' => $inlineResults,
    'message' => $inlineResults === null ? 'Results too large for inline response. Use download URLs.' : 'Results included inline.'
]);

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDate($date)
{
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}
