<?php

namespace App\Services\Scoring;

interface CategoryCalculatorInterface
{
    /**
     * Calculate the contribution of this category to the total score
     * 
     * @param array $surveyData Survey data for this category
     * @return float Contribution to total score (0 to category weight)
     */
    public function calculate(array $surveyData): float;
    
    /**
     * Get the weight of this category
     * 
     * @return float Category weight as decimal (e.g., 0.15 for 15%)
     */
    public function getWeight(): float;
    
    /**
     * Get the name of this category
     * 
     * @return string
     */
    public function getName(): string;
}
