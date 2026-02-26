<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration fixes file paths in the database by removing the 'storage/' prefix.
     * The paths should be stored as relative paths from storage/app/public/
     * e.g., 'hoa_images/file.jpg' instead of 'storage/hoa_images/file.jpg'
     */
    public function up(): void
    {
        $tables = [
            ['table' => 'siteproj', 'column' => 'proj_image', 'primary_key' => 'project_id'],
            ['table' => 'hoa', 'column' => 'hoa_image', 'primary_key' => 'hoa_id'],
            ['table' => 'hoa_documents', 'column' => 'file_path', 'primary_key' => 'document_id'],
            ['table' => 'revocations', 'column' => 'documentation_path', 'primary_key' => 'revocation_id'],
            ['table' => 'training', 'column' => 'house_photo', 'primary_key' => 'training_id'],
            ['table' => 'training', 'column' => 'person_photo', 'primary_key' => 'training_id'],
            ['table' => 'training', 'column' => 'respondent_signature', 'primary_key' => 'training_id'],
            ['table' => 'survey', 'column' => 'validator_signature', 'primary_key' => 'survey_id'],
        ];

        foreach ($tables as $config) {
            $this->fixPathsInTable($config['table'], $config['column'], $config['primary_key']);
        }
    }

    /**
     * Fix file paths in a specific table by removing 'storage/' prefix.
     */
    private function fixPathsInTable(string $table, string $column, string $primaryKey): void
    {
        try {
            // Check if table exists
            if (!DB::getSchemaBuilder()->hasTable($table)) {
                Log::info("Table {$table} does not exist, skipping.");
                return;
            }

            // Check if column exists
            if (!DB::getSchemaBuilder()->hasColumn($table, $column)) {
                Log::info("Column {$column} does not exist in {$table}, skipping.");
                return;
            }

            // Find records with 'storage/' prefix
            $records = DB::table($table)
                ->whereNotNull($column)
                ->where($column, '!=', '')
                ->where($column, 'like', 'storage/%')
                ->get();

            $count = 0;
            foreach ($records as $record) {
                $oldPath = $record->$column;
                $newPath = $this->normalizePath($oldPath);

                if ($oldPath !== $newPath) {
                    DB::table($table)
                        ->where($primaryKey, $record->$primaryKey)
                        ->update([$column => $newPath]);
                    $count++;
                }
            }

            if ($count > 0) {
                Log::info("Fixed {$count} file paths in {$table}.{$column}");
            }

        } catch (\Exception $e) {
            Log::error("Error fixing paths in {$table}.{$column}: " . $e->getMessage());
        }
    }

    /**
     * Normalize a file path by removing 'storage/' prefix.
     */
    private function normalizePath(string $path): string
    {
        $path = ltrim($path, '/');
        
        if (str_starts_with($path, 'storage/')) {
            return substr($path, 8); // Remove 'storage/' prefix
        }

        return $path;
    }

    /**
     * Reverse the migrations.
     * 
     * This adds back the 'storage/' prefix to paths.
     * Note: This is generally not recommended as the new format is correct.
     */
    public function down(): void
    {
        $tables = [
            ['table' => 'siteproj', 'column' => 'proj_image', 'primary_key' => 'project_id'],
            ['table' => 'hoa', 'column' => 'hoa_image', 'primary_key' => 'hoa_id'],
            ['table' => 'hoa_documents', 'column' => 'file_path', 'primary_key' => 'document_id'],
            ['table' => 'revocations', 'column' => 'documentation_path', 'primary_key' => 'revocation_id'],
            ['table' => 'training', 'column' => 'house_photo', 'primary_key' => 'training_id'],
            ['table' => 'training', 'column' => 'person_photo', 'primary_key' => 'training_id'],
            ['table' => 'training', 'column' => 'respondent_signature', 'primary_key' => 'training_id'],
            ['table' => 'survey', 'column' => 'validator_signature', 'primary_key' => 'survey_id'],
        ];

        foreach ($tables as $config) {
            $this->addStoragePrefixInTable($config['table'], $config['column'], $config['primary_key']);
        }
    }

    /**
     * Add 'storage/' prefix back to paths (for rollback).
     */
    private function addStoragePrefixInTable(string $table, string $column, string $primaryKey): void
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable($table)) {
                return;
            }

            if (!DB::getSchemaBuilder()->hasColumn($table, $column)) {
                return;
            }

            // Find records without 'storage/' prefix
            $records = DB::table($table)
                ->whereNotNull($column)
                ->where($column, '!=', '')
                ->where($column, 'not like', 'storage/%')
                ->get();

            foreach ($records as $record) {
                $oldPath = $record->$column;
                $newPath = 'storage/' . ltrim($oldPath, '/');

                DB::table($table)
                    ->where($primaryKey, $record->$primaryKey)
                    ->update([$column => $newPath]);
            }

        } catch (\Exception $e) {
            Log::error("Error reverting paths in {$table}.{$column}: " . $e->getMessage());
        }
    }
};
