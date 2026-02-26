<?php

namespace Tests\Unit;

use Tests\TestCase;

class TestDataGeneratorsTest extends TestCase
{
    /**
     * Test that generateRandomSurveyData produces valid data
     */
    public function test_generate_random_survey_data_produces_valid_data(): void
    {
        $data = generateRandomSurveyData();
        
        // Verify all expected keys are present
        $this->assertArrayHasKey('income_range', $data);
        $this->assertArrayHasKey('classification', $data);
        $this->assertArrayHasKey('owns_lot', $data);
        $this->assertArrayHasKey('owns_house', $data);
        $this->assertArrayHasKey('temporary_housing', $data);
        $this->assertArrayHasKey('house_structure', $data);
        $this->assertArrayHasKey('toilet_type', $data);
        $this->assertArrayHasKey('water_source', $data);
        $this->assertArrayHasKey('electricity_source', $data);
        
        // Verify data types
        $this->assertIsString($data['income_range']);
        $this->assertIsString($data['classification']);
        $this->assertIsBool($data['owns_lot']);
        $this->assertIsBool($data['owns_house']);
        $this->assertIsBool($data['temporary_housing']);
        $this->assertIsString($data['house_structure']);
        $this->assertIsString($data['toilet_type']);
        $this->assertIsString($data['water_source']);
        $this->assertIsString($data['electricity_source']);
        
        // Verify values are from valid sets
        $this->assertContains($data['income_range'], [
            '0-2999', '3000-5999', '6000-8999', '9000-12999', '13000+'
        ]);
        
        $this->assertContains($data['classification'], [
            'Displaced', 'Double-up', 'Homeless', 'Upgrading of land tenure'
        ]);
    }
    
    /**
     * Test that generateSurveyDataWithMissingFields produces data with missing fields
     */
    public function test_generate_survey_data_with_missing_fields_has_missing_fields(): void
    {
        $data = generateSurveyDataWithMissingFields();
        
        // Verify at least one field is present
        $this->assertNotEmpty($data);
        
        // Verify at least one field is missing
        $allFields = [
            'income_range', 'classification', 'owns_lot', 'owns_house',
            'temporary_housing', 'house_structure', 'toilet_type',
            'water_source', 'electricity_source'
        ];
        
        $this->assertLessThan(count($allFields), count($data));
    }
    
    /**
     * Test that generateSurveyDataWithMissingFields always has at least one field
     */
    public function test_generate_survey_data_with_missing_fields_always_has_at_least_one_field(): void
    {
        // Run multiple times to ensure consistency
        for ($i = 0; $i < 10; $i++) {
            $data = generateSurveyDataWithMissingFields();
            $this->assertNotEmpty($data, "Iteration {$i}: Data should not be empty");
        }
    }
    
    /**
     * Test that helper functions can be used in score calculation
     */
    public function test_helper_functions_produce_data_compatible_with_score_calculator(): void
    {
        $data = generateRandomSurveyData();
        
        $calculator = new \App\Services\Scoring\ScoreCalculator();
        $score = $calculator->calculateScore($data);
        
        // Verify score is valid
        $this->assertIsFloat($score);
        $this->assertGreaterThanOrEqual(0.0, $score);
        $this->assertLessThanOrEqual(100.0, $score);
    }
}
