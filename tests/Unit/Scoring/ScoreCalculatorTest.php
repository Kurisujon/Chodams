<?php

use App\Services\Scoring\ScoreCalculator;
use Tests\Unit\Scoring\ScoringTestHelpers;

test('ScoreCalculator calculates score for complete survey data', function () {
    $surveyData = [
        'income_range' => '0-2999',
        'classification' => 'Homeless',
        'owns_lot' => false,
        'owns_house' => false,
        'temporary_housing' => true,
        'house_structure' => 'Makeshift/Salvaged/Improvised material',
        'toilet_type' => 'No Toilet',
        'water_source' => 'Surface water (river, lake, dam)',
        'electricity_source' => 'Candle/Lamp',
    ];
    
    $calculator = new ScoreCalculator();
    $score = $calculator->calculateScore($surveyData);
    
    // Expected contributions:
    // Income: 0.30 * 0.15 * 100 = 4.5
    // Classification: 0.50 * 0.15 * 100 = 7.5
    // Household: (0.20 + 0.30 + 0.50) * 0.14 * 100 = 14.0
    // House Structure: 0.30 * 0.14 * 100 = 4.2
    // Toilet: 0.40 * 0.14 * 100 = 5.6
    // Water: 0.30 * 0.14 * 100 = 4.2
    // Electricity: 0.30 * 0.14 * 100 = 4.2
    // Total: 44.2
    
    expect(abs($score - 44.2))->toBeLessThan(0.01);
});

test('ScoreCalculator returns 0 for empty survey data', function () {
    $calculator = new ScoreCalculator();
    $score = $calculator->calculateScore([]);
    
    expect($score)->toBe(0.0);
});

test('ScoreCalculator handles missing data gracefully', function () {
    $surveyData = [
        'income_range' => '0-2999',
        // Other fields missing
    ];
    
    $calculator = new ScoreCalculator();
    $score = $calculator->calculateScore($surveyData);
    
    // Only income contributes: 0.30 * 0.15 * 100 = 4.5
    expect(abs($score - 4.5))->toBeLessThan(0.01);
});

test('ScoreCalculator score never exceeds 100', function () {
    $surveyData = ScoringTestHelpers::generateRandomSurveyData();
    
    $calculator = new ScoreCalculator();
    $score = $calculator->calculateScore($surveyData);
    
    expect($score)->toBeLessThanOrEqual(100.0);
    expect($score)->toBeGreaterThanOrEqual(0.0);
});
