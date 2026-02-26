<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Fix document_type column to support all HOA registration document types.
     */
    public function up(): void
    {
        // Change document_type from ENUM to VARCHAR to support all document types
        DB::statement("ALTER TABLE hoa_documents MODIFY COLUMN document_type VARCHAR(50) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original ENUM (note: this may fail if data doesn't match)
        DB::statement("ALTER TABLE hoa_documents MODIFY COLUMN document_type ENUM('by-laws', 'minutes', 'resolution', 'other') NOT NULL");
    }
};
