<?php

namespace Tests\Unit\Scoring;

use PHPUnit\Framework\TestCase;
use App\Services\Scoring\HouseholdInfoCalculator;

/**
 * Property-Based Test for Household Information Additive Scoring
 * 
 * Feature: beneficiary-scoring-system, Property 6: Household Information Additive Scoring
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * Property: For any combination of household information values (owns_lot, owns_house, 
 * temporary_housing), the HouseholdInfoCalculator should return the sum of applicable 
 * contributions (not owns_lot → 2.8%, not owns_house → 4.2%, temporary_housing → 7%), 
 * with a maximum of 14%.
 * 
 * This test validates that the household information scoring is additive and follows
 * the exact requirements specification.
 */
class HouseholdInfoAdditiveScoringPropertyTest extends TestCase
{
    /**
     * Get all possible combinations of household information values
     * 
     * @return array<string, array{owns_lot: bool, owns_house: bool, temporary_housing: bool, expected_contribution: float}>
     */
    private function getHouseholdInfoCombinations(): array
    {
        return [
            'all_false' => [
                'owns_lot' => false,
                'owns_house' => false,
                'temporary_housing' => false,
                'expected_contribution' => 7.0, // 2.8 + 4.2 = 7.0
            ],
            'all_true' => [
                'owns_lot' => true,
                'owns_house' => true,
                'temporary_housing' => true,
                'expected_contribution' => 7.0, // only temporary_housing = 7.0
            ],
            'no_lot_only' => [
                'owns_lot' => false,
                'owns_house' => true,
                'temporary_housing' => false,
                'expected_contribution' => 2.8, // 2.8
            ],
            'no_house_only' => [
                'owns_lot' => true,
                'owns_house' => false,
                'temporary_housing' => false,
                'expected_contribution' => 4.2, // 4.2
            ],
            'temporary_only' => [
                'owns_lot' => true,
                'owns_house' => true,
                'temporary_housing' => true,
                'expected_contribution' => 7.0, // 7.0
            ],
            'no_lot_no_house' => [
                'owns_lot' => false,
                'owns_house' => false,
                'temporary_housing' => false,
                'expected_contribution' => 7.0, // 2.8 + 4.2 = 7.0
            ],
            'no_lot_temporary' => [
                'owns_lot' => false,
                'owns_house' => true,
                'temporary_housing' => true,
                'expected_contribution' => 9.8, // 2.8 + 7.0 = 9.8
            ],
            'no_house_temporary' => [
                'owns_lot' => true,
                'owns_house' => false,
                'temporary_housing' => true,
                'expected_contribution' => 11.2, // 4.2 + 7.0 = 11.2
            ],
            'maximum_contribution' => [
                'owns_lot' => false,
                'owns_house' => false,
                'temporary_housing' => true,
                'expected_contribution' => 14.0, // 2.8 + 4.2 + 7.0 = 14.0 (max)
            ],
        ];
    }

    /**
     * Property test: Each combination produces exact expected contribution.
     * 
     * For any valid combination of household information values, the calculator
     * should return the exact sum of applicable contributions.
     * 
     * @test
     */
    public function each_combination_produces_exact_contribution(): void
    {
        $calculator = new HouseholdInfoCalculator();
        $testCases = $this->getHouseholdInfoCombinations();
        
        foreach ($testCases as $key => $testCase) {
            $surveyData = [
                'owns_lot' => $testCase['owns_lot'],
                'owns_house' => $testCase['owns_house'],
                'temporary_housing' => $testCase['temporary_housing'],
            ];
            
            $actualContribution = $calculator->calculate($surveyData);
            $expectedContribution = $testCase['expected_contribution'];
            
            // Use epsilon comparison for floating point equality
            $epsilon = 0.0001;
            $this->assertLessThan(
                $epsilon,
                abs($expectedContribution - $actualContribution),
                sprintf(
                    'Combination "%s" (owns_lot=%s, owns_house=%s, temporary_housing=%s) should contribute exactly %.2f%%, got %.2f%%',
                    $key,
                    $testCase['owns_lot'] ? 'true' : 'false',
                    $testCase['owns_house'] ? 'true' : 'false',
                    $testCase['temporary_housing'] ? 'true' : 'false',
                    $expectedContribution,
                    $actualContribution
                )
            );
        }
    }

