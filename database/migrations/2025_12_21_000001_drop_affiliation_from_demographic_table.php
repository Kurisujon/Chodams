<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('demographic', function (Blueprint $table) {
            if (Schema::hasColumn('demographic', 'affiliation')) {
                $table->dropColumn('affiliation');
            }
        });
    }

    public function down(): void
    {
        Schema::table('demographic', function (Blueprint $table) {
            if (! Schema::hasColumn('demographic', 'affiliation')) {
                $table->string('affiliation')->nullable();
            }
        });
    }
};

