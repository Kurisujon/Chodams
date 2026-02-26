<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds documents_path column to monitoring_records table to store file paths
     * directly in the table, matching the pattern used by the revocations feature.
     * 
     * Requirements: 1.1, 1.2, 1.3
     */
    public function up(): void
    {
        Schema::table('monitoring_records', function (Blueprint $table) {
            $table->string('documents_path', 500)->nullable()->after('remarks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monitoring_records', function (Blueprint $table) {
            $table->dropColumn('documents_path');
        });
    }
};