    /**
     * Property test: Contributions are additive.
     * 
     * For any combination of household information values, the total contribution
     * should equal the sum of individual contributions.
     * 
     * @test
     */
    public function contributions_are_additive(): void
    {
        $calculator = new HouseholdInfoCalculator();
        
        // Individual contributions
        $notOwnsLotContribution = 2.8;
        $notOwnsHouseContribution = 4.2;
        $temporaryHousingContribution = 7.0;
        
        // Test all 8 combinations (2^3)
        for ($ownsLot = 0; $ownsLot <= 1; $ownsLot++) {
            for ($ownsHouse = 0; $ownsHouse <= 1; $ownsHouse++) {
                for ($temporaryHousing = 0; $temporaryHousing <= 1; $temporaryHousing++) {
                    $surveyData = [
                        'owns_lot' => (bool)$ownsLot,
                        'owns_house' => (bool)$ownsHouse,
                        'temporary_housing' => (bool)$temporaryHousing,
                    ];
                    
                    $expectedContribution = 0.0;
                    if (!$ownsLot) {
                        $expectedContribution += $notOwnsLotContribution;
                    }
                    if (!$ownsHouse) {
                        $expectedContribution += $notOwnsHouseContribution;
                    }
                    if ($temporaryHousing) {
                        $expectedContribution += $temporaryHousingContribution;
                    }
                    
                    $actualContribution = $calculator->calculate($surveyData);
                    
                    // Use epsilon comparison for floating point equality
                    $epsilon = 0.0001;
                    $this->assertLessThan(
                        $epsilon,
                        abs($expectedContribution - $actualContribution),
                        sprintf(
                            'Additive contribution for (owns_lot=%s, owns_house=%s, temporary_housing=%s) should be %.2f%%, got %.2f%%',
                            $ownsLot ? 'true' : 'false',
                            $ownsHouse ? 'true' : 'false',
                            $temporaryHousing ? 'true' : 'false',
                            $expectedContribution,
                            $actualContribution
                        )
                    );
                }
            }
        }
    }

    /**
     * Property test: Maximum contribution is 14%.
     * 
     * For any combination of household information values, the contribution
     * should never exceed 14% (the category weight).
     * 
     * @test
     */
    public function maximum_contribution_is_fourteen_percent(): void
    {
        $calculator = new HouseholdInfoCalculator();
        $testCases = $this->getHouseholdInfoCombinations();
        $maxContribution = 14.0;
        
        foreach ($testCases as $key => $testCase) {
            $surveyData = [
                'owns_lot' => $testCase['owns_lot'],
                'owns_house' => $testCase['owns_house'],
                'temporary_housing' => $testCase['temporary_housing'],
            ];
            
            $actualContribution = $calculator->calculate($surveyData);
            
            // Use epsilon for floating point comparison
            $epsilon = 0.0001;
            $this->assertLessThan(
                $maxContribution + $epsilon,
                $actualContribution,
                sprintf(
                    'Contribution for combination "%s" should not exceed %.2f%%, got %.2f%%',
                    $key,
                    $maxContribution,
                    $actualContribution
                )
            );
        }
    }

    /**
     * Property test: Worst case scenario produces maximum contribution.
     * 
     * When a beneficiary doesn't own lot, doesn't own house, and lives in
     * temporary housing, the contribution should be exactly 14%.
     * 
     * @test
     */
    public function worst_case_scenario_produces_maximum_contribution(): void
    {
        $calculator = new HouseholdInfoCalculator();
        
        $surveyData = [
            'owns_lot' => false,
            'owns_house' => false,
            'temporary_housing' => true,
        ];
        
        $contribution = $calculator->calculate($surveyData);
        
        // Use epsilon comparison for floating point equality
        $epsilon = 0.0001;
        $this->assertLessThan(
            $epsilon,
            abs(14.0 - $contribution),
            'Worst case scenario (no lot, no house, temporary housing) should contribute exactly 14%'
        );
    }

