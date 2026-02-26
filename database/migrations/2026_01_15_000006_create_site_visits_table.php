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
        Schema::create('site_visits', function (Blueprint $table) {
            $table->increments('visit_id');
            $table->unsignedInteger('project_id')->nullable();
            $table->unsignedInteger('hoa_id')->nullable();
            $table->date('scheduled_date');
            $table->string('assigned_staff', 255);
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
            $table->text('visit_notes')->nullable();
            $table->text('findings')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Foreign key to siteproj table
            $table->foreign('project_id')
                  ->references('project_id')
                  ->on('siteproj')
                  ->onDelete('cascade');

            // Foreign key to hoa table
            $table->foreign('hoa_id')
                  ->references('hoa_id')
                  ->on('hoa')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_visits');
    }
};
