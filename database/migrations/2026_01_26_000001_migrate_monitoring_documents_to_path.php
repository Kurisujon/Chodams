<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Migrates existing document paths from monitoring_documents table to 
     * monitoring_records.documents_path column. For records with multiple documents,
     * takes the first document by creation date.
     * 
     * Requirements: 1.4, 1.5, 6.1, 6.2, 6.3, 6.4
     */
    public function up(): void
    {
        DB::beginTransaction();
        
        try {
            // Get all monitoring records with documents, selecting the first document by created_at
            $recordsWithDocuments = DB::table('monitoring_documents')
                ->select('monitoring_record_id', DB::raw('MIN(file_path) as first_file_path'))
                ->groupBy('monitoring_record_id')
                ->get();
            
            $migratedCount = 0;
            
            // Update monitoring_records with first document path
            foreach ($recordsWithDocuments as $record) {
                $updated = DB::table('monitoring_records')
                    ->where('record_id', $record->monitoring_record_id)
                    ->update(['documents_path' => $record->first_file_path]);
                
                if ($updated) {
                    $migratedCount++;
                }
            }
            
            // Verify all non-null documents_path values are valid (not empty)
            $invalidPaths = DB::table('monitoring_records')
                ->whereNotNull('documents_path')
                ->where('documents_path', '')
                ->count();
            
            if ($invalidPaths > 0) {
                throw new \Exception("Migration validation failed: {$invalidPaths} records have empty documents_path");
            }
            
            DB::commit();
            
            // Log migration results
            Log::info('Migrated monitoring documents to documents_path', [
                'records_updated' => $migratedCount,
                'total_documents' => DB::table('monitoring_documents')->count(),
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Monitoring documents migration failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Reverse the migrations.
     * 
     * Restores documents from monitoring_records.documents_path back to 
     * monitoring_documents table.
     * 
     * Requirements: 6.6
     */
    public function down(): void
    {
        DB::beginTransaction();
        
        try {
            // Get all monitoring records with documents_path
            $recordsWithPaths = DB::table('monitoring_records')
                ->whereNotNull('documents_path')
                ->get();
            
            // Restore documents to monitoring_documents table
            foreach ($recordsWithPaths as $record) {
                DB::table('monitoring_documents')->insert([
                    'monitoring_record_id' => $record->record_id,
                    'file_path' => $record->documents_path,
                    'original_filename' => basename($record->documents_path),
                    'stored_filename' => basename($record->documents_path),
                    'file_size' => 0, // Unknown after migration
                    'mime_type' => 'application/octet-stream', // Unknown
                    'uploaded_by' => $record->created_by,
                    'created_at' => $record->created_at,
                    'updated_at' => $record->updated_at,
                ]);
            }
            
            // Clear documents_path column
            DB::table('monitoring_records')
                ->whereNotNull('documents_path')
                ->update(['documents_path' => null]);
            
            DB::commit();
            
            Log::info('Rolled back monitoring documents migration', [
                'records_restored' => $recordsWithPaths->count(),
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Monitoring documents migration rollback failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
};
