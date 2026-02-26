<?php

namespace App\Services\Scoring;

class ClassificationCalculator implements CategoryCalculatorInterface
{
    private const WEIGHT = 0.15; // 15%
    
    private const CLASSIFICATION_SCORES = [
        'Homeless' => 0.50,                      // 50% of category weight
        'Displaced' => 0.25,                     // 25% of category weight
        'Double-up' => 0.15,                     // 15% of category weight
        'Upgrading of land tenure' => 0.10,      // 10% of category weight
    ];
    
    public function calculate(array $surveyData): float
    {
        $classification = $surveyData['classification'] ?? null;
        
        if ($classification === null) {
            return 0.0;
        }
        
        $internalScore = self::CLASSIFICATION_SCORES[$classification] ?? 0.0;
        return $internalScore * self::WEIGHT * 100; // Convert to percentage points
    }
    
    public function getWeight(): float
    {
        return self::WEIGHT;
    }
    
    public function getName(): string
    {
        return 'Classification';
    }
}
