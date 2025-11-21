<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('validator')) {
            Schema::create('validator', function (Blueprint $table) {
                $table->bigIncrements('validator_id');
                $table->string('name')->nullable();
                $table->string('email')->nullable();
                $table->string('username')->unique();
                $table->string('password');
                $table->string('status')->default('approved');
                $table->longText('signature_data')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('validator');
    }
};