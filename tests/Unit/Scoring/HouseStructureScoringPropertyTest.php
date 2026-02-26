<?php

namespace Tests\Unit\Scoring;

use PHPUnit\Framework\TestCase;
use App\Services\Scoring\HouseStructureCalculator;

/**
 * Property-Based Test for House Structure Scoring Correctness
 * 
 * Feature: beneficiary-scoring-system, Property 7: House Structure Scoring Correctness
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9
 * 
 * Property: For any valid house structure value, the HouseStructureCalculator should 
 * return the correct contribution based on the building materials and their safety/quality.
 * 
 * This test validates that the house structure scoring follows the exact requirements
 * specification, where substandard housing receives higher priority scores.
 */
class HouseStructureScoringPropertyTest extends TestCase
{
    /**
     * Get all valid house structures with their expected contributions
     * 
     * @return array<string, array{house_structure: string, expected_contribution: float}>
     */
    private function getHouseStructureTestCases(): array
    {
        return [
            'Makeshift/Salvaged/Improvised material' => [
                'house_structure' => 'Makeshift/Salvaged/Improvised material',
                'expected_contribution' => 4.2,  // 30% of 14%
            ],
            'Made of Amakan and Nipa' => [
                'house_structure' => 'Made of Amakan and Nipa',
                'expected_contribution' => 3.5,  // 25% of 14%
            ],
            'Made of Amakan and metal roof' => [
                'house_structure' => 'Made of Amakan and metal roof',
                'expected_contribution' => 2.1,  // 15% of 14%
            ],
            'Made of wood and metal roof' => [
                'house_structure' => 'Made of wood and metal roof',
                'expected_contribution' => 2.1,  // 15% of 14%
            ],
            'Combination of concrete and wood' => [
                'house_structure' => 'Combination of concrete and wood',
                'expected_contribution' => 1.4,  // 10% of 14%
            ],
            'Full Concrete' => [
                'house_structure' => 'Full Concrete',
                'expected_contribution' => 0.42, // 3% of 14%
            ],
            'Others' => [
                'house_structure' => 'Others',
                'expected_contribution' => 0.28, // 2% of 14%
            ],
        ];
    }

    /**
     * Property test: Each house structure produces exact expected contribution.
     * 
     * For any valid house structure value, the calculator should return the
     * exact contribution specified in the requirements.
     * 
     * @test
     */
    public function each_house_structure_produces_exact_contribution(): void
    {
        $calculator = new HouseStructureCalculator();
        $testCases = $this->getHouseStructureTestCases();
        
        foreach ($testCases as $key => $testCase) {
            $surveyData = ['house_structure' => $testCase['house_structure']];
            $actualContribution = $calculator->calculate($surveyData);
            $expectedContribution = $testCase['expected_contribution'];
            
            // Use epsilon comparison for floating point equality
            $epsilon = 0.0001;
            $this->assertLessThan(
                $epsilon,
                abs($expectedContribution - $actualContribution),
                sprintf(
                    'House structure "%s" should contribute exactly %.2f%%, got %.2f%%',
                    $testCase['house_structure'],
                    $expectedContribution,
                    $actualContribution
                )
            );
        }
    }

    /**
     * Property test: Substandard structures produce higher scores.
     * 
     * For any two house structures where one is more substandard than the other,
     * the more substandard structure should produce a higher or equal contribution.
     * 
     * @test
     */
    public function substandard_structures_produce_higher_scores(): void
    {
        $calculator = new HouseStructureCalculator();
        
        // House structures in order from most to least substandard
        $orderedStructures = [
            'Makeshift/Salvaged/Improvised material',
            'Made of Amakan and Nipa',
            'Made of Amakan and metal roof',
            'Made of wood and metal roof',
            'Combination of concrete and wood',
            'Full Concrete',
            'Others',
        ];
        
        for ($i = 0; $i < count($orderedStructures) - 1; $i++) {
            $moreSubstandard = $orderedStructures[$i];
            $lessSubstandard = $orderedStructures[$i + 1];
            
            $moreSubstandardContribution = $calculator->calculate([
                'house_structure' => $moreSubstandard
            ]);
            
            $lessSubstandardContribution = $calculator->calculate([
                'house_structure' => $lessSubstandard
            ]);
            
            $this->assertGreaterThanOrEqual(
                $lessSubstandardContribution,
                $moreSubstandardContribution,
                sprintf(
                    'More substandard structure "%s" (%.2f%%) should have higher or equal contribution than "%s" (%.2f%%)',
                    $moreSubstandard,
                    $moreSubstandardContribution,
                    $lessSubstandard,
                    $lessSubstandardContribution
                )
            );
        }
    }

    /**
     * Property test: Makeshift/Salvaged/Improvised produces highest score.
     * 
     * For any house structure, Makeshift/Salvaged/Improvised material should
     * produce the highest contribution.
     * 
     * @test
     */
    public function makeshift_structure_produces_highest_score(): void
    {
        $calculator = new HouseStructureCalculator();
        $testCases = $this->getHouseStructureTestCases();
        
        $makeshiftContribution = $calculator->calculate([
            'house_structure' => 'Makeshift/Salvaged/Improvised material'
        ]);
        
        foreach ($testCases as $testCase) {
            if ($testCase['house_structure'] === 'Makeshift/Salvaged/Improvised material') {
                continue;
            }
            
            $otherContribution = $calculator->calculate([
                'house_structure' => $testCase['house_structure']
            ]);
            
            $this->assertGreaterThan(
                $otherContribution,
                $makeshiftContribution,
                sprintf(
                    'Makeshift structure (%.2f%%) should have higher contribution than "%s" (%.2f%%)',
                    $makeshiftContribution,
                    $testCase['house_structure'],
                    $otherContribution
                )
            );
        }
    }

