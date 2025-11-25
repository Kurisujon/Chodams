<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->increments('assignment_id');
            $table->unsignedInteger('survey_id');
            $table->unsignedInteger('project_id');
            $table->string('block_no', 50)->nullable();
            $table->string('lot_no', 50)->nullable();
            $table->timestamp('date_assigned')->useCurrent();
            $table->index('survey_id');
            $table->index('project_id');
            $table->unique('survey_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};