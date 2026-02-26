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
        Schema::create('hoa_officers', function (Blueprint $table) {
            $table->increments('officer_id');
            $table->unsignedInteger('hoa_id');
            $table->string('name', 255);
            $table->string('position', 100);
            $table->string('phone_number', 20);
            $table->date('period_start');
            $table->date('period_end');
            $table->text('remarks')->nullable();
            $table->timestamps();

            // Foreign key to hoa table with cascade delete
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
        Schema::dropIfExists('hoa_officers');
    }
};
