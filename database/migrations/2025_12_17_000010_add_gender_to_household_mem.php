<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('household_mem') && !Schema::hasColumn('household_mem', 'gender')) {
            Schema::table('household_mem', function (Blueprint $table) {
                $table->string('gender')->nullable()->after('occupation');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('household_mem') && Schema::hasColumn('household_mem', 'gender')) {
            Schema::table('household_mem', function (Blueprint $table) {
                $table->dropColumn('gender');
            });
        }
    }
};
