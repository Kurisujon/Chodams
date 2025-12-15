<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('demographic', function (Blueprint $table) {
            if (!Schema::hasColumn('demographic', 'tag_number')) {
                $table->string('tag_number', 10)->nullable()->unique();
            }
        });
    }

    public function down(): void
    {
        Schema::table('demographic', function (Blueprint $table) {
            if (Schema::hasColumn('demographic', 'tag_number')) {
                $table->dropUnique('demographic_tag_number_unique');
                $table->dropColumn('tag_number');
            }
        });
    }
};

