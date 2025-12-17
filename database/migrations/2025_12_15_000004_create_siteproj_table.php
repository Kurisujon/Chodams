<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('siteproj')) {
            Schema::create('siteproj', function (Blueprint $table) {
                $table->increments('project_id');
                $table->string('project_name');
                $table->decimal('land_area', 15, 2)->nullable();
                $table->integer('total_blocks')->nullable();
                $table->integer('total_lots')->nullable();
                $table->string('barangay', 100)->nullable();
                $table->string('year_started', 4)->nullable();
                $table->text('description')->nullable();
                $table->string('proj_image')->nullable();
                $table->longText('geojson')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('siteproj');
    }
};

