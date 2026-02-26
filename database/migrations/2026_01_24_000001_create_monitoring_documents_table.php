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
        Schema::create('monitoring_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('monitoring_record_id');
            $table->string('original_filename', 255);
            $table->string('stored_filename', 255);
            $table->string('file_path', 500);
            $table->unsignedInteger('file_size');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('uploaded_by');
            $table->timestamps();

            // Foreign key to monitoring_records table with CASCADE delete
            $table->foreign('monitoring_record_id')
                  ->references('record_id')
                  ->on('monitoring_records')
                  ->onDelete('cascade');

            // Foreign key to users table with RESTRICT delete
            $table->foreign('uploaded_by')
                  ->references('id')
                  ->on('users')
                  ->onDelete('restrict');

            // Indexes for performance
            $table->index('monitoring_record_id');
            $table->index('uploaded_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monitoring_documents');
    }
};
