<?php

namespace Tests\Unit\Scoring;

use PHPUnit\Framework\TestCase;
use App\Services\Scoring\ClassificationCalculator;

/**
 * Property-Based Test for Classification Scoring Correctness
 * 
 * Feature: beneficiary-scoring-system, Property 5: Classification Scoring Correctness
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * Property: For any valid classification value, the ClassificationCalculator should 
 * return the correct contribution: Homeless → 7.5%, Displaced → 3.75%, 
 * Double-up → 2.25%, Upgrading of land tenure → 1.5%.
 * 
 * This test validates that the classification scoring follows the exact requirements
 * specification, where homeless individuals receive the highest priority scores.
 */
class ClassificationScoringPropertyTest extends TestCase
{
    /**
     * Get all valid classifications with their expected contributions
     * 
     * @return array<string, array{classification: string, expected_contribution: float}>
     */
    private function getClassificationTestCases(): array
    {
        return [
            'Homeless' => [
                'classification' => 'Homeless',
                'expected_contribution' => 7.5,  // 50% of 15%
            ],
            'Displaced' => [
                'classification' => 'Displaced',
                'expected_contribution' => 3.75, // 25% of 15%
            ],
            'Double-up' => [
                'classification' => 'Double-up',
                'expected_contribution' => 2.25, // 15% of 15%
            ],
            'Upgrading of land tenure' => [
                'classification' => 'Upgrading of land tenure',
                'expected_contribution' => 1.5,  // 10% of 15%
            ],
        ];
    }

    /**
     * Property test: Each classification produces exact expected contribution.
     * 
     * For any valid classification value, the calculator should return the
     * exact contribution specified in the requirements.
     * 
     * @test
     */
    public function each_classification_produces_exact_contribution(): void
    {
        $calculator = new ClassificationCalculator();
        $testCases = $this->getClassificationTestCases();
        
        foreach ($testCases as $key => $testCase) {
            $surveyData = ['classification' => $testCase['classification']];
            $actualContribution = $calculator->calculate($surveyData);
            $expectedContribution = $testCase['expected_contribution'];
            
            $this->assertEquals(
                $expectedContribution,
                $actualContribution,
                sprintf(
                    'Classification "%s" should contribute exactly %.2f%%, got %.2f%%',
                    $testCase['classification'],
                    $expectedContribution,
                    $actualContribution
                )
            );
        }
    }

    /**
     * Property test: Homeless classification produces highest score.
     * 
     * For any classification, the Homeless classification should produce
     * the highest contribution.
     * 
     * @test
     */
    public function homeless_classification_produces_highest_score(): void
    {
        $calculator = new ClassificationCalculator();
        $testCases = $this->getClassificationTestCases();
        
        $homelessContribution = $calculator->calculate(['classification' => 'Homeless']);
        
        foreach ($testCases as $testCase) {
            if ($testCase['classification'] === 'Homeless') {
                continue;
            }
            
            $otherContribution = $calculator->calculate([
                'classification' => $testCase['classification']
            ]);
            
            $this->assertGreaterThan(
                $otherContribution,
                $homelessContribution,
                sprintf(
                    'Homeless classification (%.2f%%) should have higher contribution than "%s" (%.2f%%)',
                    $homelessContribution,
                    $testCase['classification'],
                    $otherContribution
                )
            );
        }
    }

    /**
     * Property test: Classifications are ordered by housing need severity.
     * 
     * For any two classifications, the one representing greater housing need
     * should produce a higher or equal contribution.
     * 
     * @test
     */
    public function classifications_ordered_by_housing_need_severity(): void
    {
        $calculator = new ClassificationCalculator();
        
        // Classifications in order from highest to lowest need
        $orderedClassifications = [
            'Homeless',
            'Displaced',
            'Double-up',
            'Upgrading of land tenure'
        ];
        
        for ($i = 0; $i < count($orderedClassifications) - 1; $i++) {
            $higherNeed = $orderedClassifications[$i];
            $lowerNeed = $orderedClassifications[$i + 1];
            
            $higherNeedContribution = $calculator->calculate([
                'classification' => $higherNeed
            ]);
            
            $lowerNeedContribution = $calculator->calculate([
                'classification' => $lowerNeed
            ]);
            
            $this->assertGreaterThanOrEqual(
                $lowerNeedContribution,
                $higherNeedContribution,
                sprintf(
                    'Higher need classification "%s" (%.2f%%) should have higher or equal contribution than "%s" (%.2f%%)',
                    $higherNeed,
                    $higherNeedContribution,
                    $lowerNeed,
                    $lowerNeedContribution
                )
            );
        }
    }

