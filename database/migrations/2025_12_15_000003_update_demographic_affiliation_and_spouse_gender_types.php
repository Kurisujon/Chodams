<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Change affiliation and spouse_gender to VARCHAR to store textual values
        try {
            DB::statement("ALTER TABLE demographic MODIFY affiliation VARCHAR(64) NULL");
        } catch (\Throwable $e) {
            // ignore
        }
        try {
            DB::statement("ALTER TABLE demographic MODIFY spouse_gender VARCHAR(16) NULL");
        } catch (\Throwable $e) {
            // ignore
        }
    }

    public function down(): void
    {
        // revert to previous types if needed
        try {
            DB::statement("ALTER TABLE demographic MODIFY affiliation TINYINT NULL");
        } catch (\Throwable $e) {
            // ignore
        }
        try {
            DB::statement("ALTER TABLE demographic MODIFY spouse_gender INT NULL");
        } catch (\Throwable $e) {
            // ignore
        }
    }
};

