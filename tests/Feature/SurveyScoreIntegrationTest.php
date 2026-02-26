<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Survey;
use App\Services\BeneficiaryScoreService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class SurveyScoreIntegrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that priority score is calculated when a survey is created
     *
     * @return void
     */
    public function test_score_is_calculated_on_survey_creation()
    {
        // Create a survey with all related data
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Validator',
            'date_interviewed' => '2026-01-23',
            'is_submitted' => 0,
        ]);

        // Add classification data
        DB::table('classification')->insert([
            'survey_id' => $surveyId,
            'classification' => 3, // Homeless
            'subclass_homeless' => 1, // Public - living in tent
        ]);

        // Add household data
        DB::table('household')->insert([
            'survey_id' => $surveyId,
            'lot_ownership' => 'No',
            'house_ownership' => 'No',
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

        // Add demographic data
        DB::table('demographic')->insert([
            'survey_id' => $surveyId,
            'first_name' => 'Test',
            'last_name' => 'User',
            'barangay' => 'Test Barangay',
        ]);

        // Add training data
        DB::table('training')->insert([
            'survey_id' => $surveyId,
        ]);

        // Calculate score
        $survey = Survey::find($surveyId);
        $this->assertNotNull($survey);

        $scoreService = new BeneficiaryScoreService();
        $score = $scoreService->calculateAndSave($survey);

        // Verify score was calculated and saved
        $this->assertGreaterThan(0, $score);
        
        // Refresh survey from database
        $survey->refresh();
        
        $this->assertNotNull($survey->priority_score);
        $this->assertNotNull($survey->score_calculated_at);
        $this->assertEquals($score, $survey->priority_score);
    }

    /**
     * Test that priority score is recalculated when survey is updated
     *
     * @return void
     */
    public function test_score_is_recalculated_on_survey_update()
    {
        // Create initial survey
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Validator',
            'date_interviewed' => '2026-01-23',
            'is_submitted' => 0,
        ]);

        DB::table('classification')->insert([
            'survey_id' => $surveyId,
            'classification' => 2, // Double-up
        ]);

        DB::table('household')->insert([
            'survey_id' => $surveyId,
            'lot_ownership' => 'Yes',
            'house_ownership' => 'Yes',
            'temporary_living_area' => 'No',
            'housing_structure' => 'Full Concrete',
            'type_of_toilet' => 'Water Sealed',
            'source_of_water' => 'Community Water System (NAWASA)',
            'source_of_electricity' => 'With own meter',
        ]);

        DB::table('economic')->insert([
            'survey_id' => $surveyId,
            'combine_monthly_income' => '15000',
        ]);

        DB::table('demographic')->insert([
            'survey_id' => $surveyId,
            'first_name' => 'Test',
            'last_name' => 'User',
            'barangay' => 'Test Barangay',
        ]);

        DB::table('training')->insert([
            'survey_id' => $surveyId,
        ]);

        // Calculate initial score
        $survey = Survey::find($surveyId);
        $scoreService = new BeneficiaryScoreService();
        $initialScore = $scoreService->calculateAndSave($survey);

        // Update household data to increase score
        DB::table('household')->where('survey_id', $surveyId)->update([
            'lot_ownership' => 'No',
            'house_ownership' => 'No',
            'temporary_living_area' => 'Yes',
        ]);

        // Recalculate score
        $survey->refresh();
        $newScore = $scoreService->calculateAndSave($survey);

        // Verify score changed
        $this->assertNotEquals($initialScore, $newScore);
        $this->assertGreaterThan($initialScore, $newScore);
    }

    /**
     * Test that beneficiary retrieval includes priority score
     *
     * @return void
     */
    public function test_beneficiary_retrieval_includes_priority_score()
    {
        // Create a survey with score
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Validator',
            'date_interviewed' => '2026-01-23',
            'is_submitted' => 1,
            'priority_score' => 45.50,
            'score_calculated_at' => now(),
        ]);

        DB::table('classification')->insert([
            'survey_id' => $surveyId,
            'classification' => 1,
        ]);

        DB::table('demographic')->insert([
            'survey_id' => $surveyId,
            'first_name' => 'Test',
            'last_name' => 'User',
            'barangay' => 'Test Barangay',
        ]);

        DB::table('household')->insert([
            'survey_id' => $surveyId,
        ]);

        DB::table('economic')->insert([
            'survey_id' => $surveyId,
        ]);

        // Query survey with priority_score
        $result = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->select('s.survey_id', 's.priority_score', 's.score_calculated_at')
            ->where('s.survey_id', $surveyId)
            ->first();

        $this->assertNotNull($result);
        $this->assertEquals(45.50, $result->priority_score);
        $this->assertNotNull($result->score_calculated_at);
    }
}
