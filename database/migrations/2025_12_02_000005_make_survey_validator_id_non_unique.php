<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        try { DB::statement("ALTER TABLE survey DROP INDEX validator_id"); } catch (\Throwable $e) {}
        DB::statement("ALTER TABLE survey ADD INDEX idx_survey_validator_id (validator_id)");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE survey DROP INDEX idx_survey_validator_id");
        DB::statement("ALTER TABLE survey ADD UNIQUE INDEX validator_id (validator_id)");
    }
};

