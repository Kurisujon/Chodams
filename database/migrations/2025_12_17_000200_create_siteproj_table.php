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
                $table->decimal('land_area', 10, 2)->nullable();
                $table->integer('total_blocks')->default(0);
                $table->integer('total_lots')->default(0);
                $table->string('barangay')->nullable();
                $table->string('year_started', 4)->nullable();
                $table->text('description')->nullable();
                $table->string('proj_image')->nullable();
                $table->longText('geojson')->nullable();
                $table->longText('blocks_json')->nullable();
                $table->timestamps();
            });
        } else {
            if (!Schema::hasColumn('siteproj', 'geojson')) {
                Schema::table('siteproj', function (Blueprint $table) {
                    $table->longText('geojson')->nullable();
                });
            }
            if (!Schema::hasColumn('siteproj', 'blocks_json')) {
                Schema::table('siteproj', function (Blueprint $table) {
                    $table->longText('blocks_json')->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('siteproj');
    }
};

