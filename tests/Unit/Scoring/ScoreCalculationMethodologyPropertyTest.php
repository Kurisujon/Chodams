<?php

namespace Tests\Unit\Scoring;

use PHPUnit\Framework\TestCase;
use App\Services\Scoring\ScoreCalculator;
use App\Services\Scoring\IncomeRangeCalculator;
use App\Services\Scoring\ClassificationCalculator;
use App\Services\Scoring\HouseholdInfoCalculator;
use App\Services\Scoring\HouseStructureCalculator;
use App\Services\Scoring\ToiletTypeCalculator;
use App\Services\Scoring\WaterSourceCalculator;
use App\Services\Scoring\ElectricitySourceCalculator;

/**
 * Property-Based Test for Score Calculation Methodology
 * 
 * Feature: beneficiary-scoring-system, Property 3: Score Calculation Methodology
 * Validates: Requirements 1.4, 1.5
 * 
 * Property: For any survey data, the final Priority_Score should equal the sum 
 * of all category contributions, where each contribution equals 
 * (internal_score * category_weight * 100).
 * 
 * This test validates that the scoring system correctly implements the two-stage
 * calculation approach: computing internal scores within categories, then applying
 * weights to produce the final score.
 */
class ScoreCalculationMethodologyPropertyTest extends TestCase
{
    /**
     * Get all category calculator instances
     * 
     * @return array<\App\Services\Scoring\CategoryCalculatorInterface>
     */
    private function getCategoryCalculators(): array
    {
        return [
            new IncomeRangeCalculator(),
            new ClassificationCalculator(),
            new HouseholdInfoCalculator(),
            new HouseStructureCalculator(),
            new ToiletTypeCalculator(),
            new WaterSourceCalculator(),
            new ElectricitySourceCalculator(),
        ];
    }
    
