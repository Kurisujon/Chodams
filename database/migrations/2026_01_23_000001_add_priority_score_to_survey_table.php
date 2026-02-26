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
        Schema::table('survey', function (Blueprint $table) {
            // Add priority_score column with default 0.00
            $table->decimal('priority_score', 5, 2)->default(0.00)->after('validator_signature');
            
            // Add score_calculated_at timestamp column (nullable)
            $table->timestamp('score_calculated_at')->nullable()->after('priority_score');
            
            // Add index on priority_score for sorting performance
            $table->index('priority_score');
            
            // Add composite index on priority_score and created_at for combined sorting
            $table->index(['priority_score', 'created_at'], 'survey_priority_score_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('survey_priority_score_created_at_index');
            $table->dropIndex(['priority_score']);
            
            // Drop columns
            $table->dropColumn(['priority_score', 'score_calculated_at']);
        });
    }
};
