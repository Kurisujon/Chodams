<?php

namespace Tests\Unit\Scoring;

use PHPUnit\Framework\TestCase;
use App\Services\Scoring\IncomeRangeCalculator;

/**
 * Property-Based Test for Income Range Scoring Correctness
 * 
 * Feature: beneficiary-scoring-system, Property 4: Income Range Scoring Correctness
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 * 
 * Property: For any valid income range value, the IncomeRangeCalculator should 
 * return the correct contribution: ₱0-2,999 → 4.5%, ₱3,000-5,999 → 3.75%, 
 * ₱6,000-8,999 → 3%, ₱9,000-12,999 → 2.25%, ₱13,000+ → 1.5%.
 * 
 * This test validates that the income range scoring follows the exact requirements
 * specification, where lower income ranges receive higher priority scores.
 */
class IncomeRangeScoringPropertyTest extends TestCase
{
    /**
     * Get all valid income ranges with their expected contributions
     * 
     * @return array<string, array{income_range: string, expected_contribution: float}>
     */
    private function getIncomeRangeTestCases(): array
    {
        return [
            '0-2999' => [
                'income_range' => '0-2999',
                'expected_contribution' => 4.5,  // 30% of 15%
            ],
            '3000-5999' => [
                'income_range' => '3000-5999',
                'expected_contribution' => 3.75, // 25% of 15%
            ],
            '6000-8999' => [
                'income_range' => '6000-8999',
                'expected_contribution' => 3.0,  // 20% of 15%
            ],
            '9000-12999' => [
                'income_range' => '9000-12999',
                'expected_contribution' => 2.25, // 15% of 15%
            ],
            '13000+' => [
                'income_range' => '13000+',
                'expected_contribution' => 1.5,  // 10% of 15%
            ],
        ];
    }

    /**
     * Property test: Each income range produces exact expected contribution.
     * 
     * For any valid income range value, the calculator should return the
     * exact contribution specified in the requirements.
     * 
     * @test
     */
    public function each_income_range_produces_exact_contribution(): void
    {
        $calculator = new IncomeRangeCalculator();
        $testCases = $this->getIncomeRangeTestCases();
        
        foreach ($testCases as $key => $testCase) {
            $surveyData = ['income_range' => $testCase['income_range']];
            $actualContribution = $calculator->calculate($surveyData);
            $expectedContribution = $testCase['expected_contribution'];
            
            $this->assertEquals(
                $expectedContribution,
                $actualContribution,
                sprintf(
                    'Income range "%s" should contribute exactly %.2f%%, got %.2f%%',
                    $testCase['income_range'],
                    $expectedContribution,
                    $actualContribution
                )
            );
        }
    }

    /**
     * Property test: Lower income ranges produce higher scores.
     * 
     * For any two income ranges where one represents lower income than the other,
     * the lower income range should produce a higher or equal contribution.
     * 
     * @test
     */
    public function lower_income_ranges_produce_higher_scores(): void
    {
        $calculator = new IncomeRangeCalculator();
        $testCases = $this->getIncomeRangeTestCases();
        
        // Income ranges in order from lowest to highest
        $orderedRanges = ['0-2999', '3000-5999', '6000-8999', '9000-12999', '13000+'];
        
        for ($i = 0; $i < count($orderedRanges) - 1; $i++) {
            $lowerIncomeRange = $orderedRanges[$i];
            $higherIncomeRange = $orderedRanges[$i + 1];
            
            $lowerIncomeContribution = $calculator->calculate([
                'income_range' => $lowerIncomeRange
            ]);
            
            $higherIncomeContribution = $calculator->calculate([
                'income_range' => $higherIncomeRange
            ]);
            
            $this->assertGreaterThanOrEqual(
                $higherIncomeContribution,
                $lowerIncomeContribution,
                sprintf(
                    'Lower income range "%s" (%.2f%%) should have higher or equal contribution than "%s" (%.2f%%)',
                    $lowerIncomeRange,
                    $lowerIncomeContribution,
                    $higherIncomeRange,
                    $higherIncomeContribution
                )
            );
        }
    }

