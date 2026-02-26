<?php
// check-assets.php - Upload this to public_html and visit in browser
// This will help diagnose the asset loading issue

echo "<h1>Asset Check Diagnostic</h1>";
echo "<pre>";

// Check if build directory exists
echo "1. Checking build directory...\n";
$buildDir = __DIR__ . '/build';
if (is_dir($buildDir)) {
    echo "✓ Build directory exists: $buildDir\n\n";
} else {
    echo "✗ Build directory NOT FOUND: $buildDir\n";
    echo "   You need to upload the entire 'build' folder!\n\n";
}

// Check manifest.json
echo "2. Checking manifest.json...\n";
$manifestPath = $buildDir . '/manifest.json';
if (file_exists($manifestPath)) {
    echo "✓ Manifest exists\n";
    $manifest = json_decode(file_get_contents($manifestPath), true);
    echo "   Manifest entries: " . count($manifest) . "\n\n";
    
    // Show some key files
    echo "3. Key files in manifest:\n";
    foreach ($manifest as $key => $value) {
        if (strpos($key, 'AdminDashboard') !== false || strpos($key, 'app.jsx') !== false) {
            echo "   $key => " . $value['file'] . "\n";
        }
    }
    echo "\n";
} else {
    echo "✗ Manifest NOT FOUND: $manifestPath\n\n";
}

// Check assets directory
echo "4. Checking assets directory...\n";
$assetsDir = $buildDir . '/assets';
if (is_dir($assetsDir)) {
    echo "✓ Assets directory exists\n";
    $files = scandir($assetsDir);
    $jsFiles = array_filter($files, function($f) { return strpos($f, '.js') !== false; });
    echo "   JavaScript files found: " . count($jsFiles) . "\n";
    
    // Check for specific files
    echo "\n5. Looking for AdminDashboard files:\n";
    foreach ($files as $file) {
        if (strpos($file, 'AdminDashboard') !== false) {
            $fullPath = $assetsDir . '/' . $file;
            $size = filesize($fullPath);
            echo "   ✓ $file (" . number_format($size) . " bytes)\n";
        }
    }
    echo "\n";
} else {
    echo "✗ Assets directory NOT FOUND: $assetsDir\n\n";
}

// Check .htaccess
echo "6. Checking .htaccess...\n";
$htaccessPath = __DIR__ . '/.htaccess';
if (file_exists($htaccessPath)) {
    echo "✓ .htaccess exists\n";
    $content = file_get_contents($htaccessPath);
    if (strpos($content, 'AddType application/javascript') !== false) {
        echo "   ✓ MIME types configured\n";
    } else {
        echo "   ✗ MIME types NOT configured - update .htaccess!\n";
    }
} else {
    echo "✗ .htaccess NOT FOUND\n";
}

echo "\n7. Server Information:\n";
echo "   Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "   Script Path: " . __DIR__ . "\n";
echo "   PHP Version: " . PHP_VERSION . "\n";

echo "\n8. Test Asset URL:\n";
$testUrl = '/build/manifest.json';
echo "   Try accessing: " . $_SERVER['HTTP_HOST'] . $testUrl . "\n";

echo "</pre>";

echo "<h2>Action Items:</h2>";
echo "<ul>";
if (!is_dir($buildDir)) {
    echo "<li><strong>Upload the entire 'build' folder to public_html/</strong></li>";
}
if (!file_exists($manifestPath)) {
    echo "<li><strong>Ensure manifest.json is in public_html/build/</strong></li>";
}
if (!is_dir($assetsDir)) {
    echo "<li><strong>Upload all files from build/assets/ folder</strong></li>";
}
echo "<li>After fixing, <strong>delete this check-assets.php file</strong></li>";
echo "</ul>";

echo "<p><a href='/build/manifest.json' target='_blank'>Click here to test if manifest.json is accessible</a></p>";
?>
