<?php

namespace App\Services\Scoring;

class WaterSourceCalculator implements CategoryCalculatorInterface
{
    private const WEIGHT = 0.14; // 14%
    
    private const WATER_SOURCE_SCORES = [
        'Surface water (river, lake, dam)' => 0.30,  // 30% of category weight
        'Rainwater' => 0.25,                         // 25% of category weight
        'Spring' => 0.20,                            // 20% of category weight
        'Deep Well' => 0.15,                         // 15% of category weight
        'Others' => 0.06,                            // 6% of category weight
        'Community Water System (NAWASA)' => 0.04,   // 4% of category weight
    ];
    
    public function calculate(array $surveyData): float
    {
        $waterSource = $surveyData['water_source'] ?? null;
        
        if ($waterSource === null) {
            return 0.0;
        }
        
        $internalScore = self::WATER_SOURCE_SCORES[$waterSource] ?? 0.0;
        return $internalScore * self::WEIGHT * 100; // Convert to percentage points
    }
    
    public function getWeight(): float
    {
        return self::WEIGHT;
    }
    
    public function getName(): string
    {
        return 'Source of Water';
    }
}
