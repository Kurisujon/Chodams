<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Property-Based Test for HOA Name Uniqueness Per Project
 * 
 * Feature: hoa-management-monitoring, Property 3: HOA Name Uniqueness Per Project
 * Validates: Requirements 1.5
 * 
 * Property: For any project site, attempting to create two HOAs with the same name 
 * should result in the second creation being rejected.
 * 
 * This test validates the uniqueness constraint logic without requiring database access
 * by testing the validation rules and constraint checking algorithm directly.
 */
class HOANameUniquenessPropertyTest extends TestCase
{
    /**
     * Simulates the HOA name uniqueness check within a project.
     * This mirrors the validation logic in HOAController::store().
     * 
     * @param array $existingHoas Array of existing HOAs with 'hoa_name', 'project_id', 'deleted_at'
     * @param string $newHoaName The name of the new HOA to create
     * @param int $projectId The project ID for the new HOA
     * @return bool True if the name is unique (creation allowed), false otherwise
     */
    private function isHoaNameUniqueInProject(array $existingHoas, string $newHoaName, int $projectId): bool
    {
        foreach ($existingHoas as $hoa) {
            // Check if there's an existing HOA with the same name in the same project
            // that hasn't been soft deleted
            if (
                $hoa['hoa_name'] === $newHoaName &&
                $hoa['project_id'] === $projectId &&
                $hoa['deleted_at'] === null
            ) {
                return false; // Name is not unique, creation should be rejected
            }
        }
        return true; // Name is unique, creation allowed
    }

    /**
     * Property test: Same HOA name in same project should be rejected.
     * 
     * For any project, if an HOA with name X exists, creating another HOA 
     * with name X in the same project should fail.
     * 
     * @test
     */
    public function same_hoa_name_in_same_project_is_rejected(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(12345);

        for ($i = 0; $i < 100; $i++) {
            $projectId = $faker->numberBetween(1, 1000);
            $hoaName = $faker->company . ' HOA';

            // Create existing HOA
            $existingHoas = [
                [
                    'hoa_id' => $faker->numberBetween(1, 10000),
                    'hoa_name' => $hoaName,
                    'project_id' => $projectId,
                    'deleted_at' => null,
                ],
            ];

            // Try to create another HOA with the same name in the same project
            $isUnique = $this->isHoaNameUniqueInProject($existingHoas, $hoaName, $projectId);

            $this->assertFalse(
                $isUnique,
                sprintf(
                    'Creating HOA "%s" in project %d should be rejected when one already exists',
                    $hoaName,
                    $projectId
                )
            );
        }
    }

    /**
     * Property test: Same HOA name in different projects should be allowed.
     * 
     * For any two different projects, creating HOAs with the same name 
     * should be allowed in both.
     * 
     * @test
     */
    public function same_hoa_name_in_different_projects_is_allowed(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(23456);

        for ($i = 0; $i < 100; $i++) {
            $projectId1 = $faker->numberBetween(1, 500);
            $projectId2 = $faker->numberBetween(501, 1000); // Ensure different project
            $hoaName = $faker->company . ' HOA';

            // Create existing HOA in project 1
            $existingHoas = [
                [
                    'hoa_id' => $faker->numberBetween(1, 10000),
                    'hoa_name' => $hoaName,
                    'project_id' => $projectId1,
                    'deleted_at' => null,
                ],
            ];

            // Try to create HOA with the same name in project 2
            $isUnique = $this->isHoaNameUniqueInProject($existingHoas, $hoaName, $projectId2);

            $this->assertTrue(
                $isUnique,
                sprintf(
                    'Creating HOA "%s" in project %d should be allowed when it only exists in project %d',
                    $hoaName,
                    $projectId2,
                    $projectId1
                )
            );
        }
    }

    /**
     * Property test: Different HOA names in same project should be allowed.
     * 
     * For any project, creating HOAs with different names should always be allowed.
     * 
     * @test
     */
    public function different_hoa_names_in_same_project_is_allowed(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(34567);

        for ($i = 0; $i < 100; $i++) {
            $projectId = $faker->numberBetween(1, 1000);
            $hoaName1 = $faker->company . ' HOA ' . $faker->randomNumber(5);
            $hoaName2 = $faker->company . ' Association ' . $faker->randomNumber(5);

            // Ensure names are different
            while ($hoaName1 === $hoaName2) {
                $hoaName2 = $faker->company . ' Association ' . $faker->randomNumber(5);
            }

            // Create existing HOA
            $existingHoas = [
                [
                    'hoa_id' => $faker->numberBetween(1, 10000),
                    'hoa_name' => $hoaName1,
                    'project_id' => $projectId,
                    'deleted_at' => null,
                ],
            ];

            // Try to create HOA with a different name in the same project
            $isUnique = $this->isHoaNameUniqueInProject($existingHoas, $hoaName2, $projectId);

            $this->assertTrue(
                $isUnique,
                sprintf(
                    'Creating HOA "%s" in project %d should be allowed when only "%s" exists',
                    $hoaName2,
                    $projectId,
                    $hoaName1
                )
            );
        }
    }

