<?php

namespace Tests\Unit\Scoring;

use PHPUnit\Framework\TestCase;
use App\Services\Scoring\ToiletTypeCalculator;

/**
 * Property-Based Test for Toilet Type Scoring Correctness
 * 
 * Feature: beneficiary-scoring-system, Property 8: Toilet Type Scoring Correctness
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 * 
 * Property: For any valid toilet type value, the ToiletTypeCalculator should 
 * return the correct contribution based on sanitation facilities quality.
 * 
 * This test validates that the toilet type scoring follows the exact requirements
 * specification, where lack of proper sanitation receives higher priority scores.
 */
class ToiletTypeScoringPropertyTest extends TestCase
{
    /**
     * Get all valid toilet types with their expected contributions
     * 
     * @return array<string, array{toilet_type: string, expected_contribution: float}>
     */
    private function getToiletTypeTestCases(): array
    {
        return [
            'No Toilet' => [
                'toilet_type' => 'No Toilet',
                'expected_contribution' => 5.6,  // 40% of 14%
            ],
            'Open Pit/Antipolo' => [
                'toilet_type' => 'Open Pit/Antipolo',
                'expected_contribution' => 4.2,  // 30% of 14%
            ],
            'Water Sealed' => [
                'toilet_type' => 'Water Sealed',
                'expected_contribution' => 2.8,  // 20% of 14%
            ],
            'Others' => [
                'toilet_type' => 'Others',
                'expected_contribution' => 1.4,  // 10% of 14%
            ],
        ];
    }

    /**
     * Property test: Each toilet type produces exact expected contribution.
     * 
     * For any valid toilet type value, the calculator should return the
     * exact contribution specified in the requirements.
     * 
     * @test
     */
    public function each_toilet_type_produces_exact_contribution(): void
    {
        $calculator = new ToiletTypeCalculator();
        $testCases = $this->getToiletTypeTestCases();
        
        foreach ($testCases as $key => $testCase) {
            $surveyData = ['toilet_type' => $testCase['toilet_type']];
            $actualContribution = $calculator->calculate($surveyData);
            $expectedContribution = $testCase['expected_contribution'];
            
            // Use epsilon comparison for floating point equality
            $epsilon = 0.0001;
            $this->assertLessThan(
                $epsilon,
                abs($expectedContribution - $actualContribution),
                sprintf(
                    'Toilet type "%s" should contribute exactly %.2f%%, got %.2f%%',
                    $testCase['toilet_type'],
                    $expectedContribution,
                    $actualContribution
                )
            );
        }
    }

    /**
     * Property test: Worse sanitation produces higher scores.
     * 
     * For any two toilet types where one represents worse sanitation than the other,
     * the worse sanitation should produce a higher or equal contribution.
     * 
     * @test
     */
    public function worse_sanitation_produces_higher_scores(): void
    {
        $calculator = new ToiletTypeCalculator();
        
        // Toilet types in order from worst to best sanitation
        $orderedToiletTypes = [
            'No Toilet',
            'Open Pit/Antipolo',
            'Water Sealed',
            'Others',
        ];
        
        for ($i = 0; $i < count($orderedToiletTypes) - 1; $i++) {
            $worseSanitation = $orderedToiletTypes[$i];
            $betterSanitation = $orderedToiletTypes[$i + 1];
            
            $worseSanitationContribution = $calculator->calculate([
                'toilet_type' => $worseSanitation
            ]);
            
            $betterSanitationContribution = $calculator->calculate([
                'toilet_type' => $betterSanitation
            ]);
            
            $this->assertGreaterThanOrEqual(
                $betterSanitationContribution,
                $worseSanitationContribution,
                sprintf(
                    'Worse sanitation "%s" (%.2f%%) should have higher or equal contribution than "%s" (%.2f%%)',
                    $worseSanitation,
                    $worseSanitationContribution,
                    $betterSanitation,
                    $betterSanitationContribution
                )
            );
        }
    }

    /**
     * Property test: No Toilet produces highest score.
     * 
     * For any toilet type, No Toilet should produce the highest contribution.
     * 
     * @test
     */
    public function no_toilet_produces_highest_score(): void
    {
        $calculator = new ToiletTypeCalculator();
        $testCases = $this->getToiletTypeTestCases();
        
        $noToiletContribution = $calculator->calculate([
            'toilet_type' => 'No Toilet'
        ]);
        
        foreach ($testCases as $testCase) {
            if ($testCase['toilet_type'] === 'No Toilet') {
                continue;
            }
            
            $otherContribution = $calculator->calculate([
                'toilet_type' => $testCase['toilet_type']
            ]);
            
            $this->assertGreaterThan(
                $otherContribution,
                $noToiletContribution,
                sprintf(
                    'No Toilet (%.2f%%) should have higher contribution than "%s" (%.2f%%)',
                    $noToiletContribution,
                    $testCase['toilet_type'],
                    $otherContribution
                )
            );
        }
    }

