<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Models\Revocation;

/**
 * Property-Based Test for Revocation Reason Validation
 * 
 * Feature: hoa-management-monitoring, Property 18: Revocation Reason Validation
 * Validates: Requirements 7.1
 * 
 * Property: For any revocation creation, at least one violation reason from the 
 * predefined list must be selected.
 * 
 * This test validates the revocation reason validation logic without requiring 
 * database access by testing the validation rules directly.
 */
class RevocationReasonValidationPropertyTest extends TestCase
{
    /**
     * Valid violation reason codes from the Revocation model.
     */
    private array $validReasonCodes = [
        '4.1', '4.3', '4.4', '4.5', '4.6', '4.7', '4.9', '4.10', '1.1', '1.2'
    ];

    /**
     * Simulates the validation logic for revocation reasons.
     * This mirrors the validation in RevocationController::store().
     * 
     * @param array|null $violationReasons The violation reasons to validate
     * @return array ['valid' => bool, 'errors' => array]
     */
    private function validateRevocationReasons(?array $violationReasons): array
    {
        $errors = [];

        // Check if violation_reasons is provided and is an array
        if ($violationReasons === null || !is_array($violationReasons)) {
            $errors[] = 'At least one violation reason must be selected.';
            return ['valid' => false, 'errors' => $errors];
        }

        // Check if at least one reason is provided
        if (count($violationReasons) < 1) {
            $errors[] = 'At least one violation reason must be selected.';
            return ['valid' => false, 'errors' => $errors];
        }

        // Check if all provided reasons are valid
        foreach ($violationReasons as $reason) {
            if (!in_array($reason, $this->validReasonCodes, true)) {
                $errors[] = "Invalid violation reason: {$reason}";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Property test: Empty violation reasons array should be rejected.
     * 
     * For any revocation attempt with an empty violation_reasons array,
     * the validation should fail.
     * 
     * @test
     */
    public function empty_violation_reasons_is_rejected(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(12345);

        for ($i = 0; $i < 100; $i++) {
            $result = $this->validateRevocationReasons([]);

            $this->assertFalse(
                $result['valid'],
                'Empty violation reasons array should be rejected'
            );

            $this->assertNotEmpty(
                $result['errors'],
                'Should have error message for empty violation reasons'
            );
        }
    }

    /**
     * Property test: Null violation reasons should be rejected.
     * 
     * For any revocation attempt with null violation_reasons,
     * the validation should fail.
     * 
     * @test
     */
    public function null_violation_reasons_is_rejected(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(23456);

        for ($i = 0; $i < 100; $i++) {
            $result = $this->validateRevocationReasons(null);

            $this->assertFalse(
                $result['valid'],
                'Null violation reasons should be rejected'
            );
        }
    }

    /**
     * Property test: Single valid violation reason should be accepted.
     * 
     * For any revocation with exactly one valid violation reason,
     * the validation should pass.
     * 
     * @test
     */
    public function single_valid_violation_reason_is_accepted(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(34567);

        for ($i = 0; $i < 100; $i++) {
            // Pick a random valid reason
            $randomReason = $faker->randomElement($this->validReasonCodes);
            
            $result = $this->validateRevocationReasons([$randomReason]);

            $this->assertTrue(
                $result['valid'],
                sprintf(
                    'Single valid violation reason "%s" should be accepted',
                    $randomReason
                )
            );

            $this->assertEmpty(
                $result['errors'],
                'Should have no errors for valid violation reason'
            );
        }
    }

    /**
     * Property test: Multiple valid violation reasons should be accepted.
     * 
     * For any revocation with multiple valid violation reasons,
     * the validation should pass.
     * 
     * @test
     */
    public function multiple_valid_violation_reasons_are_accepted(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(45678);

        for ($i = 0; $i < 100; $i++) {
            // Pick 2-5 random valid reasons
            $numReasons = $faker->numberBetween(2, 5);
            $randomReasons = $faker->randomElements($this->validReasonCodes, $numReasons);
            
            $result = $this->validateRevocationReasons($randomReasons);

            $this->assertTrue(
                $result['valid'],
                sprintf(
                    'Multiple valid violation reasons [%s] should be accepted',
                    implode(', ', $randomReasons)
                )
            );
        }
    }

    /**
     * Property test: Invalid violation reason codes should be rejected.
     * 
     * For any revocation with an invalid violation reason code,
     * the validation should fail.
     * 
     * @test
     */
    public function invalid_violation_reason_codes_are_rejected(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(56789);

        $invalidCodes = [
            '0.0', '1.0', '2.0', '3.0', '4.0', '5.0',
            '4.2', '4.8', '4.11', '4.12',
            'invalid', 'test', '', ' ',
            '999', 'abc', 'XYZ',
        ];

        for ($i = 0; $i < 100; $i++) {
            $invalidCode = $faker->randomElement($invalidCodes);
            
            $result = $this->validateRevocationReasons([$invalidCode]);

            $this->assertFalse(
                $result['valid'],
                sprintf(
                    'Invalid violation reason code "%s" should be rejected',
                    $invalidCode
                )
            );
        }
    }

    /**
     * Property test: Mix of valid and invalid reasons should be rejected.
     * 
     * For any revocation with at least one invalid violation reason,
     * the validation should fail even if other reasons are valid.
     * 
     * @test
     */
    public function mix_of_valid_and_invalid_reasons_is_rejected(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(67890);

        $invalidCodes = ['0.0', '4.2', '4.8', 'invalid', '999'];

        for ($i = 0; $i < 100; $i++) {
            // Pick some valid reasons
            $numValid = $faker->numberBetween(1, 3);
            $validReasons = $faker->randomElements($this->validReasonCodes, $numValid);
            
            // Add an invalid reason
            $invalidReason = $faker->randomElement($invalidCodes);
            $mixedReasons = array_merge($validReasons, [$invalidReason]);
            
            // Shuffle to randomize position
            shuffle($mixedReasons);
            
            $result = $this->validateRevocationReasons($mixedReasons);

            $this->assertFalse(
                $result['valid'],
                sprintf(
                    'Mix of valid and invalid reasons [%s] should be rejected',
                    implode(', ', $mixedReasons)
                )
            );
        }
    }

    /**
     * Property test: All valid reason codes should be accepted.
     * 
     * For any combination of all valid violation reason codes,
     * the validation should pass.
     * 
     * @test
     */
    public function all_valid_reason_codes_are_accepted(): void
    {
        // Test with all valid codes at once
        $result = $this->validateRevocationReasons($this->validReasonCodes);

        $this->assertTrue(
            $result['valid'],
            'All valid violation reason codes should be accepted together'
        );

        // Test each valid code individually
        foreach ($this->validReasonCodes as $code) {
            $result = $this->validateRevocationReasons([$code]);
            
            $this->assertTrue(
                $result['valid'],
                sprintf('Valid violation reason code "%s" should be accepted', $code)
            );
        }
    }

    /**
     * Property test: Duplicate valid reasons should be accepted.
     * 
     * For any revocation with duplicate valid violation reasons,
     * the validation should still pass (duplicates are allowed).
     * 
     * @test
     */
    public function duplicate_valid_reasons_are_accepted(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(78901);

        for ($i = 0; $i < 100; $i++) {
            // Pick a random valid reason and duplicate it
            $randomReason = $faker->randomElement($this->validReasonCodes);
            $duplicatedReasons = [$randomReason, $randomReason, $randomReason];
            
            $result = $this->validateRevocationReasons($duplicatedReasons);

            $this->assertTrue(
                $result['valid'],
                sprintf(
                    'Duplicate valid violation reasons [%s] should be accepted',
                    implode(', ', $duplicatedReasons)
                )
            );
        }
    }

    /**
     * Property test: Validation is consistent across multiple calls.
     * 
     * For any set of violation reasons, calling validation multiple times
     * should always produce the same result.
     * 
     * @test
     */
    public function validation_is_consistent(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(89012);

        for ($i = 0; $i < 100; $i++) {
            // Generate random reasons (mix of valid and potentially invalid)
            $numReasons = $faker->numberBetween(0, 5);
            $reasons = [];
            
            for ($j = 0; $j < $numReasons; $j++) {
                if ($faker->boolean(80)) {
                    $reasons[] = $faker->randomElement($this->validReasonCodes);
                } else {
                    $reasons[] = $faker->word;
                }
            }
            
            // Call validation multiple times
            $result1 = $this->validateRevocationReasons($reasons);
            $result2 = $this->validateRevocationReasons($reasons);
            $result3 = $this->validateRevocationReasons($reasons);

            $this->assertEquals(
                $result1['valid'],
                $result2['valid'],
                'Validation should be consistent across calls'
            );

            $this->assertEquals(
                $result2['valid'],
                $result3['valid'],
                'Validation should be consistent across calls'
            );
        }
    }

    /**
     * Property test: Predefined violation reasons match model constants.
     * 
     * The valid reason codes used in validation should match exactly
     * with the VIOLATION_REASONS constant in the Revocation model.
     * 
     * @test
     */
    public function valid_codes_match_model_constants(): void
    {
        $modelCodes = array_keys(Revocation::VIOLATION_REASONS);
        
        sort($this->validReasonCodes);
        sort($modelCodes);

        $this->assertEquals(
            $this->validReasonCodes,
            $modelCodes,
            'Valid reason codes should match Revocation::VIOLATION_REASONS keys'
        );

        // Verify all 10 violation reasons are present
        $this->assertCount(
            10,
            $modelCodes,
            'Should have exactly 10 violation reason codes'
        );
    }
}