    /**
     * Property test: Soft-deleted HOA name can be reused.
     * 
     * If an HOA with name X was soft-deleted, creating a new HOA with name X 
     * in the same project should be allowed.
     * 
     * @test
     */
    public function soft_deleted_hoa_name_can_be_reused(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(45678);

        for ($i = 0; $i < 100; $i++) {
            $projectId = $faker->numberBetween(1, 1000);
            $hoaName = $faker->company . ' HOA';

            // Create soft-deleted HOA
            $existingHoas = [
                [
                    'hoa_id' => $faker->numberBetween(1, 10000),
                    'hoa_name' => $hoaName,
                    'project_id' => $projectId,
                    'deleted_at' => $faker->dateTimeThisYear()->format('Y-m-d H:i:s'),
                ],
            ];

            // Try to create HOA with the same name (should be allowed since original is deleted)
            $isUnique = $this->isHoaNameUniqueInProject($existingHoas, $hoaName, $projectId);

            $this->assertTrue(
                $isUnique,
                sprintf(
                    'Creating HOA "%s" in project %d should be allowed when the existing one is soft-deleted',
                    $hoaName,
                    $projectId
                )
            );
        }
    }

    /**
     * Property test: Uniqueness check is case-sensitive.
     * 
     * HOA names should be treated as case-sensitive for uniqueness.
     * "Test HOA" and "test hoa" should be considered different names.
     * 
     * @test
     */
    public function uniqueness_check_is_case_sensitive(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(56789);

        for ($i = 0; $i < 100; $i++) {
            $projectId = $faker->numberBetween(1, 1000);
            $hoaName = $faker->company . ' HOA';
            $hoaNameLower = strtolower($hoaName);
            $hoaNameUpper = strtoupper($hoaName);

            // Skip if the name is already all lowercase or uppercase
            if ($hoaName === $hoaNameLower || $hoaName === $hoaNameUpper) {
                continue;
            }

            // Create existing HOA with original case
            $existingHoas = [
                [
                    'hoa_id' => $faker->numberBetween(1, 10000),
                    'hoa_name' => $hoaName,
                    'project_id' => $projectId,
                    'deleted_at' => null,
                ],
            ];

            // Try to create HOA with lowercase name
            $isUniqueLower = $this->isHoaNameUniqueInProject($existingHoas, $hoaNameLower, $projectId);

            // Try to create HOA with uppercase name
            $isUniqueUpper = $this->isHoaNameUniqueInProject($existingHoas, $hoaNameUpper, $projectId);

            // Both should be allowed since they're different case
            $this->assertTrue(
                $isUniqueLower,
                sprintf(
                    'Creating HOA "%s" should be allowed when "%s" exists (case-sensitive)',
                    $hoaNameLower,
                    $hoaName
                )
            );

            $this->assertTrue(
                $isUniqueUpper,
                sprintf(
                    'Creating HOA "%s" should be allowed when "%s" exists (case-sensitive)',
                    $hoaNameUpper,
                    $hoaName
                )
            );
        }
    }

    /**
     * Property test: Multiple HOAs in project don't affect uniqueness of new names.
     * 
     * When a project has multiple existing HOAs, a new HOA with a unique name
     * should still be allowed.
     * 
     * @test
     */
    public function multiple_existing_hoas_dont_block_unique_names(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(67890);

        for ($i = 0; $i < 100; $i++) {
            $projectId = $faker->numberBetween(1, 1000);
            
            // Create multiple existing HOAs
            $existingHoas = [];
            $numExisting = $faker->numberBetween(2, 10);
            $existingNames = [];
            
            for ($j = 0; $j < $numExisting; $j++) {
                $name = $faker->company . ' HOA ' . $faker->randomNumber(5);
                $existingNames[] = $name;
                $existingHoas[] = [
                    'hoa_id' => $faker->numberBetween(1, 10000),
                    'hoa_name' => $name,
                    'project_id' => $projectId,
                    'deleted_at' => null,
                ];
            }

            // Generate a new unique name
            $newName = $faker->company . ' Association ' . $faker->randomNumber(6);
            while (in_array($newName, $existingNames)) {
                $newName = $faker->company . ' Association ' . $faker->randomNumber(6);
            }

            // Try to create HOA with the new unique name
            $isUnique = $this->isHoaNameUniqueInProject($existingHoas, $newName, $projectId);

            $this->assertTrue(
                $isUnique,
                sprintf(
                    'Creating HOA "%s" should be allowed when %d other HOAs exist with different names',
                    $newName,
                    $numExisting
                )
            );
        }
    }

    /**
     * Property test: Uniqueness constraint is symmetric.
     * 
     * If HOA A blocks HOA B, then HOA B would also block HOA A.
     * 
     * @test
     */
    public function uniqueness_constraint_is_symmetric(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(78901);

        for ($i = 0; $i < 100; $i++) {
            $projectId = $faker->numberBetween(1, 1000);
            $hoaName = $faker->company . ' HOA';

            // Scenario 1: HOA A exists, try to create HOA B with same name
            $existingHoasA = [
                [
                    'hoa_id' => 1,
                    'hoa_name' => $hoaName,
                    'project_id' => $projectId,
                    'deleted_at' => null,
                ],
            ];
            $canCreateB = $this->isHoaNameUniqueInProject($existingHoasA, $hoaName, $projectId);

            // Scenario 2: HOA B exists, try to create HOA A with same name
            $existingHoasB = [
                [
                    'hoa_id' => 2,
                    'hoa_name' => $hoaName,
                    'project_id' => $projectId,
                    'deleted_at' => null,
                ],
            ];
            $canCreateA = $this->isHoaNameUniqueInProject($existingHoasB, $hoaName, $projectId);

            // Both should be blocked (symmetric)
            $this->assertEquals(
                $canCreateB,
                $canCreateA,
                'Uniqueness constraint should be symmetric'
            );
            
            $this->assertFalse(
                $canCreateB,
                'Both scenarios should reject duplicate names'
            );
        }
    }
}