    /**
     * Property test: Missing income range returns 0% contribution.
     * 
     * For any survey data without an income_range field, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function missing_income_range_returns_zero_contribution(): void
    {
        $calculator = new IncomeRangeCalculator();
        
        // Test with empty survey data
        $contribution = $calculator->calculate([]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Missing income_range should contribute 0%'
        );
        
        // Test with null income_range
        $contribution = $calculator->calculate(['income_range' => null]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Null income_range should contribute 0%'
        );
    }

    /**
     * Property test: Invalid income range returns 0% contribution.
     * 
     * For any survey data with an invalid income_range value, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function invalid_income_range_returns_zero_contribution(): void
    {
        $calculator = new IncomeRangeCalculator();
        
        $invalidRanges = [
            'invalid',
            '0-1000',
            '100000+',
            '',
            '999',
            'negative',
        ];
        
        foreach ($invalidRanges as $invalidRange) {
            $contribution = $calculator->calculate(['income_range' => $invalidRange]);
            $this->assertEquals(
                0.0,
                $contribution,
                sprintf('Invalid income_range "%s" should contribute 0%%', $invalidRange)
            );
        }
    }

    /**
     * Property test: All contributions are within valid range.
     * 
     * For any income range value, the contribution should be:
     * - Greater than or equal to 0%
     * - Less than or equal to the category weight (15%)
     * 
     * @test
     */
    public function all_contributions_are_within_valid_range(): void
    {
        $calculator = new IncomeRangeCalculator();
        $testCases = $this->getIncomeRangeTestCases();
        $categoryWeight = 15.0; // 15% weight for income range category
        
        foreach ($testCases as $testCase) {
            $surveyData = ['income_range' => $testCase['income_range']];
            $contribution = $calculator->calculate($surveyData);
            
            $this->assertGreaterThanOrEqual(
                0.0,
                $contribution,
                sprintf(
                    'Contribution for income_range "%s" should be >= 0%%, got %.2f%%',
                    $testCase['income_range'],
                    $contribution
                )
            );
            
            $this->assertLessThanOrEqual(
                $categoryWeight,
                $contribution,
                sprintf(
                    'Contribution for income_range "%s" should be <= %.2f%%, got %.2f%%',
                    $testCase['income_range'],
                    $categoryWeight,
                    $contribution
                )
            );
        }
    }

    /**
     * Property test: Calculation is deterministic.
     * 
     * For any income range value, calculating the contribution multiple times
     * should always return the same result.
     * 
     * @test
     */
    public function calculation_is_deterministic(): void
    {
        $calculator = new IncomeRangeCalculator();
        $testCases = $this->getIncomeRangeTestCases();
        $iterations = 100;
        
        foreach ($testCases as $testCase) {
            $surveyData = ['income_range' => $testCase['income_range']];
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
                        'Calculation for income_range "%s" should be deterministic. Iteration %d returned %.2f%%, expected %.2f%%',
                        $testCase['income_range'],
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
     * The IncomeRangeCalculator should report its weight as 0.15 (15%).
     * 
     * @test
     */
    public function calculator_weight_is_correct(): void
    {
        $calculator = new IncomeRangeCalculator();
        
        $this->assertEquals(
            0.15,
            $calculator->getWeight(),
            'IncomeRangeCalculator weight should be 0.15 (15%)'
        );
    }

    /**
     * Property test: Calculator name is correct.
     * 
     * The IncomeRangeCalculator should report its name as "Income Range".
     * 
     * @test
     */
    public function calculator_name_is_correct(): void
    {
        $calculator = new IncomeRangeCalculator();
        
        $this->assertEquals(
            'Income Range',
            $calculator->getName(),
            'IncomeRangeCalculator name should be "Income Range"'
        );
    }
}
