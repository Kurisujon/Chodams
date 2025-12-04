<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE demographic MODIFY spouse_name VARCHAR(250) NULL");
        DB::statement("ALTER TABLE demographic MODIFY spouse_religion VARCHAR(250) NULL");
        DB::statement("ALTER TABLE demographic MODIFY spouse_tribe VARCHAR(250) NULL");
        DB::statement("ALTER TABLE demographic MODIFY spouse_age INT NULL");
        DB::statement("ALTER TABLE demographic MODIFY spouse_gender INT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE demographic MODIFY spouse_name VARCHAR(250) NOT NULL");
        DB::statement("ALTER TABLE demographic MODIFY spouse_religion VARCHAR(250) NOT NULL");
        DB::statement("ALTER TABLE demographic MODIFY spouse_tribe VARCHAR(250) NOT NULL");
        DB::statement("ALTER TABLE demographic MODIFY spouse_age INT NOT NULL");
        DB::statement("ALTER TABLE demographic MODIFY spouse_gender INT NOT NULL");
    }
};

