<?php

namespace Tests\Unit\Scoring;

use PHPUnit\Framework\TestCase;
use App\Services\Scoring\WaterSourceCalculator;

/**
 * Property-Based Test for Water Source Scoring Correctness
 * 
 * Feature: beneficiary-scoring-system, Property 9: Water Source Scoring Correctness
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 * 
 * Property: For any valid water source value, the WaterSourceCalculator should 
 * return the correct contribution based on water access safety and reliability.
 * 
 * This test validates that the water source scoring follows the exact requirements
 * specification, where unsafe water access receives higher priority scores.
 */
class WaterSourceScoringPropertyTest extends TestCase
{
    /**
     * Get all valid water sources with their expected contributions
     * 
     * @return array<string, array{water_source: string, expected_contribution: float}>
     */
    private function getWaterSourceTestCases(): array
    {
        return [
            'Surface water (river, lake, dam)' => [
                'water_source' => 'Surface water (river, lake, dam)',
                'expected_contribution' => 4.2,  // 30% of 14%
            ],
            'Rainwater' => [
                'water_source' => 'Rainwater',
                'expected_contribution' => 3.5,  // 25% of 14%
            ],
            'Spring' => [
                'water_source' => 'Spring',
                'expected_contribution' => 2.8,  // 20% of 14%
            ],
            'Deep Well' => [
                'water_source' => 'Deep Well',
                'expected_contribution' => 2.1,  // 15% of 14%
            ],
            'Others' => [
                'water_source' => 'Others',
                'expected_contribution' => 0.84, // 6% of 14%
            ],
            'Community Water System (NAWASA)' => [
                'water_source' => 'Community Water System (NAWASA)',
                'expected_contribution' => 0.56, // 4% of 14%
            ],
        ];
    }

    /**
     * Property test: Each water source produces exact expected contribution.
     * 
     * For any valid water source value, the calculator should return the
     * exact contribution specified in the requirements.
     * 
     * @test
     */
    public function each_water_source_produces_exact_contribution(): void
    {
        $calculator = new WaterSourceCalculator();
        $testCases = $this->getWaterSourceTestCases();
        
        foreach ($testCases as $key => $testCase) {
            $surveyData = ['water_source' => $testCase['water_source']];
            $actualContribution = $calculator->calculate($surveyData);
            $expectedContribution = $testCase['expected_contribution'];
            
            // Use epsilon comparison for floating point equality
            $epsilon = 0.0001;
            $this->assertLessThan(
                $epsilon,
                abs($expectedContribution - $actualContribution),
                sprintf(
                    'Water source "%s" should contribute exactly %.2f%%, got %.2f%%',
                    $testCase['water_source'],
                    $expectedContribution,
                    $actualContribution
                )
            );
        }
    }

    /**
     * Property test: Less safe water sources produce higher scores.
     * 
     * For any two water sources where one is less safe than the other,
     * the less safe source should produce a higher or equal contribution.
     * 
     * @test
     */
    public function less_safe_water_sources_produce_higher_scores(): void
    {
        $calculator = new WaterSourceCalculator();
        
        // Water sources in order from least to most safe
        $orderedWaterSources = [
            'Surface water (river, lake, dam)',
            'Rainwater',
            'Spring',
            'Deep Well',
            'Others',
            'Community Water System (NAWASA)',
        ];
        
        for ($i = 0; $i < count($orderedWaterSources) - 1; $i++) {
            $lessSafe = $orderedWaterSources[$i];
            $moreSafe = $orderedWaterSources[$i + 1];
            
            $lessSafeContribution = $calculator->calculate([
                'water_source' => $lessSafe
            ]);
            
            $moreSafeContribution = $calculator->calculate([
                'water_source' => $moreSafe
            ]);
            
            $this->assertGreaterThanOrEqual(
                $moreSafeContribution,
                $lessSafeContribution,
                sprintf(
                    'Less safe water source "%s" (%.2f%%) should have higher or equal contribution than "%s" (%.2f%%)',
                    $lessSafe,
                    $lessSafeContribution,
                    $moreSafe,
                    $moreSafeContribution
                )
            );
        }
    }

    /**
     * Property test: Surface water produces highest score.
     * 
     * For any water source, Surface water should produce the highest contribution.
     * 
     * @test
     */
    public function surface_water_produces_highest_score(): void
    {
        $calculator = new WaterSourceCalculator();
        $testCases = $this->getWaterSourceTestCases();
        
        $surfaceWaterContribution = $calculator->calculate([
            'water_source' => 'Surface water (river, lake, dam)'
        ]);
        
        foreach ($testCases as $testCase) {
            if ($testCase['water_source'] === 'Surface water (river, lake, dam)') {
                continue;
            }
            
            $otherContribution = $calculator->calculate([
                'water_source' => $testCase['water_source']
            ]);
            
            $this->assertGreaterThan(
                $otherContribution,
                $surfaceWaterContribution,
                sprintf(
                    'Surface water (%.2f%%) should have higher contribution than "%s" (%.2f%%)',
                    $surfaceWaterContribution,
                    $testCase['water_source'],
                    $otherContribution
                )
            );
        }
    }

