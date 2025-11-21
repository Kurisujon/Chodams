<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('validator')) {
            if (Schema::hasColumn('validator', 'status')) {
                try {
                    DB::statement("ALTER TABLE `validator` MODIFY `status` VARCHAR(32) NOT NULL DEFAULT 'approved'");
                } catch (\Throwable $e) {
                    // ignore if already compatible
                }
            }

            if (!Schema::hasColumn('validator', 'signature_data')) {
                Schema::table('validator', function (Blueprint $table) {
                    $table->longText('signature_data')->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('validator') && Schema::hasColumn('validator', 'signature_data')) {
            Schema::table('validator', function (Blueprint $table) {
                $table->dropColumn('signature_data');
            });
        }
    }
};