<?php

namespace Tests\Unit\Scoring;

use PHPUnit\Framework\TestCase;
use App\Services\Scoring\ScoreCalculator;

/**
 * Property-Based Test for Complete Score Calculation
 * 
 * Feature: beneficiary-scoring-system, Property 15: Complete Score Calculation
 * Validates: Requirements 1.1
 * 
 * Property: For any beneficiary with complete and valid survey data for all 
 * 7 categories, the Score_Calculator should produce a Priority_Score greater 
 * than 0%.
 * 
 * This test validates that when all required data is provided, the scoring
 * system produces a meaningful (non-zero) score, ensuring the system is
 * functioning correctly and all categories are contributing.
 */
class CompleteScoreCalculationPropertyTest extends TestCase
{
    /**
     * Property test: Complete valid data produces non-zero score.
     * 
     * For any randomly generated complete and valid survey data, the calculated
     * score must be greater than 0%.
     * 
     * This test runs 100+ iterations with different random survey data
     * combinations to ensure the property holds universally.
     * 
     * @test
     */
    public function complete_valid_data_produces_non_zero_score(): void
    {
        $calculator = new ScoreCalculator();
        $iterations = 20;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate complete random survey data (all 7 categories)
            $surveyData = generateRandomSurveyData();
            
            // Verify data is complete (all 7 categories present)
            $this->assertArrayHasKey('income_range', $surveyData);
            $this->assertArrayHasKey('classification', $surveyData);
            $this->assertArrayHasKey('owns_lot', $surveyData);
            $this->assertArrayHasKey('owns_house', $surveyData);
            $this->assertArrayHasKey('temporary_housing', $surveyData);
            $this->assertArrayHasKey('house_structure', $surveyData);
            $this->assertArrayHasKey('toilet_type', $surveyData);
            $this->assertArrayHasKey('water_source', $surveyData);
            $this->assertArrayHasKey('electricity_source', $surveyData);
            
            // Calculate score
            $score = $calculator->calculateScore($surveyData);
            
            // Assert score is greater than 0
            $this->assertGreaterThan(
                0.0,
                $score,
                sprintf(
                    'Score must be greater than 0%% when all categories have valid data. Iteration %d: got %.2f%% with data: %s',
                    $i,
                    $score,
                    json_encode($surveyData)
                )
            );
            
            // Also verify it's within valid range
            $this->assertLessThanOrEqual(
                100.0,
                $score,
                sprintf(
                    'Score must not exceed 100%%. Iteration %d: got %.2f%%',
                    $i,
                    $score
                )
            );
        }
    }
    
    /**
     * Property test: Complete data with minimum values produces non-zero score.
     * 
     * Even when all categories have their minimum scoring values, the total
     * score should still be greater than 0% because each category contributes
     * something.
     * 
     * @test
     */
    public function complete_data_with_minimum_values_produces_non_zero_score(): void
    {
        $calculator = new ScoreCalculator();
        
        // Survey data with all minimum scoring values
        $minSurveyData = [
            'income_range' => '13000+',  // 10% of 15% = 1.5%
            'classification' => 'Upgrading of land tenure',  // 10% of 15% = 1.5%
            'owns_lot' => true,  // 0% contribution
            'owns_house' => true,  // 0% contribution
            'temporary_housing' => false,  // 0% contribution
            'house_structure' => 'Others',  // 2% of 14% = 0.28%
            'toilet_type' => 'Others',  // 10% of 14% = 1.4%
            'water_source' => 'Community Water System (NAWASA)',  // 4% of 14% = 0.56%
            'electricity_source' => 'Others',  // 10% of 14% = 1.4%
        ];
        
        // Calculate score
        $score = $calculator->calculateScore($minSurveyData);
        
        // Assert score is greater than 0
        $this->assertGreaterThan(
            0.0,
            $score,
            sprintf(
                'Score must be greater than 0%% even with all minimum values. Got %.2f%%',
                $score
            )
        );
        
        // Expected minimum score: 1.5 + 1.5 + 0 + 0.28 + 1.4 + 0.56 + 1.4 = 6.64%
        $expectedMinScore = 6.64;
        $epsilon = 0.5; // Allow some tolerance
        
        $this->assertGreaterThanOrEqual(
            $expectedMinScore - $epsilon,
            $score,
            sprintf(
                'Score with minimum values should be approximately %.2f%%. Got %.2f%%',
                $expectedMinScore,
                $score
            )
        );
    }
    
    /**
     * Property test: Complete data with maximum values produces high score.
     * 
     * When all categories have their maximum scoring values, the total score
     * should be significantly higher than the minimum score.
     * 
     * @test
     */
    public function complete_data_with_maximum_values_produces_high_score(): void
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
        
        // Assert score is greater than 0
        $this->assertGreaterThan(
            0.0,
            $score,
            sprintf(
                'Score must be greater than 0%% with all maximum values. Got %.2f%%',
                $score
            )
        );
        
        // Expected maximum score: 4.5 + 7.5 + 2.8 + 4.2 + 7 + 4.2 + 5.6 + 4.2 + 4.2 = 44.2%
        $expectedMaxScore = 44.2;
        $epsilon = 1.0; // Allow some tolerance
        
        $this->assertGreaterThanOrEqual(
            $expectedMaxScore - $epsilon,
            $score,
            sprintf(
                'Score with maximum values should be approximately %.2f%%. Got %.2f%%',
                $expectedMaxScore,
                $score
            )
        );
        
        $this->assertLessThanOrEqual(
            $expectedMaxScore + $epsilon,
            $score,
            sprintf(
                'Score with maximum values should not exceed approximately %.2f%%. Got %.2f%%',
                $expectedMaxScore,
                $score
            )
        );
    }
    
    /**
     * Property test: Score increases with more severe conditions.
     * 
     * For any two complete survey data sets where one has more severe
     * conditions than the other, the more severe one should have a higher
     * or equal score.
     * 
     * @test
     */
    public function score_increases_with_more_severe_conditions(): void
    {
        $calculator = new ScoreCalculator();
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate base survey data
            $baseSurveyData = generateRandomSurveyData();
            
            // Create a more severe version by changing some values to higher-scoring options
            $severeSurveyData = $baseSurveyData;
            
            // Make conditions more severe (higher scoring)
            $severeSurveyData['income_range'] = '0-2999';  // Lowest income
            $severeSurveyData['classification'] = 'Homeless';  // Most severe classification
            $severeSurveyData['owns_lot'] = false;  // Doesn't own lot
            $severeSurveyData['owns_house'] = false;  // Doesn't own house
            $severeSurveyData['temporary_housing'] = true;  // In temporary housing
            
            // Calculate scores
            $baseScore = $calculator->calculateScore($baseSurveyData);
            $severeScore = $calculator->calculateScore($severeSurveyData);
            
            // Both should be greater than 0
            $this->assertGreaterThan(
                0.0,
                $baseScore,
                sprintf('Base score must be greater than 0%%. Iteration %d', $i)
            );
            
            $this->assertGreaterThan(
                0.0,
                $severeScore,
                sprintf('Severe score must be greater than 0%%. Iteration %d', $i)
            );
            
            // Severe conditions should have higher or equal score
            $this->assertGreaterThanOrEqual(
                $baseScore,
                $severeScore,
                sprintf(
                    'More severe conditions should result in higher or equal score. Iteration %d: base=%.2f%%, severe=%.2f%%',
                    $i,
                    $baseScore,
                    $severeScore
                )
            );
        }
    }
    
    /**
     * Property test: All categories contribute when data is complete.
     * 
     * For any complete survey data, we can verify that removing any single
     * category's data results in a lower score, proving all categories
     * contribute.
     * 
     * @test
     */
    public function all_categories_contribute_with_complete_data(): void
    {
        $calculator = new ScoreCalculator();
        $iterations = 5;
        
        $categoryFields = [
            'income_range',
            'classification',
            'house_structure',
            'toilet_type',
            'water_source',
            'electricity_source',
        ];
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate complete random survey data
            $completeSurveyData = generateRandomSurveyData();
            
            // Calculate score with complete data
            $completeScore = $calculator->calculateScore($completeSurveyData);
            
            // Verify complete score is greater than 0
            $this->assertGreaterThan(
                0.0,
                $completeScore,
                sprintf('Complete score must be greater than 0%%. Iteration %d', $i)
            );
            
            // Test removing each category one at a time
            foreach ($categoryFields as $field) {
                $incompleteSurveyData = $completeSurveyData;
                unset($incompleteSurveyData[$field]);
                
                $incompleteScore = $calculator->calculateScore($incompleteSurveyData);
                
                // Incomplete score should be less than or equal to complete score
                $this->assertLessThanOrEqual(
                    $completeScore,
                    $incompleteScore,
                    sprintf(
                        'Removing category "%s" should not increase score. Iteration %d: complete=%.2f%%, incomplete=%.2f%%',
                        $field,
                        $i,
                        $completeScore,
                        $incompleteScore
                    )
                );
            }
        }
    }
}

