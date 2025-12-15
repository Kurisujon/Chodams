<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('demographic', function (Blueprint $table) {
            if (!Schema::hasColumn('demographic', 'endorsed_by_mayor')) {
                $table->tinyInteger('endorsed_by_mayor')->nullable()->default(0);
            }
            if (!Schema::hasColumn('demographic', 'affiliations')) {
                $table->string('affiliations')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('demographic', function (Blueprint $table) {
            if (Schema::hasColumn('demographic', 'endorsed_by_mayor')) {
                $table->dropColumn('endorsed_by_mayor');
            }
            if (Schema::hasColumn('demographic', 'affiliations')) {
                $table->dropColumn('affiliations');
            }
        });
    }
};
