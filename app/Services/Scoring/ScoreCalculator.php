<?php

namespace App\Services\Scoring;

class ScoreCalculator
{
    /**
     * Calculate the priority score for a beneficiary
     * 
     * @param array $surveyData Associative array of survey responses
     * @return float Priority score (0-100)
     * @throws \InvalidArgumentException if weight validation fails
     */
    public function calculateScore(array $surveyData): float
    {
        // Validate that weights sum to 100%
        if (!$this->validateWeights()) {
            throw new \InvalidArgumentException('Category weights must sum to exactly 100%');
        }
        
        $totalScore = 0.0;
        
        // Iterate through all category calculators and sum their contributions
        foreach ($this->getCategoryCalculators() as $calculator) {
            $contribution = $calculator->calculate($surveyData);
            $totalScore += $contribution;
        }
        
        return $totalScore;
    }
    
    /**
     * Validate that category weights sum to 100%
     * 
     * @return bool
     */
    private function validateWeights(): bool
    {
        $totalWeight = 0.0;
        
        foreach ($this->getCategoryCalculators() as $calculator) {
            $totalWeight += $calculator->getWeight();
        }
        
        // Use epsilon comparison for floating point equality
        return abs($totalWeight - 1.0) < 0.0001;
    }
    
    /**
     * Get all category calculators
     * 
     * @return array<CategoryCalculatorInterface>
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
}
