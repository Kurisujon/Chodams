<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('survey')) {
            Schema::create('survey', function (Blueprint $table) {
                $table->increments('survey_id');
                $table->unsignedBigInteger('validator_id')->index();
                $table->string('interviewed_by')->nullable();
                $table->date('date_interviewed')->nullable();
                $table->tinyInteger('is_submitted')->default(0);
                $table->longText('validator_signature')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('classification')) {
            Schema::create('classification', function (Blueprint $table) {
                $table->increments('classification_id');
                $table->unsignedInteger('survey_id')->index();
                $table->tinyInteger('previous_client')->nullable();
                $table->integer('year_inhabited')->nullable();
                $table->tinyInteger('classification')->nullable();
                $table->integer('subclass_displaced')->nullable();
                $table->integer('subclass_doubleup')->nullable();
                $table->integer('subclass_homeless')->nullable();
            });
        }

        if (!Schema::hasTable('demographic')) {
            Schema::create('demographic', function (Blueprint $table) {
                $table->increments('demographic_id');
                $table->unsignedInteger('survey_id')->unique();
                $table->string('interview_person')->nullable();
                $table->string('last_name')->nullable();
                $table->string('first_name')->nullable();
                $table->string('middle_name')->nullable();
                $table->string('suffix')->nullable();
                $table->string('barangay')->nullable();
                $table->string('purok')->nullable();
                $table->string('street')->nullable();
                $table->string('gender')->nullable();
                $table->string('religion')->nullable();
                $table->string('birth_place')->nullable();
                $table->date('birth_date')->nullable();
                $table->integer('person_age')->nullable();
                $table->string('marital_status')->nullable();
                $table->string('contact_number')->nullable();
                $table->string('language_spoken')->nullable();
                $table->string('tribe')->nullable();
                $table->string('highest_education')->nullable();
                $table->string('last_school_name')->nullable();
                $table->integer('year_graduated')->nullable();
                $table->string('spouse_name')->nullable();
                $table->string('spouse_religion')->nullable();
                $table->string('spouse_tribe')->nullable();
                $table->integer('spouse_age')->nullable();
                $table->tinyInteger('spouse_gender')->nullable();
                $table->tinyInteger('affiliation')->nullable()->default(0);
                $table->string('tag_number', 10)->nullable()->unique();
            });
        }

        if (!Schema::hasTable('household')) {
            Schema::create('household', function (Blueprint $table) {
                $table->increments('household_id');
                $table->unsignedInteger('survey_id')->index();
                $table->string('lot_ownership')->nullable();
                $table->string('house_ownership')->nullable();
                $table->string('avail_socialized_housing')->nullable();
                $table->string('temporary_living_area')->nullable();
                $table->string('housing_structure')->nullable();
                $table->string('type_of_toilet')->nullable();
                $table->string('source_of_water')->nullable();
                $table->string('source_of_electricity')->nullable();
            });
        }

        if (!Schema::hasTable('economic')) {
            Schema::create('economic', function (Blueprint $table) {
                $table->increments('economic_id');
                $table->unsignedInteger('survey_id')->index();
                $table->string('main_income_source')->nullable();
                $table->string('work_status')->nullable();
                $table->string('work_location_head')->nullable();
                $table->string('monthly_salary')->nullable();
                $table->string('combine_monthly_income')->nullable();
            });
        }

        if (!Schema::hasTable('training')) {
            Schema::create('training', function (Blueprint $table) {
                $table->increments('training_id');
                $table->unsignedInteger('survey_id')->index();
                $table->string('skills_for_living')->nullable();
                $table->string('specific_skill')->nullable();
                $table->string('organization_member')->nullable();
                $table->string('specific_organization')->nullable();
                $table->string('house_photo')->nullable();
                $table->string('person_photo')->nullable();
                $table->string('wanttolearn')->nullable();
                $table->text('remarks')->nullable();
                $table->string('latitude')->nullable();
                $table->string('longitude')->nullable();
                $table->longText('respondent_signature')->nullable();
            });
        }

        if (!Schema::hasTable('household_mem')) {
            Schema::create('household_mem', function (Blueprint $table) {
                $table->increments('member_id');
                $table->unsignedInteger('survey_id')->index();
                $table->string('name')->nullable();
                $table->integer('age')->nullable();
                $table->string('relationship')->nullable();
                $table->string('occupation')->nullable();
                $table->string('gender')->nullable();
                $table->string('civil_status')->nullable();
                $table->string('educational_attainment')->nullable();
                $table->string('monthly_income')->nullable();
                $table->string('code')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('household_mem');
        Schema::dropIfExists('training');
        Schema::dropIfExists('economic');
        Schema::dropIfExists('household');
        Schema::dropIfExists('demographic');
        Schema::dropIfExists('classification');
        Schema::dropIfExists('survey');
    }
};

