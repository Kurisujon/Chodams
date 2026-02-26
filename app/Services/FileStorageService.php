<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * FileStorageService handles file uploads with dual storage support.
 * 
 * This service stores files in both:
 * 1. Laravel's storage/app/public directory (via Storage facade)
 * 2. The public directory (public/storage or public_html/storage on live server)
 * 
 * This ensures files are accessible on both development and production environments,
 * even if the symbolic link is not properly configured.
 */
class FileStorageService
{
    /**
     * Store a file in both storage locations.
     *
     * @param UploadedFile $file The uploaded file
     * @param string $directory The subdirectory to store in (e.g., 'projects', 'hoa_images')
     * @param string|null $prefix Optional filename prefix (e.g., 'proj_', 'hoa_')
     * @return array{success: bool, path: string|null, filename: string|null, error: string|null}
     */
    public static function store(UploadedFile $file, string $directory, ?string $prefix = null): array
    {
        try {
            // Validate file
            if (!$file->isValid()) {
                return [
                    'success' => false,
                    'path' => null,
                    'filename' => null,
                    'error' => 'The uploaded file is not valid.'
                ];
            }

            // Generate unique filename
            $prefix = $prefix ?? '';
            $filename = $prefix . uniqid() . '.' . $file->getClientOriginalExtension();

            // Store in Laravel's storage/app/public directory
            $stored = Storage::disk('public')->putFileAs($directory, $file, $filename);
            
            if (!$stored) {
                return [
                    'success' => false,
                    'path' => null,
                    'filename' => null,
                    'error' => 'Failed to store file in storage directory.'
                ];
            }

            // Also copy to public directory for live server compatibility
            self::copyToPublicDirectory($directory, $filename);

            // Return the path WITH 'storage/' prefix for live server compatibility
            // This ensures the path stored in database matches the public URL path
            $storagePath = 'storage/' . $directory . '/' . $filename;

            return [
                'success' => true,
                'path' => $storagePath,
                'filename' => $filename,
                'error' => null
            ];

        } catch (\Exception $e) {
            Log::error('FileStorageService::store error: ' . $e->getMessage());
            return [
                'success' => false,
                'path' => null,
                'filename' => null,
                'error' => 'Failed to store file: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Copy a file from storage to the public directory.
     * This ensures the file is accessible even without a symbolic link.
     *
     * @param string $directory The subdirectory
     * @param string $filename The filename
     * @return bool
     */
    public static function copyToPublicDirectory(string $directory, string $filename): bool
    {
        try {
            $sourcePath = Storage::disk('public')->path($directory . '/' . $filename);
            
            // Hostinger structure:
            // /home/user/public_html/storage/projects/  <-- web accessible
            // /home/user/Chodams/Chodams/              <-- Laravel base_path()
            // So public_html is a SIBLING of the first Chodams folder (2 levels up from base_path)
            
            $basePath = base_path(); // e.g., /home/user/Chodams/Chodams
            $rootDir = dirname(dirname($basePath)); // Go up 2 levels to /home/user
            $publicHtmlDir = $rootDir . '/public_html/storage/' . $directory;
            
            // Also try the standard public path for local development
            $publicDir = public_path('storage/' . $directory);
            
            $copied = false;
            
            // Copy to public_html/storage if it exists (live server - Hostinger)
            if (is_dir($rootDir . '/public_html')) {
                if (!is_dir($publicHtmlDir)) {
                    @mkdir($publicHtmlDir, 0775, true);
                }
                if (file_exists($sourcePath)) {
                    @copy($sourcePath, $publicHtmlDir . '/' . $filename);
                    @chmod($publicHtmlDir . '/' . $filename, 0644);
                    $copied = true;
                }
            }
            
            // Also copy to public/storage (development or if public_html doesn't exist)
            if (!is_dir($publicDir)) {
                @mkdir($publicDir, 0775, true);
            }
            if (file_exists($sourcePath)) {
                @copy($sourcePath, $publicDir . '/' . $filename);
                $copied = true;
            }

            return $copied;

        } catch (\Exception $e) {
            Log::error('FileStorageService::copyToPublicDirectory error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete a file from both storage locations.
     *
     * @param string|null $path The relative path (e.g., 'hoa_images/file.jpg' or 'storage/hoa_images/file.jpg')
     * @return bool
     */
    public static function delete(?string $path): bool
    {
        if (empty($path)) {
            return true;
        }

        try {
            // Normalize the path - remove 'storage/' prefix if present
            $relativePath = self::normalizePath($path);

            // Delete from Laravel storage
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
            }

            // Delete from public directory
            $publicPath = public_path('storage/' . $relativePath);
            if (file_exists($publicPath)) {
                @unlink($publicPath);
            }

            return true;

        } catch (\Exception $e) {
            Log::error('FileStorageService::delete error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get the public URL for a file.
     *
     * @param string|null $path The relative path stored in database
     * @return string|null The public URL or null if path is empty
     */
    public static function getUrl(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        $path = ltrim($path, '/');
        
        // If path already starts with 'storage/', just prepend '/'
        if (str_starts_with($path, 'storage/')) {
            return '/' . $path;
        }

        // Otherwise, prepend '/storage/'
        return '/storage/' . $path;
    }

    /**
     * Normalize a file path by removing 'storage/' prefix if present.
     * This is used internally for Storage facade operations.
     *
     * @param string $path The path to normalize
     * @return string The normalized path (without 'storage/' prefix)
     */
    public static function normalizePath(string $path): string
    {
        $path = ltrim($path, '/');
        
        if (str_starts_with($path, 'storage/')) {
            return substr($path, 8); // Remove 'storage/' prefix
        }

        return $path;
    }

    /**
     * Get the storage path with 'storage/' prefix for database storage.
     *
     * @param string $path The path (with or without 'storage/' prefix)
     * @return string The path with 'storage/' prefix
     */
    public static function getStoragePath(string $path): string
    {
        $path = ltrim($path, '/');
        
        if (str_starts_with($path, 'storage/')) {
            return $path;
        }

        return 'storage/' . $path;
    }

    /**
     * Check if a file exists in storage.
     *
     * @param string|null $path The relative path
     * @return bool
     */
    public static function exists(?string $path): bool
    {
        if (empty($path)) {
            return false;
        }

        $relativePath = self::normalizePath($path);

        // Check in Laravel storage first
        if (Storage::disk('public')->exists($relativePath)) {
            return true;
        }

        // Check in public directory as fallback
        $publicPath = public_path('storage/' . $relativePath);
        return file_exists($publicPath);
    }

    /**
     * Get the full filesystem path for a file.
     *
     * @param string|null $path The relative path
     * @return string|null
     */
    public static function getFullPath(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        $relativePath = self::normalizePath($path);

        // Try Laravel storage first
        if (Storage::disk('public')->exists($relativePath)) {
            return Storage::disk('public')->path($relativePath);
        }

        // Try public directory as fallback
        $publicPath = public_path('storage/' . $relativePath);
        if (file_exists($publicPath)) {
            return $publicPath;
        }

        return null;
    }

    /**
     * Get the MIME type of a file.
     *
     * @param string|null $path The relative path
     * @return string|null
     */
    public static function getMimeType(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        $relativePath = self::normalizePath($path);

        // Try Laravel storage first
        if (Storage::disk('public')->exists($relativePath)) {
            return Storage::disk('public')->mimeType($relativePath);
        }

        // Try public directory as fallback
        $fullPath = self::getFullPath($path);
        if ($fullPath && file_exists($fullPath)) {
            return mime_content_type($fullPath);
        }

        return null;
    }

    /**
     * Migrate existing file paths in the database.
     * Removes 'storage/' prefix from paths that have it.
     *
     * @param string $table The table name
     * @param string $column The column name containing file paths
     * @return int Number of records updated
     */
    public static function migrateFilePaths(string $table, string $column): int
    {
        $count = 0;

        try {
            $records = \DB::table($table)
                ->whereNotNull($column)
                ->where($column, '!=', '')
                ->where($column, 'like', 'storage/%')
                ->get();

            foreach ($records as $record) {
                $primaryKey = self::getPrimaryKey($table);
                $oldPath = $record->$column;
                $newPath = self::normalizePath($oldPath);

                if ($oldPath !== $newPath) {
                    \DB::table($table)
                        ->where($primaryKey, $record->$primaryKey)
                        ->update([$column => $newPath]);
                    $count++;
                }
            }

        } catch (\Exception $e) {
            Log::error("FileStorageService::migrateFilePaths error for {$table}.{$column}: " . $e->getMessage());
        }

        return $count;
    }

    /**
     * Get the primary key column name for a table.
     *
     * @param string $table
     * @return string
     */
    private static function getPrimaryKey(string $table): string
    {
        $primaryKeys = [
            'siteproj' => 'project_id',
            'hoa' => 'hoa_id',
            'hoa_documents' => 'document_id',
            'revocations' => 'revocation_id',
            'training' => 'training_id',
            'survey' => 'survey_id',
        ];

        return $primaryKeys[$table] ?? 'id';
    }
}
