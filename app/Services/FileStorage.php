<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * FileStorage handles secure file storage for monitoring documents.
 * 
 * This service:
 * - Stores files outside the web-accessible directory
 * - Generates unique filenames to prevent collisions
 * - Provides file cleanup capabilities
 */
class FileStorage
{
    /**
     * The base storage disk to use
     */
    private string $disk;

    /**
     * Create a new FileStorage instance.
     *
     * @param string $disk The storage disk to use (default: 'local')
     */
    public function __construct(string $disk = 'local')
    {
        $this->disk = $disk;
    }

    /**
     * Store an uploaded file with unique filename generation.
     *
     * @param UploadedFile $file The file to store
     * @param string $directory The subdirectory to store in (e.g., 'monitoring_documents')
     * @return StorageResult
     */
    public function store(UploadedFile $file, string $directory): StorageResult
    {
        try {
            // Validate file
            if (!$file->isValid()) {
                Log::warning('FileStorage: Attempted to store invalid file', [
                    'filename' => $file->getClientOriginalName(),
                    'error_code' => $file->getError(),
                    'timestamp' => now()->toDateTimeString(),
                ]);

                return new StorageResult(
                    false,
                    null,
                    null,
                    null,
                    'The uploaded file is not valid'
                );
            }

            // Generate unique filename
            $originalFilename = $file->getClientOriginalName();
            $uniqueFilename = $this->generateUniqueFilename($originalFilename);

            // Store the file
            $path = $file->storeAs($directory, $uniqueFilename, $this->disk);

            if (!$path) {
                Log::error('FileStorage: Failed to store file', [
                    'filename' => $originalFilename,
                    'directory' => $directory,
                    'timestamp' => now()->toDateTimeString(),
                ]);

                return new StorageResult(
                    false,
                    null,
                    null,
                    null,
                    'Failed to store file'
                );
            }

            // Get the full path
            $fullPath = Storage::disk($this->disk)->path($path);

            Log::info('FileStorage: File stored successfully', [
                'original_filename' => $originalFilename,
                'stored_filename' => $uniqueFilename,
                'path' => $path,
                'size' => $file->getSize(),
                'timestamp' => now()->toDateTimeString(),
            ]);

            return new StorageResult(
                true,
                $uniqueFilename,
                $path,
                $fullPath,
                null
            );

        } catch (\Exception $e) {
            Log::error('FileStorage::store error', [
                'filename' => $file->getClientOriginalName(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'timestamp' => now()->toDateTimeString(),
            ]);

            return new StorageResult(
                false,
                null,
                null,
                null,
                'Failed to store file: ' . $e->getMessage()
            );
        }
    }

    /**
     * Delete a file from storage.
     *
     * @param string $filePath The relative path to the file
     * @return bool
     */
    public function delete(string $filePath): bool
    {
        try {
            if (empty($filePath)) {
                return true;
            }

            // Check if file exists
            if (!Storage::disk($this->disk)->exists($filePath)) {
                Log::warning('FileStorage::delete - File not found', [
                    'path' => $filePath,
                    'timestamp' => now()->toDateTimeString(),
                ]);
                return true; // Consider it deleted if it doesn't exist
            }

            // Delete the file
            $deleted = Storage::disk($this->disk)->delete($filePath);

            if (!$deleted) {
                Log::error('FileStorage::delete - Failed to delete file', [
                    'path' => $filePath,
                    'timestamp' => now()->toDateTimeString(),
                ]);
                return false;
            }

            Log::info('FileStorage: File deleted successfully', [
                'path' => $filePath,
                'timestamp' => now()->toDateTimeString(),
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('FileStorage::delete error', [
                'path' => $filePath,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'timestamp' => now()->toDateTimeString(),
            ]);
            return false;
        }
    }

    /**
     * Generate a unique filename to prevent collisions.
     *
     * @param string $originalFilename The original filename
     * @return string The unique filename
     */
    public function generateUniqueFilename(string $originalFilename): string
    {
        // Get the file extension
        $extension = pathinfo($originalFilename, PATHINFO_EXTENSION);
        $nameWithoutExtension = pathinfo($originalFilename, PATHINFO_FILENAME);

        // Sanitize the filename
        $fileValidator = new FileValidator();
        $sanitized = $fileValidator->sanitizeFilename($nameWithoutExtension);

        // Generate UUID
        $uuid = Str::uuid()->toString();

        // Combine: timestamp_uuid_sanitizedname.extension
        $timestamp = time();
        $uniqueName = "{$timestamp}_{$uuid}_{$sanitized}";

        // Add extension
        return $extension ? $uniqueName . '.' . $extension : $uniqueName;
    }

    /**
     * Check if a file exists in storage.
     *
     * @param string $filePath The relative path to the file
     * @return bool
     */
    public function exists(string $filePath): bool
    {
        try {
            return Storage::disk($this->disk)->exists($filePath);
        } catch (\Exception $e) {
            Log::error('FileStorage::exists error', [
                'path' => $filePath,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get the full filesystem path for a file.
     *
     * @param string $filePath The relative path to the file
     * @return string|null
     */
    public function getFullPath(string $filePath): ?string
    {
        try {
            if (!$this->exists($filePath)) {
                return null;
            }

            return Storage::disk($this->disk)->path($filePath);
        } catch (\Exception $e) {
            Log::error('FileStorage::getFullPath error', [
                'path' => $filePath,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get the size of a file in bytes.
     *
     * @param string $filePath The relative path to the file
     * @return int|null
     */
    public function getSize(string $filePath): ?int
    {
        try {
            if (!$this->exists($filePath)) {
                return null;
            }

            return Storage::disk($this->disk)->size($filePath);
        } catch (\Exception $e) {
            Log::error('FileStorage::getSize error', [
                'path' => $filePath,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get the MIME type of a file.
     *
     * @param string $filePath The relative path to the file
     * @return string|null
     */
    public function getMimeType(string $filePath): ?string
    {
        try {
            if (!$this->exists($filePath)) {
                return null;
            }

            return Storage::disk($this->disk)->mimeType($filePath);
        } catch (\Exception $e) {
            Log::error('FileStorage::getMimeType error', [
                'path' => $filePath,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get the storage disk being used.
     *
     * @return string
     */
    public function getDisk(): string
    {
        return $this->disk;
    }
}

/**
 * StorageResult encapsulates the result of a file storage operation.
 */
class StorageResult
{
    private bool $success;
    private ?string $filename;
    private ?string $path;
    private ?string $fullPath;
    private ?string $error;

    public function __construct(
        bool $success,
        ?string $filename,
        ?string $path,
        ?string $fullPath,
        ?string $error
    ) {
        $this->success = $success;
        $this->filename = $filename;
        $this->path = $path;
        $this->fullPath = $fullPath;
        $this->error = $error;
    }

    public function isSuccess(): bool
    {
        return $this->success;
    }

    public function getFilename(): ?string
    {
        return $this->filename;
    }

    public function getPath(): ?string
    {
        return $this->path;
    }

    public function getFullPath(): ?string
    {
        return $this->fullPath;
    }

    public function getError(): ?string
    {
        return $this->error;
    }
}
