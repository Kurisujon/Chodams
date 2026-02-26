<?php

namespace Tests\Unit\Scoring;

use PHPUnit\Framework\TestCase;
use App\Services\Scoring\ElectricitySourceCalculator;

/**
 * Property-Based Test for Electricity Source Scoring Correctness
 * 
 * Feature: beneficiary-scoring-system, Property 10: Electricity Source Scoring Correctness
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 * 
 * Property: For any valid electricity source value, the ElectricitySourceCalculator 
 * should return the correct contribution based on electricity access reliability.
 * 
 * This test validates that the electricity source scoring follows the exact requirements
 * specification, where unreliable electricity access receives higher priority scores.
 */
class ElectricitySourceScoringPropertyTest extends TestCase
{
    /**
     * Get all valid electricity sources with their expected contributions
     * 
     * @return array<string, array{electricity_source: string, expected_contribution: float}>
     */
    private function getElectricitySourceTestCases(): array
    {
        return [
            'Candle/Lamp' => [
                'electricity_source' => 'Candle/Lamp',
                'expected_contribution' => 4.2,  // 30% of 14%
            ],
            'Tapping to the neighbor' => [
                'electricity_source' => 'Tapping to the neighbor',
                'expected_contribution' => 3.5,  // 25% of 14%
            ],
            'Solar Panel' => [
                'electricity_source' => 'Solar Panel',
                'expected_contribution' => 2.8,  // 20% of 14%
            ],
            'With own meter' => [
                'electricity_source' => 'With own meter',
                'expected_contribution' => 2.1,  // 15% of 14%
            ],
            'Others' => [
                'electricity_source' => 'Others',
                'expected_contribution' => 1.4,  // 10% of 14%
            ],
        ];
    }

    /**
     * Property test: Each electricity source produces exact expected contribution.
     * 
     * For any valid electricity source value, the calculator should return the
     * exact contribution specified in the requirements.
     * 
     * @test
     */
    public function each_electricity_source_produces_exact_contribution(): void
    {
        $calculator = new ElectricitySourceCalculator();
        $testCases = $this->getElectricitySourceTestCases();
        
        foreach ($testCases as $key => $testCase) {
            $surveyData = ['electricity_source' => $testCase['electricity_source']];
            $actualContribution = $calculator->calculate($surveyData);
            $expectedContribution = $testCase['expected_contribution'];
            
            // Use epsilon comparison for floating point equality
            $epsilon = 0.0001;
            $this->assertLessThan(
                $epsilon,
                abs($expectedContribution - $actualContribution),
                sprintf(
                    'Electricity source "%s" should contribute exactly %.2f%%, got %.2f%%',
                    $testCase['electricity_source'],
                    $expectedContribution,
                    $actualContribution
                )
            );
        }
    }

    /**
     * Property test: Less reliable electricity sources produce higher scores.
     * 
     * For any two electricity sources where one is less reliable than the other,
     * the less reliable source should produce a higher or equal contribution.
     * 
     * @test
     */
    public function less_reliable_electricity_sources_produce_higher_scores(): void
    {
        $calculator = new ElectricitySourceCalculator();
        
        // Electricity sources in order from least to most reliable
        $orderedElectricitySources = [
            'Candle/Lamp',
            'Tapping to the neighbor',
            'Solar Panel',
            'With own meter',
            'Others',
        ];
        
        for ($i = 0; $i < count($orderedElectricitySources) - 1; $i++) {
            $lessReliable = $orderedElectricitySources[$i];
            $moreReliable = $orderedElectricitySources[$i + 1];
            
            $lessReliableContribution = $calculator->calculate([
                'electricity_source' => $lessReliable
            ]);
            
            $moreReliableContribution = $calculator->calculate([
                'electricity_source' => $moreReliable
            ]);
            
            $this->assertGreaterThanOrEqual(
                $moreReliableContribution,
                $lessReliableContribution,
                sprintf(
                    'Less reliable electricity source "%s" (%.2f%%) should have higher or equal contribution than "%s" (%.2f%%)',
                    $lessReliable,
                    $lessReliableContribution,
                    $moreReliable,
                    $moreReliableContribution
                )
            );
        }
    }

    /**
     * Property test: Candle/Lamp produces highest score.
     * 
     * For any electricity source, Candle/Lamp should produce the highest contribution.
     * 
     * @test
     */
    public function candle_lamp_produces_highest_score(): void
    {
        $calculator = new ElectricitySourceCalculator();
        $testCases = $this->getElectricitySourceTestCases();
        
        $candleLampContribution = $calculator->calculate([
            'electricity_source' => 'Candle/Lamp'
        ]);
        
        foreach ($testCases as $testCase) {
            if ($testCase['electricity_source'] === 'Candle/Lamp') {
                continue;
            }
            
            $otherContribution = $calculator->calculate([
                'electricity_source' => $testCase['electricity_source']
            ]);
            
            $this->assertGreaterThan(
                $otherContribution,
                $candleLampContribution,
                sprintf(
                    'Candle/Lamp (%.2f%%) should have higher contribution than "%s" (%.2f%%)',
                    $candleLampContribution,
                    $testCase['electricity_source'],
                    $otherContribution
                )
            );
        }
    }

