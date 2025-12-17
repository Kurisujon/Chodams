<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('household_mem') && !Schema::hasColumn('household_mem', 'code')) {
            Schema::table('household_mem', function (Blueprint $table) {
                $table->string('code')->nullable()->after('monthly_income');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('household_mem') && Schema::hasColumn('household_mem', 'code')) {
            Schema::table('household_mem', function (Blueprint $table) {
                $table->dropColumn('code');
            });
        }
    }
};
