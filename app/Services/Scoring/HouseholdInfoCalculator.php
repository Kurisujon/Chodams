<?php

namespace App\Services\Scoring;

class HouseholdInfoCalculator implements CategoryCalculatorInterface
{
    private const WEIGHT = 0.14; // 14%
    
    private const NOT_OWNS_LOT_SCORE = 0.20;        // 20% of category weight
    private const NOT_OWNS_HOUSE_SCORE = 0.30;      // 30% of category weight
    private const TEMPORARY_HOUSING_SCORE = 0.50;   // 50% of category weight
    
    public function calculate(array $surveyData): float
    {
        $internalScore = 0.0;
        
        // Add contribution if beneficiary does not own the lot
        $ownsLot = $surveyData['owns_lot'] ?? true;
        if (!$ownsLot) {
            $internalScore += self::NOT_OWNS_LOT_SCORE;
        }
        
        // Add contribution if beneficiary does not own the house
        $ownsHouse = $surveyData['owns_house'] ?? true;
        if (!$ownsHouse) {
            $internalScore += self::NOT_OWNS_HOUSE_SCORE;
        }
        
        // Add contribution if beneficiary lives in temporary housing
        $temporaryHousing = $surveyData['temporary_housing'] ?? false;
        if ($temporaryHousing) {
            $internalScore += self::TEMPORARY_HOUSING_SCORE;
        }
        
        // Maximum internal score is 1.0 (100%), which gives max 14% contribution
        return $internalScore * self::WEIGHT * 100; // Convert to percentage points
    }
    
    public function getWeight(): float
    {
        return self::WEIGHT;
    }
    
    public function getName(): string
    {
        return 'Household Information';
    }
}
