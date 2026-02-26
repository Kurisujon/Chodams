<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

/**
 * FileValidator provides comprehensive file validation for uploads.
 * 
 * This service validates:
 * - File size limits
 * - MIME type restrictions
 * - File extension matching
 * - File content verification
 */
class FileValidator
{
    /**
     * Maximum file size in bytes (10MB)
     */
    private const MAX_FILE_SIZE = 10485760;

    /**
     * Allowed MIME types for uploads
     */
    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    /**
     * Allowed file extensions
     */
    private const ALLOWED_EXTENSIONS = [
        'pdf',
        'jpg',
        'jpeg',
        'png',
        'doc',
        'docx'
    ];

    /**
     * MIME type to extension mapping
     */
    private const MIME_TO_EXTENSION = [
        'application/pdf' => ['pdf'],
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'application/msword' => ['doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => ['docx']
    ];

    /**
     * Validate an uploaded file.
     *
     * @param UploadedFile $file The file to validate
     * @return ValidationResult
     */
    public function validate(UploadedFile $file): ValidationResult
    {
        $errors = [];

        // Check if file is valid
        if (!$file->isValid()) {
            $errors[] = 'The uploaded file is not valid';
            Log::warning('File validation failed: Invalid file upload', [
                'filename' => $file->getClientOriginalName(),
                'error_code' => $file->getError(),
                'timestamp' => now()->toDateTimeString(),
            ]);
            return new ValidationResult(false, $errors);
        }

        // Validate file size
        if (!$this->validateFileSize($file)) {
            $errors[] = 'File size exceeds 10MB limit';
            Log::warning('File validation failed: Size limit exceeded', [
                'filename' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'max_size' => self::MAX_FILE_SIZE,
                'timestamp' => now()->toDateTimeString(),
            ]);
        }

        // Validate file extension
        $extension = strtolower($file->getClientOriginalExtension());
        if (!$this->validateExtension($extension)) {
            $errors[] = 'File type not allowed. Allowed types: PDF, JPG, JPEG, PNG, DOC, DOCX';
            Log::warning('File validation failed: Invalid extension', [
                'filename' => $file->getClientOriginalName(),
                'extension' => $extension,
                'allowed_extensions' => self::ALLOWED_EXTENSIONS,
                'timestamp' => now()->toDateTimeString(),
            ]);
        }

        // Validate MIME type
        if (!$this->validateMimeType($file)) {
            $errors[] = 'File MIME type not allowed';
            Log::warning('File validation failed: Invalid MIME type', [
                'filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'allowed_mime_types' => self::ALLOWED_MIME_TYPES,
                'timestamp' => now()->toDateTimeString(),
            ]);
        }

        // Validate MIME type matches extension
        if (empty($errors) && !$this->validateMimeTypeMatchesExtension($file, $extension)) {
            $errors[] = 'File extension does not match file content';
            Log::warning('File validation failed: MIME type mismatch', [
                'filename' => $file->getClientOriginalName(),
                'extension' => $extension,
                'mime_type' => $file->getMimeType(),
                'timestamp' => now()->toDateTimeString(),
            ]);
        }

        return new ValidationResult(empty($errors), $errors);
    }

    /**
     * Validate file size.
     *
     * @param UploadedFile $file
     * @return bool
     */
    public function validateFileSize(UploadedFile $file): bool
    {
        return $file->getSize() <= self::MAX_FILE_SIZE;
    }

    /**
     * Validate file extension.
     *
     * @param string $extension
     * @return bool
     */
    public function validateExtension(string $extension): bool
    {
        return in_array(strtolower($extension), self::ALLOWED_EXTENSIONS, true);
    }

    /**
     * Validate MIME type from file content.
     *
     * @param UploadedFile $file
     * @return bool
     */
    public function validateMimeType(UploadedFile $file): bool
    {
        $mimeType = $file->getMimeType();
        return in_array($mimeType, self::ALLOWED_MIME_TYPES, true);
    }

    /**
     * Validate that MIME type matches file extension.
     *
     * @param UploadedFile $file
     * @param string $extension
     * @return bool
     */
    public function validateMimeTypeMatchesExtension(UploadedFile $file, string $extension): bool
    {
        $mimeType = $file->getMimeType();
        $extension = strtolower($extension);

        if (!isset(self::MIME_TO_EXTENSION[$mimeType])) {
            return false;
        }

        return in_array($extension, self::MIME_TO_EXTENSION[$mimeType], true);
    }

    /**
     * Sanitize a filename by removing special characters.
     *
     * @param string $filename
     * @return string
     */
    public function sanitizeFilename(string $filename): string
    {
        // Get the file extension
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $nameWithoutExtension = pathinfo($filename, PATHINFO_FILENAME);

        // Remove special characters, keep only alphanumeric, dash, underscore
        $sanitized = preg_replace('/[^a-zA-Z0-9_-]/', '_', $nameWithoutExtension);

        // Remove multiple consecutive underscores
        $sanitized = preg_replace('/_+/', '_', $sanitized);

        // Trim underscores from start and end
        $sanitized = trim($sanitized, '_');

        // Limit length to 100 characters
        if (strlen($sanitized) > 100) {
            $sanitized = substr($sanitized, 0, 100);
        }

        // If sanitized name is empty, use a default
        if (empty($sanitized)) {
            $sanitized = 'file';
        }

        // Add extension back
        return $extension ? $sanitized . '.' . $extension : $sanitized;
    }

    /**
     * Get the maximum allowed file size in bytes.
     *
     * @return int
     */
    public function getMaxFileSize(): int
    {
        return self::MAX_FILE_SIZE;
    }

    /**
     * Get the list of allowed MIME types.
     *
     * @return array
     */
    public function getAllowedMimeTypes(): array
    {
        return self::ALLOWED_MIME_TYPES;
    }

    /**
     * Get the list of allowed file extensions.
     *
     * @return array
     */
    public function getAllowedExtensions(): array
    {
        return self::ALLOWED_EXTENSIONS;
    }
}

/**
 * ValidationResult encapsulates the result of file validation.
 */
class ValidationResult
{
    private bool $isValid;
    private array $errors;

    public function __construct(bool $isValid, array $errors = [])
    {
        $this->isValid = $isValid;
        $this->errors = $errors;
    }

    public function isValid(): bool
    {
        return $this->isValid;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getErrorMessage(): string
    {
        return implode('; ', $this->errors);
    }
}
