<?php

namespace App\Services\Scoring;

class IncomeRangeCalculator implements CategoryCalculatorInterface
{
    private const WEIGHT = 0.15; // 15%
    
    private const INCOME_SCORES = [
        '0-2999' => 0.30,      // 30% of category weight
        '3000-5999' => 0.25,   // 25% of category weight
        '6000-8999' => 0.20,   // 20% of category weight
        '9000-12999' => 0.15,  // 15% of category weight
        '13000+' => 0.10,      // 10% of category weight
    ];
    
    public function calculate(array $surveyData): float
    {
        $incomeRange = $surveyData['income_range'] ?? null;
        
        if ($incomeRange === null) {
            return 0.0;
        }
        
        $internalScore = self::INCOME_SCORES[$incomeRange] ?? 0.0;
        return $internalScore * self::WEIGHT * 100; // Convert to percentage points
    }
    
    public function getWeight(): float
    {
        return self::WEIGHT;
    }
    
    public function getName(): string
    {
        return 'Income Range';
    }
}
