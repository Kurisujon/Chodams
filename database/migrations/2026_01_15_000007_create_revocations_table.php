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
        Schema::create('revocations', function (Blueprint $table) {
            $table->increments('revocation_id');
            $table->unsignedInteger('survey_id');
            $table->unsignedInteger('project_id')->nullable();
            $table->string('lot_info', 255)->nullable();
            $table->json('violation_reasons');
            $table->text('remarks')->nullable();
            $table->string('documentation_path', 500)->nullable();
            $table->unsignedBigInteger('revoked_by');
            $table->timestamp('revoked_at')->useCurrent();
            $table->timestamps();

            // Foreign key to survey table
            $table->foreign('survey_id')
                  ->references('survey_id')
                  ->on('survey');

            // Foreign key to siteproj table
            $table->foreign('project_id')
                  ->references('project_id')
                  ->on('siteproj');

            // Foreign key to users table
            $table->foreign('revoked_by')
                  ->references('id')
                  ->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('revocations');
    }
};
