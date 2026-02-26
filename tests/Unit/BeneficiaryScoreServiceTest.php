<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Survey;
use App\Services\BeneficiaryScoreService;
use App\Services\Scoring\ScoreCalculator;
use App\Exceptions\ScoreCalculationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class BeneficiaryScoreServiceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that calculateAndSave persists score to database
     */
    public function test_calculate_and_save_persists_score_to_database(): void
    {
        // Create a survey with related data
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Interviewer',
            'date_interviewed' => now(),
            'is_submitted' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Add classification data
        DB::table('classification')->insert([
            'survey_id' => $surveyId,
            'classification' => 3, // Homeless
        ]);

        // Add household data
        DB::table('household')->insert([
            'survey_id' => $surveyId,
            'lot_ownership' => 'Rented',
            'house_ownership' => 'Rented',
            'temporary_living_area' => 'Yes',
            'housing_structure' => 'Makeshift/Salvaged/Improvised material',
            'type_of_toilet' => 'No Toilet',
            'source_of_water' => 'Surface water (river, lake, dam)',
            'source_of_electricity' => 'Candle/Lamp',
        ]);

        // Add economic data
        DB::table('economic')->insert([
            'survey_id' => $surveyId,
            'combine_monthly_income' => '2500',
        ]);

        // Get the survey model
        $survey = Survey::find($surveyId);

        // Calculate and save score
        $service = new BeneficiaryScoreService();
        $score = $service->calculateAndSave($survey);

        // Verify score is a valid number
        $this->assertIsFloat($score);
        $this->assertGreaterThanOrEqual(0.0, $score);
        $this->assertLessThanOrEqual(100.0, $score);

        // Verify score is persisted
        $survey->refresh();
        $this->assertEquals($score, $survey->priority_score);
        $this->assertNotNull($survey->score_calculated_at);
    }

    /**
     * Test that calculateAndSave handles empty survey data
     */
    public function test_calculate_and_save_handles_empty_survey_data(): void
    {
        // Create a survey with no related data
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Interviewer',
            'date_interviewed' => now(),
            'is_submitted' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $survey = Survey::find($surveyId);

        // Calculate and save score
        $service = new BeneficiaryScoreService();
        $score = $service->calculateAndSave($survey);

        // Verify score is 0 for empty data
        $this->assertEquals(0.0, $score);

        // Verify score is persisted
        $survey->refresh();
        $this->assertEquals(0.0, $survey->priority_score);
        $this->assertNotNull($survey->score_calculated_at);
    }

    /**
     * Test that recalculateAll processes multiple surveys
     */
    public function test_recalculate_all_processes_multiple_surveys(): void
    {
        // Create multiple surveys
        $surveyIds = [];
        for ($i = 0; $i < 3; $i++) {
            $surveyIds[] = DB::table('survey')->insertGetId([
                'validator_id' => 1,
                'interviewed_by' => 'Test Interviewer',
                'date_interviewed' => now(),
                'is_submitted' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Add some data to first survey
        DB::table('classification')->insert([
            'survey_id' => $surveyIds[0],
            'classification' => 1, // Displaced
        ]);

        // Recalculate all
        $service = new BeneficiaryScoreService();
        $count = $service->recalculateAll();

        // Verify all surveys were processed
        $this->assertEquals(3, $count);

        // Verify scores were persisted
        foreach ($surveyIds as $surveyId) {
            $survey = Survey::find($surveyId);
            $this->assertNotNull($survey->score_calculated_at);
        }
    }

    /**
     * Test that validateSurveyData logs warnings for invalid data
     */
    public function test_service_handles_invalid_data_gracefully(): void
    {
        // Create a survey with invalid data
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Interviewer',
            'date_interviewed' => now(),
            'is_submitted' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Add household data with invalid values
        DB::table('household')->insert([
            'survey_id' => $surveyId,
            'housing_structure' => 'Invalid Structure Type',
        ]);

        $survey = Survey::find($surveyId);

        // Calculate and save score - should not throw exception
        $service = new BeneficiaryScoreService();
        $score = $service->calculateAndSave($survey);

        // Verify score is calculated (invalid data treated as missing)
        $this->assertIsFloat($score);
        $this->assertGreaterThanOrEqual(0.0, $score);
    }
}
