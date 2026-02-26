<?php

namespace Tests\Unit\Scoring;

use Tests\TestCase;
use App\Models\Survey;
use App\Services\BeneficiaryScoreService;
use App\Services\Scoring\ScoreCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

/**
 * Property-Based Test for Score Persistence Round Trip
 * 
 * Feature: beneficiary-scoring-system, Property 13: Score Persistence Round Trip
 * Validates: Requirements 10.2, 10.3
 * 
 * Property: For any beneficiary with calculated survey data, after computing and 
 * saving the Priority_Score to the database, retrieving the beneficiary should 
 * return the same score value.
 * 
 * This test validates that scores are correctly persisted to the database and 
 * can be retrieved without loss of precision or data corruption.
 */
class ScorePersistenceRoundTripPropertyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Property test: Calculated score persists correctly to database.
     * 
     * For any survey with valid data, after calculating and saving the score,
     * retrieving the survey from the database should return the exact same score.
     * 
     * @test
     */
    public function calculated_score_persists_correctly_to_database(): void
    {
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random survey data
            $surveyData = generateRandomSurveyData();
            
            // Create a survey with related data
            $survey = $this->createSurveyWithData($surveyData);
            
            // Calculate the expected score
            $calculator = new ScoreCalculator();
            $expectedScore = $calculator->calculateScore($surveyData);
            
            // Use the service to calculate and save the score
            $service = new BeneficiaryScoreService();
            $returnedScore = $service->calculateAndSave($survey);
            
            // Verify the returned score matches the expected score
            $this->assertEquals(
                $expectedScore,
                $returnedScore,
                sprintf(
                    'Iteration %d: Returned score (%.2f) should match calculated score (%.2f)',
                    $i,
                    $returnedScore,
                    $expectedScore
                )
            );
            
            // Retrieve the survey from the database (fresh query)
            $retrievedSurvey = Survey::find($survey->survey_id);
            
            // Verify the persisted score matches the calculated score
            $this->assertEquals(
                $expectedScore,
                (float) $retrievedSurvey->priority_score,
                sprintf(
                    'Iteration %d: Persisted score (%.2f) should match calculated score (%.2f)',
                    $i,
                    (float) $retrievedSurvey->priority_score,
                    $expectedScore
                )
            );
            
            // Verify score_calculated_at timestamp is set
            $this->assertNotNull(
                $retrievedSurvey->score_calculated_at,
                sprintf('Iteration %d: score_calculated_at should be set', $i)
            );
            
            // Clean up for next iteration
            $this->cleanupSurvey($survey->survey_id);
        }
    }

    /**
     * Property test: Score precision is maintained through persistence.
     * 
     * For any calculated score, the database should maintain precision to
     * at least 2 decimal places.
     * 
     * @test
     */
    public function score_precision_is_maintained_through_persistence(): void
    {
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random survey data
            $surveyData = generateRandomSurveyData();
            
            // Create a survey with related data
            $survey = $this->createSurveyWithData($surveyData);
            
            // Calculate and save the score
            $service = new BeneficiaryScoreService();
            $calculatedScore = $service->calculateAndSave($survey);
            
            // Retrieve the survey from the database
            $retrievedSurvey = Survey::find($survey->survey_id);
            
            // Verify precision is maintained (within 0.01 tolerance)
            $this->assertEqualsWithDelta(
                $calculatedScore,
                (float) $retrievedSurvey->priority_score,
                0.01,
                sprintf(
                    'Iteration %d: Score precision should be maintained. Calculated: %.2f, Retrieved: %.2f',
                    $i,
                    $calculatedScore,
                    (float) $retrievedSurvey->priority_score
                )
            );
            
            // Clean up for next iteration
            $this->cleanupSurvey($survey->survey_id);
        }
    }

    /**
     * Property test: Multiple save operations produce consistent results.
     * 
     * For any survey, calculating and saving the score multiple times
     * should always produce the same persisted value.
     * 
     * @test
     */
    public function multiple_save_operations_produce_consistent_results(): void
    {
        $iterations = 5;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random survey data
            $surveyData = generateRandomSurveyData();
            
            // Create a survey with related data
            $survey = $this->createSurveyWithData($surveyData);
            
            // Calculate and save the score multiple times
            $service = new BeneficiaryScoreService();
            $scores = [];
            
            for ($j = 0; $j < 5; $j++) {
                $score = $service->calculateAndSave($survey);
                $scores[] = $score;
                
                // Refresh the survey model
                $survey = Survey::find($survey->survey_id);
            }
            
            // All scores should be identical
            $firstScore = $scores[0];
            foreach ($scores as $index => $score) {
                $this->assertEquals(
                    $firstScore,
                    $score,
                    sprintf(
                        'Iteration %d, Save %d: All save operations should produce the same score. Expected: %.2f, Got: %.2f',
                        $i,
                        $index,
                        $firstScore,
                        $score
                    )
                );
            }
            
            // Verify the final persisted score matches
            $finalSurvey = Survey::find($survey->survey_id);
            $this->assertEquals(
                $firstScore,
                (float) $finalSurvey->priority_score,
                sprintf(
                    'Iteration %d: Final persisted score should match all calculated scores',
                    $i
                )
            );
            
            // Clean up for next iteration
            $this->cleanupSurvey($survey->survey_id);
        }
    }

    /**
     * Property test: Score retrieval is independent of calculation.
     * 
     * For any survey with a persisted score, retrieving the survey should
     * return the score without requiring recalculation.
     * 
     * @test
     */
    public function score_retrieval_is_independent_of_calculation(): void
    {
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random survey data
            $surveyData = generateRandomSurveyData();
            
            // Create a survey with related data
            $survey = $this->createSurveyWithData($surveyData);
            
            // Calculate and save the score
            $service = new BeneficiaryScoreService();
            $calculatedScore = $service->calculateAndSave($survey);
            
            // Clear any cached data
            Survey::flushEventListeners();
            
            // Retrieve the survey using a fresh query
            $retrievedSurvey = DB::table('survey')
                ->where('survey_id', $survey->survey_id)
                ->first();
            
            // Verify the score is available directly from the database
            $this->assertNotNull(
                $retrievedSurvey->priority_score,
                sprintf('Iteration %d: Score should be available in database', $i)
            );
            
            $this->assertEquals(
                $calculatedScore,
                (float) $retrievedSurvey->priority_score,
                sprintf(
                    'Iteration %d: Retrieved score should match calculated score without recalculation',
                    $i
                )
            );
            
            // Clean up for next iteration
            $this->cleanupSurvey($survey->survey_id);
        }
    }

    /**
     * Property test: Score persists with missing data.
     * 
     * For any survey with incomplete data, the calculated score (which may be 0
     * or partial) should still persist correctly.
     * 
     * @test
     */
    public function score_persists_with_missing_data(): void
    {
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate survey data with missing fields
            $surveyData = generateSurveyDataWithMissingFields();
            
            // Create a survey with related data
            $survey = $this->createSurveyWithData($surveyData);
            
            // Calculate the expected score
            $calculator = new ScoreCalculator();
            $expectedScore = $calculator->calculateScore($surveyData);
            
            // Use the service to calculate and save the score
            $service = new BeneficiaryScoreService();
            $returnedScore = $service->calculateAndSave($survey);
            
            // Verify the returned score matches the expected score
            $this->assertEquals(
                $expectedScore,
                $returnedScore,
                sprintf(
                    'Iteration %d: Returned score should match calculated score even with missing data',
                    $i
                )
            );
            
            // Retrieve the survey from the database
            $retrievedSurvey = Survey::find($survey->survey_id);
            
            // Verify the persisted score matches
            $this->assertEquals(
                $expectedScore,
                (float) $retrievedSurvey->priority_score,
                sprintf(
                    'Iteration %d: Persisted score should match calculated score even with missing data',
                    $i
                )
            );
            
            // Clean up for next iteration
            $this->cleanupSurvey($survey->survey_id);
        }
    }

    /**
     * Property test: Score timestamp is updated on recalculation.
     * 
     * For any survey, when the score is recalculated, the score_calculated_at
     * timestamp should be updated.
     * 
     * @test
     */
    public function score_timestamp_is_updated_on_recalculation(): void
    {
        $iterations = 3;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random survey data
            $surveyData = generateRandomSurveyData();
            
            // Create a survey with related data
            $survey = $this->createSurveyWithData($surveyData);
            
            // Calculate and save the score
            $service = new BeneficiaryScoreService();
            $service->calculateAndSave($survey);
            
            // Get the first timestamp
            $survey->refresh();
            $firstTimestamp = $survey->score_calculated_at;
            
            $this->assertNotNull(
                $firstTimestamp,
                sprintf('Iteration %d: First timestamp should be set', $i)
            );
            
            // Wait a moment to ensure timestamp difference
            sleep(1);
            
            // Recalculate the score
            $service->calculateAndSave($survey);
            
            // Get the second timestamp
            $survey->refresh();
            $secondTimestamp = $survey->score_calculated_at;
            
            $this->assertNotNull(
                $secondTimestamp,
                sprintf('Iteration %d: Second timestamp should be set', $i)
            );
            
            // Verify the timestamp was updated
            $this->assertGreaterThan(
                $firstTimestamp,
                $secondTimestamp,
                sprintf(
                    'Iteration %d: Timestamp should be updated on recalculation',
                    $i
                )
            );
            
            // Clean up for next iteration
            $this->cleanupSurvey($survey->survey_id);
        }
    }

    /**
     * Helper method to create a survey with related data
     * 
     * @param array $surveyData
     * @return Survey
     */
    private function createSurveyWithData(array $surveyData): Survey
    {
        // Create the survey record
        $survey = new Survey();
        $survey->validator_id = 1;
        $survey->interviewed_by = 'Test Interviewer';
        $survey->date_interviewed = now();
        $survey->is_submitted = 1;
        $survey->save();
        
        // Create classification data if present
        if (isset($surveyData['classification'])) {
            $classificationMap = [
                'Displaced' => 1,
                'Double-up' => 2,
                'Homeless' => 3,
                'Upgrading of land tenure' => 4,
            ];
            
            DB::table('classification')->insert([
                'survey_id' => $survey->survey_id,
                'classification' => $classificationMap[$surveyData['classification']] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Create household data
        DB::table('household')->insert([
            'survey_id' => $survey->survey_id,
            'lot_ownership' => isset($surveyData['owns_lot']) && $surveyData['owns_lot'] ? 'Owned' : 'Rented',
            'house_ownership' => isset($surveyData['owns_house']) && $surveyData['owns_house'] ? 'Owned' : 'Rented',
            'temporary_living_area' => isset($surveyData['temporary_housing']) && $surveyData['temporary_housing'] ? 'Yes' : 'No',
            'housing_structure' => $surveyData['house_structure'] ?? null,
            'type_of_toilet' => $surveyData['toilet_type'] ?? null,
            'source_of_water' => $surveyData['water_source'] ?? null,
            'source_of_electricity' => $surveyData['electricity_source'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Create economic data if income range is present
        if (isset($surveyData['income_range'])) {
            // Map income range to a numeric value
            $incomeMap = [
                '0-2999' => 1500,
                '3000-5999' => 4500,
                '6000-8999' => 7500,
                '9000-12999' => 10500,
                '13000+' => 15000,
            ];
            
            DB::table('economic')->insert([
                'survey_id' => $survey->survey_id,
                'combine_monthly_income' => $incomeMap[$surveyData['income_range']] ?? 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        return $survey;
    }

    /**
     * Helper method to clean up survey and related data
     * 
     * @param int $surveyId
     * @return void
     */
    private function cleanupSurvey(int $surveyId): void
    {
        DB::table('classification')->where('survey_id', $surveyId)->delete();
        DB::table('household')->where('survey_id', $surveyId)->delete();
        DB::table('economic')->where('survey_id', $surveyId)->delete();
        DB::table('survey')->where('survey_id', $surveyId)->delete();
    }
}
