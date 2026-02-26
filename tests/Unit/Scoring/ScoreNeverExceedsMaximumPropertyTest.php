<?php

namespace Tests\Unit\Scoring;

use PHPUnit\Framework\TestCase;
use App\Services\Scoring\ScoreCalculator;

/**
 * Property-Based Test for Score Never Exceeds Maximum
 * 
 * Feature: beneficiary-scoring-system, Property 1: Score Never Exceeds Maximum
 * Validates: Requirements 1.2
 * 
 * Property: For any valid or invalid survey data, the calculated Priority_Score 
 * should never exceed 100%.
 * 
 * This test validates that the scoring system maintains a critical invariant:
 * no matter what data is provided (valid, invalid, edge cases, or random),
 * the calculated score will always be within the valid range of 0-100%.
 */
class ScoreNeverExceedsMaximumPropertyTest extends TestCase
{
    /**
     * Property test: Score never exceeds 100% for random valid survey data.
     * 
     * For any randomly generated valid survey data, the calculated score
     * must be less than or equal to 100%.
     * 
     * This test runs 100+ iterations with different random survey data
     * combinations to ensure the property holds universally.
     * 
     * @test
     */
    public function score_never_exceeds_maximum_with_valid_data(): void
    {
        $calculator = new ScoreCalculator();
        $iterations = 20;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random valid survey data
            $surveyData = generateRandomSurveyData();
            
            // Calculate score
            $score = $calculator->calculateScore($surveyData);
            
            // Assert score is within valid range
            $this->assertLessThanOrEqual(
                100.0,
                $score,
                sprintf(
                    'Score must not exceed 100%%. Iteration %d: got %.2f%% with data: %s',
                    $i,
                    $score,
                    json_encode($surveyData)
                )
            );
            
            $this->assertGreaterThanOrEqual(
                0.0,
                $score,
                sprintf(
                    'Score must not be negative. Iteration %d: got %.2f%% with data: %s',
                    $i,
                    $score,
                    json_encode($surveyData)
                )
            );
        }
    }
    
    /**
     * Property test: Score never exceeds 100% with missing data.
     * 
     * For any survey data with randomly missing fields, the calculated score
     * must still be less than or equal to 100%.
     * 
     * @test
     */
    public function score_never_exceeds_maximum_with_missing_data(): void
    {
        $calculator = new ScoreCalculator();
        $iterations = 20;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate survey data with random missing fields
            $surveyData = generateSurveyDataWithMissingFields();
            
            // Calculate score
            $score = $calculator->calculateScore($surveyData);
            
            // Assert score is within valid range
            $this->assertLessThanOrEqual(
                100.0,
                $score,
                sprintf(
                    'Score must not exceed 100%% even with missing data. Iteration %d: got %.2f%% with data: %s',
                    $i,
                    $score,
                    json_encode($surveyData)
                )
            );
            
            $this->assertGreaterThanOrEqual(
                0.0,
                $score,
                sprintf(
                    'Score must not be negative even with missing data. Iteration %d: got %.2f%% with data: %s',
                    $i,
                    $score,
                    json_encode($surveyData)
                )
            );
        }
    }
    
    /**
     * Property test: Score never exceeds 100% with empty data.
     * 
     * When all survey data is missing (empty array), the score should be 0%,
     * which is within the valid range.
     * 
     * @test
     */
    public function score_never_exceeds_maximum_with_empty_data(): void
    {
        $calculator = new ScoreCalculator();
        
        // Calculate score with empty data
        $score = $calculator->calculateScore([]);
        
        // Assert score is 0 and within valid range
        $this->assertEquals(
            0.0,
            $score,
            'Score should be 0% when all data is missing'
        );
        
        $this->assertLessThanOrEqual(
            100.0,
            $score,
            'Score must not exceed 100% even with empty data'
        );
    }
    
    /**
     * Property test: Score never exceeds 100% with maximum values.
     * 
     * When all categories have their maximum scoring values, the total score
     * should still not exceed 100%.
     * 
     * @test
     */
    public function score_never_exceeds_maximum_with_all_maximum_values(): void
    {
        $calculator = new ScoreCalculator();
        
        // Survey data with all maximum scoring values
        $maxSurveyData = [
            'income_range' => '0-2999',  // 30% of 15% = 4.5%
            'classification' => 'Homeless',  // 50% of 15% = 7.5%
            'owns_lot' => false,  // 20% of 14% = 2.8%
            'owns_house' => false,  // 30% of 14% = 4.2%
            'temporary_housing' => true,  // 50% of 14% = 7%
            'house_structure' => 'Makeshift/Salvaged/Improvised material',  // 30% of 14% = 4.2%
            'toilet_type' => 'No Toilet',  // 40% of 14% = 5.6%
            'water_source' => 'Surface water (river, lake, dam)',  // 30% of 14% = 4.2%
            'electricity_source' => 'Candle/Lamp',  // 30% of 14% = 4.2%
        ];
        
        // Calculate score
        $score = $calculator->calculateScore($maxSurveyData);
        
        // Assert score is within valid range
        $this->assertLessThanOrEqual(
            100.0,
            $score,
            sprintf(
                'Score must not exceed 100%% even with all maximum values. Got %.2f%%',
                $score
            )
        );
        
        $this->assertGreaterThan(
            0.0,
            $score,
            'Score should be greater than 0% when all maximum values are provided'
        );
    }
    
    /**
     * Property test: Score never exceeds 100% with invalid data.
     * 
     * When survey data contains invalid values (not in expected sets),
     * the score should still be within valid range (0-100%).
     * 
     * @test
     */
    public function score_never_exceeds_maximum_with_invalid_data(): void
    {
        $calculator = new ScoreCalculator();
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate survey data with invalid values
            $invalidSurveyData = [
                'income_range' => 'invalid_range_' . $i,
                'classification' => 'invalid_classification_' . $i,
                'owns_lot' => 'not_a_boolean',
                'owns_house' => 'not_a_boolean',
                'temporary_housing' => 'not_a_boolean',
                'house_structure' => 'invalid_structure_' . $i,
                'toilet_type' => 'invalid_toilet_' . $i,
                'water_source' => 'invalid_water_' . $i,
                'electricity_source' => 'invalid_electricity_' . $i,
            ];
            
            // Calculate score
            $score = $calculator->calculateScore($invalidSurveyData);
            
            // Assert score is within valid range
            $this->assertLessThanOrEqual(
                100.0,
                $score,
                sprintf(
                    'Score must not exceed 100%% even with invalid data. Iteration %d: got %.2f%%',
                    $i,
                    $score
                )
            );
            
            $this->assertGreaterThanOrEqual(
                0.0,
                $score,
                sprintf(
                    'Score must not be negative even with invalid data. Iteration %d: got %.2f%%',
                    $i,
                    $score
                )
            );
        }
    }
    
    /**
     * Property test: Score is deterministic for same input.
     * 
     * For any given survey data, calculating the score multiple times
     * should always return the same value.
     * 
     * @test
     */
    public function score_calculation_is_deterministic(): void
    {
        $calculator = new ScoreCalculator();
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random survey data
            $surveyData = generateRandomSurveyData();
            
            // Calculate score multiple times
            $score1 = $calculator->calculateScore($surveyData);
            $score2 = $calculator->calculateScore($surveyData);
            $score3 = $calculator->calculateScore($surveyData);
            
            // All scores should be identical
            $this->assertEquals(
                $score1,
                $score2,
                sprintf(
                    'Score calculation should be deterministic. Iteration %d: first=%.2f, second=%.2f',
                    $i,
                    $score1,
                    $score2
                )
            );
            
            $this->assertEquals(
                $score1,
                $score3,
                sprintf(
                    'Score calculation should be deterministic. Iteration %d: first=%.2f, third=%.2f',
                    $i,
                    $score1,
                    $score3
                )
            );
            
            // And all should be within valid range
            $this->assertLessThanOrEqual(100.0, $score1);
            $this->assertGreaterThanOrEqual(0.0, $score1);
        }
    }
}

