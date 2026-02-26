<?php

namespace App\Services\Scoring;

class HouseStructureCalculator implements CategoryCalculatorInterface
{
    private const WEIGHT = 0.14; // 14%
    
    private const STRUCTURE_SCORES = [
        'Makeshift/Salvaged/Improvised material' => 0.30,  // 30% of category weight
        'Made of Amakan and Nipa' => 0.25,                 // 25% of category weight
        'Made of Amakan and metal roof' => 0.15,           // 15% of category weight
        'Made of wood and metal roof' => 0.15,             // 15% of category weight
        'Combination of concrete and wood' => 0.10,        // 10% of category weight
        'Full Concrete' => 0.03,                           // 3% of category weight
        'Others' => 0.02,                                  // 2% of category weight
    ];
    
    public function calculate(array $surveyData): float
    {
        $houseStructure = $surveyData['house_structure'] ?? null;
        
        if ($houseStructure === null) {
            return 0.0;
        }
        
        $internalScore = self::STRUCTURE_SCORES[$houseStructure] ?? 0.0;
        return $internalScore * self::WEIGHT * 100; // Convert to percentage points
    }
    
    public function getWeight(): float
    {
        return self::WEIGHT;
    }
    
    public function getName(): string
    {
        return 'House Structure';
    }
}