    /**
     * Property test: With own meter produces lowest score (excluding Others).
     * 
     * For any electricity source except Others, With own meter should produce
     * the lowest contribution.
     * 
     * @test
     */
    public function with_own_meter_produces_lowest_score_excluding_others(): void
    {
        $calculator = new ElectricitySourceCalculator();
        $testCases = $this->getElectricitySourceTestCases();
        
        $ownMeterContribution = $calculator->calculate([
            'electricity_source' => 'With own meter'
        ]);
        
        foreach ($testCases as $testCase) {
            if ($testCase['electricity_source'] === 'With own meter' || 
                $testCase['electricity_source'] === 'Others') {
                continue;
            }
            
            $otherContribution = $calculator->calculate([
                'electricity_source' => $testCase['electricity_source']
            ]);
            
            $this->assertLessThan(
                $otherContribution,
                $ownMeterContribution,
                sprintf(
                    'With own meter (%.2f%%) should have lower contribution than "%s" (%.2f%%)',
                    $ownMeterContribution,
                    $testCase['electricity_source'],
                    $otherContribution
                )
            );
        }
    }

    /**
     * Property test: Missing electricity source returns 0% contribution.
     * 
     * For any survey data without an electricity_source field, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function missing_electricity_source_returns_zero_contribution(): void
    {
        $calculator = new ElectricitySourceCalculator();
        
        // Test with empty survey data
        $contribution = $calculator->calculate([]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Missing electricity_source should contribute 0%'
        );
        
        // Test with null electricity_source
        $contribution = $calculator->calculate(['electricity_source' => null]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Null electricity_source should contribute 0%'
        );
    }

    /**
     * Property test: Invalid electricity source returns 0% contribution.
     * 
     * For any survey data with an invalid electricity_source value, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function invalid_electricity_source_returns_zero_contribution(): void
    {
        $calculator = new ElectricitySourceCalculator();
        
        $invalidElectricitySources = [
            'invalid',
            'Unknown',
            '',
            'Generator',
            'Battery',
            'Wind Power',
        ];
        
        foreach ($invalidElectricitySources as $invalidElectricitySource) {
            $contribution = $calculator->calculate(['electricity_source' => $invalidElectricitySource]);
            $this->assertEquals(
                0.0,
                $contribution,
                sprintf('Invalid electricity_source "%s" should contribute 0%%', $invalidElectricitySource)
            );
        }
    }

    /**
     * Property test: All contributions are within valid range.
     * 
     * For any electricity source value, the contribution should be:
     * - Greater than or equal to 0%
     * - Less than or equal to the category weight (14%)
     * 
     * @test
     */
    public function all_contributions_are_within_valid_range(): void
    {
        $calculator = new ElectricitySourceCalculator();
        $testCases = $this->getElectricitySourceTestCases();
        $categoryWeight = 14.0; // 14% weight for electricity source category
        
        foreach ($testCases as $testCase) {
            $surveyData = ['electricity_source' => $testCase['electricity_source']];
            $contribution = $calculator->calculate($surveyData);
            
            $this->assertGreaterThanOrEqual(
                0.0,
                $contribution,
                sprintf(
                    'Contribution for electricity_source "%s" should be >= 0%%, got %.2f%%',
                    $testCase['electricity_source'],
                    $contribution
                )
            );
            
            $this->assertLessThanOrEqual(
                $categoryWeight,
                $contribution,
                sprintf(
                    'Contribution for electricity_source "%s" should be <= %.2f%%, got %.2f%%',
                    $testCase['electricity_source'],
                    $categoryWeight,
                    $contribution
                )
            );
        }
    }

    /**
     * Property test: Calculation is deterministic.
     * 
     * For any electricity source value, calculating the contribution multiple times
     * should always return the same result.
     * 
     * @test
     */
    public function calculation_is_deterministic(): void
    {
        $calculator = new ElectricitySourceCalculator();
        $testCases = $this->getElectricitySourceTestCases();
        $iterations = 100;
        
        foreach ($testCases as $testCase) {
            $surveyData = ['electricity_source' => $testCase['electricity_source']];
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
                        'Calculation for electricity_source "%s" should be deterministic. Iteration %d returned %.2f%%, expected %.2f%%',
                        $testCase['electricity_source'],
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
     * The ElectricitySourceCalculator should report its weight as 0.14 (14%).
     * 
     * @test
     */
    public function calculator_weight_is_correct(): void
    {
        $calculator = new ElectricitySourceCalculator();
        
        $this->assertEquals(
            0.14,
            $calculator->getWeight(),
            'ElectricitySourceCalculator weight should be 0.14 (14%)'
        );
    }

    /**
     * Property test: Calculator name is correct.
     * 
     * The ElectricitySourceCalculator should report its name as "Source of Electricity".
     * 
     * @test
     */
    public function calculator_name_is_correct(): void
    {
        $calculator = new ElectricitySourceCalculator();
        
        $this->assertEquals(
            'Source of Electricity',
            $calculator->getName(),
            'ElectricitySourceCalculator name should be "Source of Electricity"'
        );
    }
}
