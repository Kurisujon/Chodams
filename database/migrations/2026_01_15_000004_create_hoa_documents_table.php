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
        Schema::create('hoa_documents', function (Blueprint $table) {
            $table->increments('document_id');
            $table->unsignedInteger('hoa_id');
            $table->string('document_name', 255);
            $table->enum('document_type', ['by-laws', 'minutes', 'resolution', 'other']);
            $table->string('file_path', 500);
            $table->unsignedInteger('file_size');
            $table->unsignedBigInteger('uploaded_by');
            $table->timestamps();

            // Foreign key to hoa table with cascade delete
            $table->foreign('hoa_id')
                  ->references('hoa_id')
                  ->on('hoa')
                  ->onDelete('cascade');

            // Foreign key to users table
            $table->foreign('uploaded_by')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hoa_documents');
    }
};
