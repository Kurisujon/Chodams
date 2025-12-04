<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE classification MODIFY subclass_displaced INT NULL");
        DB::statement("ALTER TABLE classification MODIFY subclass_doubleup INT NULL");
        DB::statement("ALTER TABLE classification MODIFY subclass_homeless INT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE classification MODIFY subclass_displaced INT NOT NULL");
        DB::statement("ALTER TABLE classification MODIFY subclass_doubleup INT NOT NULL");
        DB::statement("ALTER TABLE classification MODIFY subclass_homeless INT NOT NULL");
    }
};

