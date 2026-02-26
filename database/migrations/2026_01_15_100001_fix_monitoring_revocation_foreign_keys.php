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
     * This migration fixes the foreign key constraints on monitoring_records and revocations tables.
     * The created_by and revoked_by columns were referencing the users table, but admin users
     * are stored in the admin table. We drop the FK constraints and make the columns nullable.
     */
    public function up(): void
    {
        // Fix monitoring_records table - drop FK and make nullable using raw SQL
        // First, get the actual foreign key constraint name
        $monitoringFkName = $this->getForeignKeyName('monitoring_records', 'created_by');
        if ($monitoringFkName) {
            DB::statement("ALTER TABLE monitoring_records DROP FOREIGN KEY {$monitoringFkName}");
        }
        DB::statement("ALTER TABLE monitoring_records MODIFY created_by BIGINT UNSIGNED NULL");

        // Fix revocations table - drop FK and make nullable using raw SQL
        $revocationFkName = $this->getForeignKeyName('revocations', 'revoked_by');
        if ($revocationFkName) {
            DB::statement("ALTER TABLE revocations DROP FOREIGN KEY {$revocationFkName}");
        }
        DB::statement("ALTER TABLE revocations MODIFY revoked_by BIGINT UNSIGNED NULL");
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
        // Make columns not nullable again (but don't restore FK as it was incorrect)
        DB::statement("ALTER TABLE monitoring_records MODIFY created_by BIGINT UNSIGNED NOT NULL");
        DB::statement("ALTER TABLE revocations MODIFY revoked_by BIGINT UNSIGNED NOT NULL");
    }
};
