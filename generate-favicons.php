<?php
/**
 * Favicon Generator Script for CHoDaMS
 * 
 * This script generates favicon files from the logo.png file.
 * Run this script from the command line: php generate-favicons.php
 */

// Check if GD library is available
if (!extension_loaded('gd')) {
    echo "ERROR: GD library is not installed.\n";
    echo "\nPlease use one of these alternatives:\n";
    echo "1. Online Generator (Recommended): https://favicon.io/favicon-converter/\n";
    echo "   - Upload: public/pics/logo.png\n";
    echo "   - Download the generated files\n";
    echo "   - Extract to: public/\n\n";
    echo "2. Install GD: Enable php_gd2 extension in php.ini\n";
    exit(1);
}

$sourceLogo = __DIR__ . '/public/pics/logo.png';
$outputDir = __DIR__ . '/public/';

// Check if source logo exists
if (!file_exists($sourceLogo)) {
    echo "ERROR: Source logo not found at: $sourceLogo\n";
    exit(1);
}

echo "Generating favicons from: $sourceLogo\n";

// Load source image
$source = imagecreatefrompng($sourceLogo);
if (!$source) {
    echo "ERROR: Failed to load source image\n";
    exit(1);
}

// Enable alpha blending
imagealphablending($source, true);
imagesavealpha($source, true);

// Function to resize and save PNG
function generateFavicon($source, $outputPath, $size) {
    $favicon = imagecreatetruecolor($size, $size);
    
    // Enable transparency
    imagealphablending($favicon, false);
    imagesavealpha($favicon, true);
    $transparent = imagecolorallocatealpha($favicon, 0, 0, 0, 127);
    imagefill($favicon, 0, 0, $transparent);
    imagealphablending($favicon, true);
    
    // Resize
    imagecopyresampled(
        $favicon, $source,
        0, 0, 0, 0,
        $size, $size,
        imagesx($source), imagesy($source)
    );
    
    // Save
    imagesavealpha($favicon, true);
    imagepng($favicon, $outputPath);
    imagedestroy($favicon);
    
    echo "✓ Generated: " . basename($outputPath) . " ($size x $size)\n";
}

// Generate PNG favicons
generateFavicon($source, $outputDir . 'favicon-16x16.png', 16);
generateFavicon($source, $outputDir . 'favicon-32x32.png', 32);
generateFavicon($source, $outputDir . 'favicon-96x96.png', 96);
generateFavicon($source, $outputDir . 'android-chrome-192x192.png', 192);
generateFavicon($source, $outputDir . 'apple-touch-icon.png', 180);

// Generate ICO file (simplified - just copy 32x32 as .ico)
// For proper multi-resolution ICO, use online tools
copy($outputDir . 'favicon-32x32.png', $outputDir . 'favicon.ico');
echo "✓ Generated: favicon.ico (copied from 32x32)\n";

imagedestroy($source);

echo "\n✓ All favicons generated successfully!\n";
echo "\nNext step: Add favicon links to resources/views/app.blade.php\n";