    /**
     * Property test: Missing classification returns 0% contribution.
     * 
     * For any survey data without a classification field, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function missing_classification_returns_zero_contribution(): void
    {
        $calculator = new ClassificationCalculator();
        
        // Test with empty survey data
        $contribution = $calculator->calculate([]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Missing classification should contribute 0%'
        );
        
        // Test with null classification
        $contribution = $calculator->calculate(['classification' => null]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Null classification should contribute 0%'
        );
    }

    /**
     * Property test: Invalid classification returns 0% contribution.
     * 
     * For any survey data with an invalid classification value, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function invalid_classification_returns_zero_contribution(): void
    {
        $calculator = new ClassificationCalculator();
        
        $invalidClassifications = [
            'invalid',
            'Unknown',
            '',
            'Renter',
            'Owner',
            'Squatter',
        ];
        
        foreach ($invalidClassifications as $invalidClassification) {
            $contribution = $calculator->calculate(['classification' => $invalidClassification]);
            $this->assertEquals(
                0.0,
                $contribution,
                sprintf('Invalid classification "%s" should contribute 0%%', $invalidClassification)
            );
        }
    }

    /**
     * Property test: All contributions are within valid range.
     * 
     * For any classification value, the contribution should be:
     * - Greater than or equal to 0%
     * - Less than or equal to the category weight (15%)
     * 
     * @test
     */
    public function all_contributions_are_within_valid_range(): void
    {
        $calculator = new ClassificationCalculator();
        $testCases = $this->getClassificationTestCases();
        $categoryWeight = 15.0; // 15% weight for classification category
        
        foreach ($testCases as $testCase) {
            $surveyData = ['classification' => $testCase['classification']];
            $contribution = $calculator->calculate($surveyData);
            
            $this->assertGreaterThanOrEqual(
                0.0,
                $contribution,
                sprintf(
                    'Contribution for classification "%s" should be >= 0%%, got %.2f%%',
                    $testCase['classification'],
                    $contribution
                )
            );
            
            $this->assertLessThanOrEqual(
                $categoryWeight,
                $contribution,
                sprintf(
                    'Contribution for classification "%s" should be <= %.2f%%, got %.2f%%',
                    $testCase['classification'],
                    $categoryWeight,
                    $contribution
                )
            );
        }
    }

    /**
     * Property test: Calculation is deterministic.
     * 
     * For any classification value, calculating the contribution multiple times
     * should always return the same result.
     * 
     * @test
     */
    public function calculation_is_deterministic(): void
    {
        $calculator = new ClassificationCalculator();
        $testCases = $this->getClassificationTestCases();
        $iterations = 100;
        
        foreach ($testCases as $testCase) {
            $surveyData = ['classification' => $testCase['classification']];
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
                        'Calculation for classification "%s" should be deterministic. Iteration %d returned %.2f%%, expected %.2f%%',
                        $testCase['classification'],
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
     * The ClassificationCalculator should report its weight as 0.15 (15%).
     * 
     * @test
     */
    public function calculator_weight_is_correct(): void
    {
        $calculator = new ClassificationCalculator();
        
        $this->assertEquals(
            0.15,
            $calculator->getWeight(),
            'ClassificationCalculator weight should be 0.15 (15%)'
        );
    }

    /**
     * Property test: Calculator name is correct.
     * 
     * The ClassificationCalculator should report its name as "Classification".
     * 
     * @test
     */
    public function calculator_name_is_correct(): void
    {
        $calculator = new ClassificationCalculator();
        
        $this->assertEquals(
            'Classification',
            $calculator->getName(),
            'ClassificationCalculator name should be "Classification"'
        );
    }
}