    /**
     * Property test: Full Concrete produces lowest score (excluding Others).
     * 
     * For any house structure except Others, Full Concrete should produce
     * the lowest contribution.
     * 
     * @test
     */
    public function full_concrete_produces_lowest_score_excluding_others(): void
    {
        $calculator = new HouseStructureCalculator();
        $testCases = $this->getHouseStructureTestCases();
        
        $concreteContribution = $calculator->calculate([
            'house_structure' => 'Full Concrete'
        ]);
        
        foreach ($testCases as $testCase) {
            if ($testCase['house_structure'] === 'Full Concrete' || 
                $testCase['house_structure'] === 'Others') {
                continue;
            }
            
            $otherContribution = $calculator->calculate([
                'house_structure' => $testCase['house_structure']
            ]);
            
            $this->assertLessThan(
                $otherContribution,
                $concreteContribution,
                sprintf(
                    'Full Concrete (%.2f%%) should have lower contribution than "%s" (%.2f%%)',
                    $concreteContribution,
                    $testCase['house_structure'],
                    $otherContribution
                )
            );
        }
    }

    /**
     * Property test: Missing house structure returns 0% contribution.
     * 
     * For any survey data without a house_structure field, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function missing_house_structure_returns_zero_contribution(): void
    {
        $calculator = new HouseStructureCalculator();
        
        // Test with empty survey data
        $contribution = $calculator->calculate([]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Missing house_structure should contribute 0%'
        );
        
        // Test with null house_structure
        $contribution = $calculator->calculate(['house_structure' => null]);
        $this->assertEquals(
            0.0,
            $contribution,
            'Null house_structure should contribute 0%'
        );
    }

    /**
     * Property test: Invalid house structure returns 0% contribution.
     * 
     * For any survey data with an invalid house_structure value, the calculator
     * should return 0% contribution.
     * 
     * @test
     */
    public function invalid_house_structure_returns_zero_contribution(): void
    {
        $calculator = new HouseStructureCalculator();
        
        $invalidStructures = [
            'invalid',
            'Unknown',
            '',
            'Brick',
            'Stone',
            'Metal',
        ];
        
        foreach ($invalidStructures as $invalidStructure) {
            $contribution = $calculator->calculate(['house_structure' => $invalidStructure]);
            $this->assertEquals(
                0.0,
                $contribution,
                sprintf('Invalid house_structure "%s" should contribute 0%%', $invalidStructure)
            );
        }
    }

    /**
     * Property test: All contributions are within valid range.
     * 
     * For any house structure value, the contribution should be:
     * - Greater than or equal to 0%
     * - Less than or equal to the category weight (14%)
     * 
     * @test
     */
    public function all_contributions_are_within_valid_range(): void
    {
        $calculator = new HouseStructureCalculator();
        $testCases = $this->getHouseStructureTestCases();
        $categoryWeight = 14.0; // 14% weight for house structure category
        
        foreach ($testCases as $testCase) {
            $surveyData = ['house_structure' => $testCase['house_structure']];
            $contribution = $calculator->calculate($surveyData);
            
            $this->assertGreaterThanOrEqual(
                0.0,
                $contribution,
                sprintf(
                    'Contribution for house_structure "%s" should be >= 0%%, got %.2f%%',
                    $testCase['house_structure'],
                    $contribution
                )
            );
            
            $this->assertLessThanOrEqual(
                $categoryWeight,
                $contribution,
                sprintf(
                    'Contribution for house_structure "%s" should be <= %.2f%%, got %.2f%%',
                    $testCase['house_structure'],
                    $categoryWeight,
                    $contribution
                )
            );
        }
    }

    /**
     * Property test: Calculation is deterministic.
     * 
     * For any house structure value, calculating the contribution multiple times
     * should always return the same result.
     * 
     * @test
     */
    public function calculation_is_deterministic(): void
    {
        $calculator = new HouseStructureCalculator();
        $testCases = $this->getHouseStructureTestCases();
        $iterations = 100;
        
        foreach ($testCases as $testCase) {
            $surveyData = ['house_structure' => $testCase['house_structure']];
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
                        'Calculation for house_structure "%s" should be deterministic. Iteration %d returned %.2f%%, expected %.2f%%',
                        $testCase['house_structure'],
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
     * The HouseStructureCalculator should report its weight as 0.14 (14%).
     * 
     * @test
     */
    public function calculator_weight_is_correct(): void
    {
        $calculator = new HouseStructureCalculator();
        
        $this->assertEquals(
            0.14,
            $calculator->getWeight(),
            'HouseStructureCalculator weight should be 0.14 (14%)'
        );
    }

    /**
     * Property test: Calculator name is correct.
     * 
     * The HouseStructureCalculator should report its name as "House Structure".
     * 
     * @test
     */
    public function calculator_name_is_correct(): void
    {
        $calculator = new HouseStructureCalculator();
        
        $this->assertEquals(
            'House Structure',
            $calculator->getName(),
            'HouseStructureCalculator name should be "House Structure"'
        );
    }
}
