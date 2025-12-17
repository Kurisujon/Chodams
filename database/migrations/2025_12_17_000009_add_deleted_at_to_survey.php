<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('survey') && !Schema::hasColumn('survey', 'deleted_at')) {
            Schema::table('survey', function (Blueprint $table) {
                $table->timestamp('deleted_at')->nullable()->after('validator_signature');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at')) {
            Schema::table('survey', function (Blueprint $table) {
                $table->dropColumn('deleted_at');
            });
        }
    }
};
