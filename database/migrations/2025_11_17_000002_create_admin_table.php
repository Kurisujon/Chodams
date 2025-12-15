<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('admin')) {
            Schema::create('admin', function (Blueprint $table) {
                $table->increments('id');
                $table->string('username')->unique();
                $table->string('email')->nullable();
                $table->string('password');
                $table->timestamps();
            });

            $exists = DB::table('admin')->count();
            if ($exists === 0) {
                DB::table('admin')->insert([
                    'username' => 'admin',
                    'email' => 'admin@example.com',
                    'password' => Hash::make('admin12345'),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('admin');
    }
};