    /**
     * Property test: Community Water System produces lowest score.
     * 
     * For any water source, Community Water System (NAWASA) should produce
     * the lowest contribution.
     * 
     * @test
     */
    public function community_water_system_produces_lowest_score(): void
    {
        $calculator = new WaterSourceCalculator();
        $testCases = $this->getWaterSourceTestCases();
        
        $nawasaContribution = $calculator->calculate([
            'water_source' => 'Community Water System (NAWASA)'
        ]);
        
        foreach ($testCases as $testCase) {
            if ($testCase['water_source'] === 'Community Water System (NAWASA)') {
                continue;
            }
            
            $otherContribution = $calculator->calculate([
                'water_source' => $testCase['water_source']
            ]);
            
            $this->assertLessThan(
                $otherContribution,
                $nawasaContribution,
                sprintf(
                    'Community Water System (%.2f%%) should have lower contribution than "%s" (%.2f%%)',
                    $nawasaContribution,
                    $testCase['water_source'],
                    $otherContribution
                )
            );
        }
    }

    /**
     * Property test: Missing water source returns 0% contribution.
     * 
     * For any survey data without a water_source field, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function missing_water_source_returns_zero_contribution(): void
    {
        $calculator = new WaterSourceCalculator();
        
        // Test with empty survey data
        $contribution = $calculator->calculate([]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Missing water_source should contribute 0%'
        );
        
        // Test with null water_source
        $contribution = $calculator->calculate(['water_source' => null]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Null water_source should contribute 0%'
        );
    }

    /**
     * Property test: Invalid water source returns 0% contribution.
     * 
     * For any survey data with an invalid water_source value, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function invalid_water_source_returns_zero_contribution(): void
    {
        $calculator = new WaterSourceCalculator();
        
        $invalidWaterSources = [
            'invalid',
            'Unknown',
            '',
            'Bottled Water',
            'Tap Water',
            'Well',
        ];
        
        foreach ($invalidWaterSources as $invalidWaterSource) {
            $contribution = $calculator->calculate(['water_source' => $invalidWaterSource]);
            $this->assertEquals(
                0.0,
                $contribution,
                sprintf('Invalid water_source "%s" should contribute 0%%', $invalidWaterSource)
            );
        }
    }

    /**
     * Property test: All contributions are within valid range.
     * 
     * For any water source value, the contribution should be:
     * - Greater than or equal to 0%
     * - Less than or equal to the category weight (14%)
     * 
     * @test
     */
    public function all_contributions_are_within_valid_range(): void
    {
        $calculator = new WaterSourceCalculator();
        $testCases = $this->getWaterSourceTestCases();
        $categoryWeight = 14.0; // 14% weight for water source category
        
        foreach ($testCases as $testCase) {
            $surveyData = ['water_source' => $testCase['water_source']];
            $contribution = $calculator->calculate($surveyData);
            
            $this->assertGreaterThanOrEqual(
                0.0,
                $contribution,
                sprintf(
                    'Contribution for water_source "%s" should be >= 0%%, got %.2f%%',
                    $testCase['water_source'],
                    $contribution
                )
            );
            
            $this->assertLessThanOrEqual(
                $categoryWeight,
                $contribution,
                sprintf(
                    'Contribution for water_source "%s" should be <= %.2f%%, got %.2f%%',
                    $testCase['water_source'],
                    $categoryWeight,
                    $contribution
                )
            );
        }
    }

    /**
     * Property test: Calculation is deterministic.
     * 
     * For any water source value, calculating the contribution multiple times
     * should always return the same result.
     * 
     * @test
     */
    public function calculation_is_deterministic(): void
    {
        $calculator = new WaterSourceCalculator();
        $testCases = $this->getWaterSourceTestCases();
        $iterations = 100;
        
        foreach ($testCases as $testCase) {
            $surveyData = ['water_source' => $testCase['water_source']];
            $results = [];
            
            for ($i = 0; $i < $iterations; $i++) {
                $results[] = $calculator->calculate($surveyData);
            }
            
            // All results should be identical
            $firstResult = $results[0];
            foreach ($results as $index => $result) {
                $this->assertEquals(
                    $firstResult,
                    $result,
                    sprintf(
                        'Calculation for water_source "%s" should be deterministic. Iteration %d returned %.2f%%, expected %.2f%%',
                        $testCase['water_source'],
                        $index,
                        $result,
                        $firstResult
                    )
                );
            }
        }
    }

    /**
     * Property test: Calculator weight is correct.
     * 
     * The WaterSourceCalculator should report its weight as 0.14 (14%).
     * 
     * @test
     */
    public function calculator_weight_is_correct(): void
    {
        $calculator = new WaterSourceCalculator();
        
        $this->assertEquals(
            0.14,
            $calculator->getWeight(),
            'WaterSourceCalculator weight should be 0.14 (14%)'
        );
    }

    /**
     * Property test: Calculator name is correct.
     * 
     * The WaterSourceCalculator should report its name as "Source of Water".
     * 
     * @test
     */
    public function calculator_name_is_correct(): void
    {
        $calculator = new WaterSourceCalculator();
        
        $this->assertEquals(
            'Source of Water',
            $calculator->getName(),
            'WaterSourceCalculator name should be "Source of Water"'
        );
    }
}
