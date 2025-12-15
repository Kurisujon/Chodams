<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('training') && !Schema::hasColumn('training', 'person_photo')) {
            Schema::table('training', function (Blueprint $table) {
                $table->string('person_photo', 500)->nullable()->after('house_photo');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('training') && Schema::hasColumn('training', 'person_photo')) {
            Schema::table('training', function (Blueprint $table) {
                $table->dropColumn('person_photo');
            });
        }
    }
};