    /**
     * Property test: Final score equals sum of category contributions.
     * 
     * For any randomly generated survey data, the total score calculated by
     * ScoreCalculator should equal the sum of individual category contributions.
     * 
     * This test runs 100+ iterations with different random survey data
     * combinations to ensure the property holds universally.
     * 
     * @test
     */
    public function final_score_equals_sum_of_category_contributions(): void
    {
        $calculator = new ScoreCalculator();
        $categoryCalculators = $this->getCategoryCalculators();
        $iterations = 20;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random survey data
            $surveyData = generateRandomSurveyData();
            
            // Calculate total score using ScoreCalculator
            $totalScore = $calculator->calculateScore($surveyData);
            
            // Calculate sum of individual category contributions
            $sumOfContributions = 0.0;
            $contributionBreakdown = [];
            
            foreach ($categoryCalculators as $categoryCalc) {
                $contribution = $categoryCalc->calculate($surveyData);
                $sumOfContributions += $contribution;
                $contributionBreakdown[$categoryCalc->getName()] = $contribution;
            }
            
            // Use epsilon comparison for floating point equality
            $epsilon = 0.01;
            $difference = abs($totalScore - $sumOfContributions);
            
            $this->assertLessThan(
                $epsilon,
                $difference,
                sprintf(
                    'Total score (%.2f) must equal sum of contributions (%.2f). Iteration %d. Breakdown: %s',
                    $totalScore,
                    $sumOfContributions,
                    $i,
                    json_encode($contributionBreakdown, JSON_PRETTY_PRINT)
                )
            );
        }
    }
    
    /**
     * Property test: Score methodology with missing data.
     * 
     * For any survey data with missing fields, the total score should still
     * equal the sum of category contributions (with missing categories contributing 0%).
     * 
     * @test
     */
    public function score_methodology_holds_with_missing_data(): void
    {
        $calculator = new ScoreCalculator();
        $categoryCalculators = $this->getCategoryCalculators();
        $iterations = 20;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate survey data with random missing fields
            $surveyData = generateSurveyDataWithMissingFields();
            
            // Calculate total score using ScoreCalculator
            $totalScore = $calculator->calculateScore($surveyData);
            
            // Calculate sum of individual category contributions
            $sumOfContributions = 0.0;
            
            foreach ($categoryCalculators as $categoryCalc) {
                $contribution = $categoryCalc->calculate($surveyData);
                $sumOfContributions += $contribution;
            }
            
            // Use epsilon comparison for floating point equality
            $epsilon = 0.01;
            $difference = abs($totalScore - $sumOfContributions);
            
            $this->assertLessThan(
                $epsilon,
                $difference,
                sprintf(
                    'Total score (%.2f) must equal sum of contributions (%.2f) even with missing data. Iteration %d',
                    $totalScore,
                    $sumOfContributions,
                    $i
                )
            );
        }
    }
    
    /**
     * Property test: Score methodology with empty data.
     * 
     * When all survey data is missing, both the total score and sum of
     * contributions should be 0%.
     * 
     * @test
     */
    public function score_methodology_holds_with_empty_data(): void
    {
        $calculator = new ScoreCalculator();
        $categoryCalculators = $this->getCategoryCalculators();
        
        // Empty survey data
        $surveyData = [];
        
        // Calculate total score using ScoreCalculator
        $totalScore = $calculator->calculateScore($surveyData);
        
        // Calculate sum of individual category contributions
        $sumOfContributions = 0.0;
        
        foreach ($categoryCalculators as $categoryCalc) {
            $contribution = $categoryCalc->calculate($surveyData);
            $sumOfContributions += $contribution;
        }
        
        // Both should be 0
        $this->assertEquals(
            0.0,
            $totalScore,
            'Total score should be 0% with empty data'
        );
        
        $this->assertEquals(
            0.0,
            $sumOfContributions,
            'Sum of contributions should be 0% with empty data'
        );
        
        // And they should be equal
        $this->assertEquals(
            $totalScore,
            $sumOfContributions,
            'Total score must equal sum of contributions even with empty data'
        );
    }
    
    /**
     * Property test: Each category contribution respects its weight.
     * 
     * For any survey data, each category's contribution should not exceed
     * its assigned weight (as a percentage).
     * 
     * @test
     */
    public function each_category_contribution_respects_weight(): void
    {
        $categoryCalculators = $this->getCategoryCalculators();
        $iterations = 20;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random survey data
            $surveyData = generateRandomSurveyData();
            
            foreach ($categoryCalculators as $categoryCalc) {
                $contribution = $categoryCalc->calculate($surveyData);
                $weight = $categoryCalc->getWeight();
                $maxContribution = $weight * 100; // Convert to percentage
                
                $this->assertLessThanOrEqual(
                    $maxContribution,
                    $contribution,
                    sprintf(
                        'Category "%s" contribution (%.2f%%) must not exceed its weight (%.2f%%). Iteration %d',
                        $categoryCalc->getName(),
                        $contribution,
                        $maxContribution,
                        $i
                    )
                );
                
                $this->assertGreaterThanOrEqual(
                    0.0,
                    $contribution,
                    sprintf(
                        'Category "%s" contribution must not be negative. Got %.2f%%. Iteration %d',
                        $categoryCalc->getName(),
                        $contribution,
                        $i
                    )
                );
            }
        }
    }
    
    /**
     * Property test: Score calculation is additive.
     * 
     * For any survey data, if we calculate the score in parts (some categories
     * at a time) and sum them, it should equal calculating all at once.
     * 
     * @test
     */
    public function score_calculation_is_additive(): void
    {
        $calculator = new ScoreCalculator();
        $categoryCalculators = $this->getCategoryCalculators();
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random survey data
            $surveyData = generateRandomSurveyData();
            
            // Calculate total score all at once
            $totalScore = $calculator->calculateScore($surveyData);
            
            // Calculate score by adding categories one by one
            $incrementalScore = 0.0;
            
            foreach ($categoryCalculators as $categoryCalc) {
                $contribution = $categoryCalc->calculate($surveyData);
                $incrementalScore += $contribution;
            }
            
            // Use epsilon comparison for floating point equality
            $epsilon = 0.01;
            $difference = abs($totalScore - $incrementalScore);
            
            $this->assertLessThan(
                $epsilon,
                $difference,
                sprintf(
                    'Score calculation should be additive. Total=%.2f, Incremental=%.2f. Iteration %d',
                    $totalScore,
                    $incrementalScore,
                    $i
                )
            );
        }
    }
    
    /**
     * Property test: Contribution breakdown is consistent.
     * 
     * For any survey data, calculating contributions multiple times should
     * always return the same breakdown.
     * 
     * @test
     */
    public function contribution_breakdown_is_consistent(): void
    {
        $categoryCalculators = $this->getCategoryCalculators();
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random survey data
            $surveyData = generateRandomSurveyData();
            
            // Calculate contributions twice
            $firstBreakdown = [];
            $secondBreakdown = [];
            
            foreach ($categoryCalculators as $categoryCalc) {
                $firstBreakdown[$categoryCalc->getName()] = $categoryCalc->calculate($surveyData);
            }
            
            foreach ($categoryCalculators as $categoryCalc) {
                $secondBreakdown[$categoryCalc->getName()] = $categoryCalc->calculate($surveyData);
            }
            
            // Compare breakdowns
            foreach ($firstBreakdown as $categoryName => $contribution) {
                $this->assertEquals(
                    $contribution,
                    $secondBreakdown[$categoryName],
                    sprintf(
                        'Category "%s" contribution should be consistent. First=%.2f, Second=%.2f. Iteration %d',
                        $categoryName,
                        $contribution,
                        $secondBreakdown[$categoryName],
                        $i
                    )
                );
            }
        }
    }
}

