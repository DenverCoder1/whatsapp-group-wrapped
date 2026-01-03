<?php

// Routing files for Vercel deployment since everything goes through index.php

// parse parts of the URL
$path = strtok($_SERVER["REQUEST_URI"] ?? "", "?");
$parts = explode("/", $path);
// if the current URL has a directory and file, output the contents of the file
$file_in_folder = preg_match("/\/[^\/.]+\/.*\.(?:jpg|jpeg|png|gif|svg|css|js|pdf|ico)$/", $path, $matches);
$favicon = $path === "/favicon.ico";
if ($file_in_folder || $favicon) {
    $filepath = $favicon ? "/images/favicon.ico" : $matches[0];
    // output the image with the filename from the URL
    $contents = file_get_contents(__DIR__ . $filepath);
    // set content type
    if (preg_match("/\.(jpg|jpeg)$/", $filepath)) {
        header('Content-Type: image/jpeg');
    } elseif (preg_match("/\.(png)$/", $filepath)) {
        header('Content-Type: image/png');
    } elseif (preg_match("/\.(gif)$/", $filepath)) {
        header('Content-Type: image/gif');
    } elseif (preg_match("/\.(svg)$/", $filepath)) {
        header('Content-Type: image/svg+xml');
    } elseif (preg_match("/\.(css)$/", $filepath)) {
        header('Content-Type: text/css');
    } elseif (preg_match("/\.(js)$/", $filepath)) {
        header('Content-Type: text/javascript');
    } elseif (preg_match("/\.(pdf)$/", $filepath)) {
        header('Content-Type: application/pdf');
    } elseif (preg_match("/\.(ico)$/", $filepath)) {
        header('Content-Type: image/x-icon');
    }
    // set default filename
    header('Content-Disposition: inline; filename="' . basename($filepath) . '"');
    // output the image
    exit($contents);
}