    /**
     * Property test: Water Sealed produces lowest score (excluding Others).
     * 
     * For any toilet type except Others, Water Sealed should produce
     * the lowest contribution.
     * 
     * @test
     */
    public function water_sealed_produces_lowest_score_excluding_others(): void
    {
        $calculator = new ToiletTypeCalculator();
        $testCases = $this->getToiletTypeTestCases();
        
        $waterSealedContribution = $calculator->calculate([
            'toilet_type' => 'Water Sealed'
        ]);
        
        foreach ($testCases as $testCase) {
            if ($testCase['toilet_type'] === 'Water Sealed' || 
                $testCase['toilet_type'] === 'Others') {
                continue;
            }
            
            $otherContribution = $calculator->calculate([
                'toilet_type' => $testCase['toilet_type']
            ]);
            
            $this->assertLessThan(
                $otherContribution,
                $waterSealedContribution,
                sprintf(
                    'Water Sealed (%.2f%%) should have lower contribution than "%s" (%.2f%%)',
                    $waterSealedContribution,
                    $testCase['toilet_type'],
                    $otherContribution
                )
            );
        }
    }

    /**
     * Property test: Missing toilet type returns 0% contribution.
     * 
     * For any survey data without a toilet_type field, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function missing_toilet_type_returns_zero_contribution(): void
    {
        $calculator = new ToiletTypeCalculator();
        
        // Test with empty survey data
        $contribution = $calculator->calculate([]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Missing toilet_type should contribute 0%'
        );
        
        // Test with null toilet_type
        $contribution = $calculator->calculate(['toilet_type' => null]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Null toilet_type should contribute 0%'
        );
    }

    /**
     * Property test: Invalid toilet type returns 0% contribution.
     * 
     * For any survey data with an invalid toilet_type value, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function invalid_toilet_type_returns_zero_contribution(): void
    {
        $calculator = new ToiletTypeCalculator();
        
        $invalidToiletTypes = [
            'invalid',
            'Unknown',
            '',
            'Flush',
            'Composting',
            'Portable',
        ];
        
        foreach ($invalidToiletTypes as $invalidToiletType) {
            $contribution = $calculator->calculate(['toilet_type' => $invalidToiletType]);
            $this->assertEquals(
                0.0,
                $contribution,
                sprintf('Invalid toilet_type "%s" should contribute 0%%', $invalidToiletType)
            );
        }
    }

    /**
     * Property test: All contributions are within valid range.
     * 
     * For any toilet type value, the contribution should be:
     * - Greater than or equal to 0%
     * - Less than or equal to the category weight (14%)
     * 
     * @test
     */
    public function all_contributions_are_within_valid_range(): void
    {
        $calculator = new ToiletTypeCalculator();
        $testCases = $this->getToiletTypeTestCases();
        $categoryWeight = 14.0; // 14% weight for toilet type category
        
        foreach ($testCases as $testCase) {
            $surveyData = ['toilet_type' => $testCase['toilet_type']];
            $contribution = $calculator->calculate($surveyData);
            
            $this->assertGreaterThanOrEqual(
                0.0,
                $contribution,
                sprintf(
                    'Contribution for toilet_type "%s" should be >= 0%%, got %.2f%%',
                    $testCase['toilet_type'],
                    $contribution
                )
            );
            
            $this->assertLessThanOrEqual(
                $categoryWeight,
                $contribution,
                sprintf(
                    'Contribution for toilet_type "%s" should be <= %.2f%%, got %.2f%%',
                    $testCase['toilet_type'],
                    $categoryWeight,
                    $contribution
                )
            );
        }
    }

    /**
     * Property test: Calculation is deterministic.
     * 
     * For any toilet type value, calculating the contribution multiple times
     * should always return the same result.
     * 
     * @test
     */
    public function calculation_is_deterministic(): void
    {
        $calculator = new ToiletTypeCalculator();
        $testCases = $this->getToiletTypeTestCases();
        $iterations = 100;
        
        foreach ($testCases as $testCase) {
            $surveyData = ['toilet_type' => $testCase['toilet_type']];
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
                        'Calculation for toilet_type "%s" should be deterministic. Iteration %d returned %.2f%%, expected %.2f%%',
                        $testCase['toilet_type'],
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
     * The ToiletTypeCalculator should report its weight as 0.14 (14%).
     * 
     * @test
     */
    public function calculator_weight_is_correct(): void
    {
        $calculator = new ToiletTypeCalculator();
        
        $this->assertEquals(
            0.14,
            $calculator->getWeight(),
            'ToiletTypeCalculator weight should be 0.14 (14%)'
        );
    }

    /**
     * Property test: Calculator name is correct.
     * 
     * The ToiletTypeCalculator should report its name as "Type of Toilet".
     * 
     * @test
     */
    public function calculator_name_is_correct(): void
    {
        $calculator = new ToiletTypeCalculator();
        
        $this->assertEquals(
            'Type of Toilet',
            $calculator->getName(),
            'ToiletTypeCalculator name should be "Type of Toilet"'
        );
    }
}
