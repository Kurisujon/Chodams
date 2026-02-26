<?php
// clear-cache.php - Upload to public_html and visit once, then delete
// This clears Laravel caches without SSH access

echo "<h1>Cache Clearing Script</h1>";
echo "<pre>";

try {
    // Clear config cache
    if (file_exists(__DIR__ . '/../bootstrap/cache/config.php')) {
        unlink(__DIR__ . '/../bootstrap/cache/config.php');
        echo "✓ Config cache cleared\n";
    }
    
    // Clear route cache
    if (file_exists(__DIR__ . '/../bootstrap/cache/routes-v7.php')) {
        unlink(__DIR__ . '/../bootstrap/cache/routes-v7.php');
        echo "✓ Route cache cleared\n";
    }
    
    // Clear view cache
    $viewCachePath = __DIR__ . '/../storage/framework/views';
    if (is_dir($viewCachePath)) {
        $files = glob($viewCachePath . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        echo "✓ View cache cleared (" . count($files) . " files)\n";
    }
    
    // Clear compiled services
    if (file_exists(__DIR__ . '/../bootstrap/cache/services.php')) {
        unlink(__DIR__ . '/../bootstrap/cache/services.php');
        echo "✓ Services cache cleared\n";
    }
    
    echo "\n✓ All caches cleared successfully!\n";
    echo "\nIMPORTANT: Delete this file (clear-cache.php) now for security.\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "</pre>";
?>