    /**
     * Property test: Best case scenario produces zero contribution.
     * 
     * When a beneficiary owns lot, owns house, and doesn't live in temporary
     * housing, the contribution should be exactly 0%.
     * 
     * @test
     */
    public function best_case_scenario_produces_zero_contribution(): void
    {
        $calculator = new HouseholdInfoCalculator();
        
        $surveyData = [
            'owns_lot' => true,
            'owns_house' => true,
            'temporary_housing' => false,
        ];
        
        $contribution = $calculator->calculate($surveyData);
        
        $this->assertEquals(
            0.0,
            $contribution,
            'Best case scenario (owns lot, owns house, not temporary) should contribute exactly 0%'
        );
    }

    /**
     * Property test: Missing data defaults to best case (zero contribution).
     * 
     * For any survey data with missing household information fields, the
     * calculator should default to assuming ownership (best case).
     * 
     * @test
     */
    public function missing_data_defaults_to_best_case(): void
    {
        $calculator = new HouseholdInfoCalculator();
        
        // Test with empty survey data
        $contribution = $calculator->calculate([]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Missing household information should default to 0% contribution'
        );
        
        // Test with partial data
        $contribution = $calculator->calculate(['owns_lot' => false]);
        
        // Use epsilon comparison for floating point equality
        $epsilon = 0.0001;
        $this->assertLessThan(
            $epsilon,
            abs(2.8 - $contribution),
            'Partial data (only owns_lot=false) should contribute 2.8%'
        );
    }

    /**
     * Property test: All contributions are within valid range.
     * 
     * For any combination of household information values, the contribution should be:
     * - Greater than or equal to 0%
     * - Less than or equal to the category weight (14%)
     * 
     * @test
     */
    public function all_contributions_are_within_valid_range(): void
    {
        $calculator = new HouseholdInfoCalculator();
        $testCases = $this->getHouseholdInfoCombinations();
        $categoryWeight = 14.0;
        
        foreach ($testCases as $testCase) {
            $surveyData = [
                'owns_lot' => $testCase['owns_lot'],
                'owns_house' => $testCase['owns_house'],
                'temporary_housing' => $testCase['temporary_housing'],
            ];
            
            $contribution = $calculator->calculate($surveyData);
            
            $this->assertGreaterThanOrEqual(
                0.0,
                $contribution,
                sprintf(
                    'Contribution should be >= 0%%, got %.2f%%',
                    $contribution
                )
            );
            
            // Use epsilon for floating point comparison
            $epsilon = 0.0001;
            $this->assertLessThan(
                $categoryWeight + $epsilon,
                $contribution,
                sprintf(
                    'Contribution should be <= %.2f%%, got %.2f%%',
                    $categoryWeight,
                    $contribution
                )
            );
        }
    }

    /**
     * Property test: Calculation is deterministic.
     * 
     * For any combination of household information values, calculating the
     * contribution multiple times should always return the same result.
     * 
     * @test
     */
    public function calculation_is_deterministic(): void
    {
        $calculator = new HouseholdInfoCalculator();
        $testCases = $this->getHouseholdInfoCombinations();
        $iterations = 100;
        
        foreach ($testCases as $testCase) {
            $surveyData = [
                'owns_lot' => $testCase['owns_lot'],
                'owns_house' => $testCase['owns_house'],
                'temporary_housing' => $testCase['temporary_housing'],
            ];
            
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
                        'Calculation should be deterministic. Iteration %d returned %.2f%%, expected %.2f%%',
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
     * The HouseholdInfoCalculator should report its weight as 0.14 (14%).
     * 
     * @test
     */
    public function calculator_weight_is_correct(): void
    {
        $calculator = new HouseholdInfoCalculator();
        
        $this->assertEquals(
            0.14,
            $calculator->getWeight(),
            'HouseholdInfoCalculator weight should be 0.14 (14%)'
        );
    }

    /**
     * Property test: Calculator name is correct.
     * 
     * The HouseholdInfoCalculator should report its name as "Household Information".
     * 
     * @test
     */
    public function calculator_name_is_correct(): void
    {
        $calculator = new HouseholdInfoCalculator();
        
        $this->assertEquals(
            'Household Information',
            $calculator->getName(),
            'HouseholdInfoCalculator name should be "Household Information"'
        );
    }
}
