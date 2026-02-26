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
        Schema::create('hoa_members', function (Blueprint $table) {
            $table->increments('member_id');
            $table->unsignedInteger('hoa_id');
            $table->unsignedInteger('survey_id')->nullable();
            $table->string('name', 255);
            $table->string('contact_info', 255)->nullable();
            $table->timestamps();

            // Foreign key to hoa table with cascade delete
            $table->foreign('hoa_id')
                  ->references('hoa_id')
                  ->on('hoa')
                  ->onDelete('cascade');

            // Foreign key to survey table with set null on delete
            $table->foreign('survey_id')
                  ->references('survey_id')
                  ->on('survey')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hoa_members');
    }
};
