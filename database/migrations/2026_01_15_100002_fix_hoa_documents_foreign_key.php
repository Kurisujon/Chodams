<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration fixes the foreign key constraint on hoa_documents table.
     * The uploaded_by column was referencing the users table, but admin users
     * are stored in the admin table. We drop the FK constraint and make the column nullable.
     */
    public function up(): void
    {
        // Fix hoa_documents table - drop FK and make nullable using raw SQL
        $fkName = $this->getForeignKeyName('hoa_documents', 'uploaded_by');
        if ($fkName) {
            DB::statement("ALTER TABLE hoa_documents DROP FOREIGN KEY {$fkName}");
        }
        DB::statement("ALTER TABLE hoa_documents MODIFY uploaded_by BIGINT UNSIGNED NULL");
    }

    /**
     * Get the foreign key constraint name for a column.
     */
    private function getForeignKeyName(string $table, string $column): ?string
    {
        $database = config('database.connections.mysql.database');
        
        $result = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = ? 
            AND COLUMN_NAME = ? 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        ", [$database, $table, $column]);

        return $result[0]->CONSTRAINT_NAME ?? null;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE hoa_documents MODIFY uploaded_by BIGINT UNSIGNED NOT NULL");
    }
};
