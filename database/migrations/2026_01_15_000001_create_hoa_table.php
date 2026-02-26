<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('hoa', function (Blueprint $table) {
            $table->increments('hoa_id');
            $table->unsignedInteger('project_id');
            $table->string('hoa_name', 255);
            $table->string('hoa_image', 255)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            // Foreign key to siteproj table
            $table->foreign('project_id')
                  ->references('project_id')
                  ->on('siteproj')
                  ->onDelete('cascade');

            // Unique constraint for hoa_name per project (including soft deleted records)
            $table->unique(['project_id', 'hoa_name', 'deleted_at'], 'unique_hoa_per_project');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hoa');
    }
};
