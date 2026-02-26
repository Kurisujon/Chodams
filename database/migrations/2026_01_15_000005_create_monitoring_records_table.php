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
        Schema::create('monitoring_records', function (Blueprint $table) {
            $table->increments('record_id');
            $table->unsignedInteger('survey_id');
            $table->date('visit_date');
            $table->enum('status', ['not_occupied', 'house_constructed', 'under_construction', 'vacant', 'other']);
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            // Foreign key to survey table
            $table->foreign('survey_id')
                  ->references('survey_id')
                  ->on('survey')
                  ->onDelete('cascade');

            // Foreign key to users table
            $table->foreign('created_by')
                  ->references('id')
                  ->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monitoring_records');
    }
};
