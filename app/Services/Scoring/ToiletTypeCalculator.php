<?php

namespace App\Services\Scoring;

class ToiletTypeCalculator implements CategoryCalculatorInterface
{
    private const WEIGHT = 0.14; // 14%
    
    private const TOILET_SCORES = [
        'No Toilet' => 0.40,           // 40% of category weight
        'Open Pit/Antipolo' => 0.30,   // 30% of category weight
        'Water Sealed' => 0.20,        // 20% of category weight
        'Others' => 0.10,              // 10% of category weight
    ];
    
    public function calculate(array $surveyData): float
    {
        $toiletType = $surveyData['toilet_type'] ?? null;
        
        if ($toiletType === null) {
            return 0.0;
        }
        
        $internalScore = self::TOILET_SCORES[$toiletType] ?? 0.0;
        return $internalScore * self::WEIGHT * 100; // Convert to percentage points
    }
    
    public function getWeight(): float
    {
        return self::WEIGHT;
    }
    
    public function getName(): string
    {
        return 'Type of Toilet';
    }
}
