<?php

namespace App\Services\Scoring;

class ElectricitySourceCalculator implements CategoryCalculatorInterface
{
    private const WEIGHT = 0.14; // 14%
    
    private const ELECTRICITY_SOURCE_SCORES = [
        'Candle/Lamp' => 0.30,              // 30% of category weight
        'Tapping to the neighbor' => 0.25,  // 25% of category weight
        'Solar Panel' => 0.20,              // 20% of category weight
        'With own meter' => 0.15,           // 15% of category weight
        'Others' => 0.10,                   // 10% of category weight
    ];
    
    public function calculate(array $surveyData): float
    {
        $electricitySource = $surveyData['electricity_source'] ?? null;
        
        if ($electricitySource === null) {
            return 0.0;
        }
        
        $internalScore = self::ELECTRICITY_SOURCE_SCORES[$electricitySource] ?? 0.0;
        return $internalScore * self::WEIGHT * 100; // Convert to percentage points
    }
    
    public function getWeight(): float
    {
        return self::WEIGHT;
    }
    
    public function getName(): string
    {
        return 'Source of Electricity';
    }
}
