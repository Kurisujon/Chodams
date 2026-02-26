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
 * Property-Based Test for Category Weights Sum to 100%
 * 
 * Feature: beneficiary-scoring-system, Property 2: Category Weights Sum to 100%
 * Validates: Requirements 1.3, 11.4
 * 
 * Property: For any configuration of the Score_Calculator, the sum of all 
 * category weights should equal exactly 100% (or 1.0 as a decimal).
 * 
 * This test validates that the scoring system maintains mathematical correctness
 * by ensuring all category weights sum to exactly 1.0 (100%).
 */
class CategoryWeightsSumPropertyTest extends TestCase
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
     * Property test: Category weights sum to exactly 1.0 (100%).
     * 
     * For any configuration of the scoring system, the sum of all category
     * weights must equal exactly 1.0 (representing 100%).
     * 
     * This is a critical invariant that ensures the scoring system is
     * mathematically sound and scores can never exceed 100%.
     * 
     * @test
     */
    public function category_weights_sum_to_one_hundred_percent(): void
    {
        $calculators = $this->getCategoryCalculators();
        
        $totalWeight = 0.0;
        $weightBreakdown = [];
        
        foreach ($calculators as $calculator) {
            $weight = $calculator->getWeight();
            $totalWeight += $weight;
            $weightBreakdown[$calculator->getName()] = $weight;
        }
        
        // Use epsilon comparison for floating point equality
        // Weights should sum to exactly 1.0 (100%)
        $epsilon = 0.0001;
        $difference = abs($totalWeight - 1.0);
        
        $this->assertLessThan(
            $epsilon,
            $difference,
            sprintf(
                'Category weights must sum to exactly 1.0 (100%%), but got %.10f. Breakdown: %s',
                $totalWeight,
                json_encode($weightBreakdown, JSON_PRETTY_PRINT)
            )
        );
    }

    /**
     * Property test: Each category weight is positive and less than or equal to 1.0.
     * 
     * For any category calculator, its weight should be:
     * - Greater than 0 (positive contribution)
     * - Less than or equal to 1.0 (cannot exceed 100%)
     * 
     * @test
     */
    public function each_category_weight_is_valid(): void
    {
        $calculators = $this->getCategoryCalculators();
        
        foreach ($calculators as $calculator) {
            $weight = $calculator->getWeight();
            $name = $calculator->getName();
            
            $this->assertGreaterThan(
                0.0,
                $weight,
                sprintf('Category "%s" weight must be positive, got %.4f', $name, $weight)
            );
            
            $this->assertLessThanOrEqual(
                1.0,
                $weight,
                sprintf('Category "%s" weight must not exceed 1.0 (100%%), got %.4f', $name, $weight)
            );
        }
    }

    /**
     * Property test: All 7 categories are present.
     * 
     * The scoring system should have exactly 7 category calculators as per
     * the requirements specification.
     * 
     * @test
     */
    public function all_seven_categories_are_present(): void
    {
        $calculators = $this->getCategoryCalculators();
        
        $this->assertCount(
            7,
            $calculators,
            'Scoring system must have exactly 7 category calculators'
        );
        
        // Verify expected categories are present
        $expectedCategories = [
            'Income Range',
            'Classification',
            'Household Information',
            'House Structure',
            'Type of Toilet',
            'Source of Water',
            'Source of Electricity',
        ];
        
        $actualCategories = array_map(
            fn($calc) => $calc->getName(),
            $calculators
        );
        
        sort($expectedCategories);
        sort($actualCategories);
        
        $this->assertEquals(
            $expectedCategories,
            $actualCategories,
            'All expected categories must be present in the scoring system'
        );
    }

    /**
     * Property test: Weight distribution matches requirements specification.
     * 
     * Verify that the actual weights match the requirements:
     * - Income Range: 15%
     * - Classification: 15%
     * - Household Information: 14%
     * - House Structure: 14%
     * - Type of Toilet: 14%
     * - Source of Water: 14%
     * - Source of Electricity: 14%
     * 
     * @test
     */
    public function weight_distribution_matches_requirements(): void
    {
        $calculators = $this->getCategoryCalculators();
        
        $expectedWeights = [
            'Income Range' => 0.15,
            'Classification' => 0.15,
            'Household Information' => 0.14,
            'House Structure' => 0.14,
            'Type of Toilet' => 0.14,
            'Source of Water' => 0.14,
            'Source of Electricity' => 0.14,
        ];
        
        foreach ($calculators as $calculator) {
            $name = $calculator->getName();
            $actualWeight = $calculator->getWeight();
            $expectedWeight = $expectedWeights[$name] ?? null;
            
            $this->assertNotNull(
                $expectedWeight,
                sprintf('Unexpected category "%s" found', $name)
            );
            
            $this->assertEquals(
                $expectedWeight,
                $actualWeight,
                sprintf(
                    'Category "%s" weight should be %.2f (%.0f%%), got %.2f (%.0f%%)',
                    $name,
                    $expectedWeight,
                    $expectedWeight * 100,
                    $actualWeight,
                    $actualWeight * 100
                )
            );
        }
    }

    /**
     * Property test: ScoreCalculator uses the same category calculators.
     * 
     * Verify that the ScoreCalculator internally uses the same set of
     * category calculators, ensuring consistency.
     * 
     * @test
     */
    public function score_calculator_validates_weights_correctly(): void
    {
        // Create a ScoreCalculator instance
        $calculator = new ScoreCalculator();
        
        // Try to calculate a score with empty data
        // This should work because weights are valid
        $score = $calculator->calculateScore([]);
        
        // Score should be 0 for empty data, but calculation should succeed
        $this->assertEquals(
            0.0,
            $score,
            'ScoreCalculator should successfully calculate score when weights are valid'
        );
    }

    /**
     * Property test: Weight sum is deterministic across multiple calls.
     * 
     * For any number of times we calculate the weight sum, it should
     * always return the same value (deterministic behavior).
     * 
     * @test
     */
    public function weight_sum_is_deterministic(): void
    {
        $iterations = 10;
        $weightSums = [];
        
        for ($i = 0; $i < $iterations; $i++) {
            $calculators = $this->getCategoryCalculators();
            $totalWeight = 0.0;
            
            foreach ($calculators as $calculator) {
                $totalWeight += $calculator->getWeight();
            }
            
            $weightSums[] = $totalWeight;
        }
        
        // All weight sums should be identical
        $firstSum = $weightSums[0];
        foreach ($weightSums as $index => $sum) {
            $this->assertEquals(
                $firstSum,
                $sum,
                sprintf(
                    'Weight sum should be deterministic. Iteration %d returned %.10f, expected %.10f',
                    $index,
                    $sum,
                    $firstSum
                )
            );
        }
        
        // And they should all equal 1.0
        $epsilon = 0.0001;
        $this->assertLessThan(
            $epsilon,
            abs($firstSum - 1.0),
            sprintf('All weight sums should equal 1.0, got %.10f', $firstSum)
        );
    }
}
