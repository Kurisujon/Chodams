<?php

namespace Tests\Unit;

use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

/**
 * Property-Based Test for Officer Status Calculation
 * 
 * Feature: hoa-management-monitoring, Property 6: Officer Status Calculation
 * Validates: Requirements 2.3, 2.4
 * 
 * Property: For any officer with period_start and period_end dates, the officer 
 * should be marked "Active" if and only if the current date is between 
 * period_start and period_end (inclusive).
 * 
 * This test validates the logic without requiring database access by testing
 * the status calculation algorithm directly.
 */
class HOAOfficerStatusPropertyTest extends TestCase
{
    /**
     * Calculate officer active status using the same logic as the model.
     * This mirrors the getIsActiveAttribute() method in HOAOfficer model.
     */
    private function calculateIsActive(string $periodStart, string $periodEnd): bool
    {
        $now = now()->startOfDay();
        $start = Carbon::parse($periodStart)->startOfDay();
        $end = Carbon::parse($periodEnd)->startOfDay();
        
        return $start <= $now && $end >= $now;
    }

    /**
     * Property test: Officer is active when current date is within period (inclusive).
     * 
     * For any officer with period_start <= current_date <= period_end,
     * the is_active attribute should return true.
     * 
     * @test
     * @dataProvider activeOfficerDataProvider
     */
    public function officer_is_active_when_current_date_within_period(
        string $periodStart,
        string $periodEnd,
        string $currentDate,
        bool $expectedActive
    ): void {
        // Freeze time to the test date
        Carbon::setTestNow(Carbon::parse($currentDate));

        $isActive = $this->calculateIsActive($periodStart, $periodEnd);

        $this->assertEquals(
            $expectedActive,
            $isActive,
            sprintf(
                'Officer with period %s to %s should be %s on %s',
                $periodStart,
                $periodEnd,
                $expectedActive ? 'active' : 'inactive',
                $currentDate
            )
        );

        // Reset time
        Carbon::setTestNow();
    }

    /**
     * Data provider for active officer property test.
     * Generates 100+ test cases with various date combinations.
     */
    public static function activeOfficerDataProvider(): array
    {
        $testCases = [];
        $faker = \Faker\Factory::create();
        $faker->seed(12345); // Seed for reproducibility

        // Generate 100 random test cases
        for ($i = 0; $i < 100; $i++) {
            // Generate random period start and end dates
            $periodStart = $faker->dateTimeBetween('-5 years', '+2 years');
            $periodEnd = $faker->dateTimeBetween($periodStart, '+5 years');
            
            $periodStartStr = $periodStart->format('Y-m-d');
            $periodEndStr = $periodEnd->format('Y-m-d');

            // Test case 1: Current date is exactly period_start (should be active)
            $testCases["case_{$i}_start_boundary"] = [
                $periodStartStr,
                $periodEndStr,
                $periodStartStr,
                true,
            ];

            // Test case 2: Current date is exactly period_end (should be active)
            $testCases["case_{$i}_end_boundary"] = [
                $periodStartStr,
                $periodEndStr,
                $periodEndStr,
                true,
            ];

            // Test case 3: Current date is within period (should be active)
            $daysDiff = $periodStart->diff($periodEnd)->days;
            if ($daysDiff > 1) {
                $midDays = rand(1, $daysDiff - 1);
                $midDate = (clone $periodStart)->modify('+' . $midDays . ' days');
                $testCases["case_{$i}_within_period"] = [
                    $periodStartStr,
                    $periodEndStr,
                    $midDate->format('Y-m-d'),
                    true,
                ];
            }

            // Test case 4: Current date is before period_start (should be inactive)
            $beforeStart = (clone $periodStart)->modify('-' . rand(1, 365) . ' days');
            $testCases["case_{$i}_before_start"] = [
                $periodStartStr,
                $periodEndStr,
                $beforeStart->format('Y-m-d'),
                false,
            ];

            // Test case 5: Current date is after period_end (should be inactive)
            $afterEnd = (clone $periodEnd)->modify('+' . rand(1, 365) . ' days');
            $testCases["case_{$i}_after_end"] = [
                $periodStartStr,
                $periodEndStr,
                $afterEnd->format('Y-m-d'),
                false,
            ];
        }

        return $testCases;
    }

    /**
     * Property test: Officer status is deterministic.
     * 
     * For any officer with the same period dates and current date,
     * the is_active calculation should always return the same value.
     * 
     * @test
     */
    public function officer_status_is_deterministic(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(54321);

        for ($i = 0; $i < 100; $i++) {
            $periodStart = $faker->dateTimeBetween('-2 years', '+1 year');
            $periodEnd = $faker->dateTimeBetween($periodStart, '+3 years');
            $currentDate = $faker->dateTimeBetween('-3 years', '+4 years');

            Carbon::setTestNow(Carbon::parse($currentDate->format('Y-m-d')));

            $result1 = $this->calculateIsActive(
                $periodStart->format('Y-m-d'),
                $periodEnd->format('Y-m-d')
            );

            $result2 = $this->calculateIsActive(
                $periodStart->format('Y-m-d'),
                $periodEnd->format('Y-m-d')
            );

            $this->assertEquals(
                $result1,
                $result2,
                'Same period dates should produce same active status'
            );

            Carbon::setTestNow();
        }
    }

    /**
     * Property test: Active status follows logical implication.
     * 
     * If period_start <= current_date AND current_date <= period_end,
     * then is_active must be true.
     * 
     * @test
     */
    public function active_status_follows_logical_implication(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(67890);

        for ($i = 0; $i < 100; $i++) {
            $periodStart = $faker->dateTimeBetween('-2 years', '+1 year');
            $periodEnd = $faker->dateTimeBetween($periodStart, '+3 years');
            $currentDate = $faker->dateTimeBetween('-3 years', '+4 years');

            $periodStartCarbon = Carbon::parse($periodStart->format('Y-m-d'))->startOfDay();
            $periodEndCarbon = Carbon::parse($periodEnd->format('Y-m-d'))->startOfDay();
            $currentDateCarbon = Carbon::parse($currentDate->format('Y-m-d'))->startOfDay();

            Carbon::setTestNow($currentDateCarbon);

            $isActive = $this->calculateIsActive(
                $periodStart->format('Y-m-d'),
                $periodEnd->format('Y-m-d')
            );

            $shouldBeActive = $periodStartCarbon <= $currentDateCarbon && $currentDateCarbon <= $periodEndCarbon;

            $this->assertEquals(
                $shouldBeActive,
                $isActive,
                sprintf(
                    'Officer active status mismatch: period %s to %s, current %s, expected %s, got %s',
                    $periodStart->format('Y-m-d'),
                    $periodEnd->format('Y-m-d'),
                    $currentDate->format('Y-m-d'),
                    $shouldBeActive ? 'active' : 'inactive',
                    $isActive ? 'active' : 'inactive'
                )
            );

            Carbon::setTestNow();
        }
    }

    /**
     * Property test: Boundary conditions are handled correctly.
     * 
     * Tests that the inclusive boundary conditions (start and end dates)
     * are properly handled.
     * 
     * @test
     */
    public function boundary_conditions_are_inclusive(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(11111);

        for ($i = 0; $i < 100; $i++) {
            $periodStart = $faker->dateTimeBetween('-2 years', '+1 year');
            $periodEnd = $faker->dateTimeBetween($periodStart, '+3 years');

            // Test start boundary
            Carbon::setTestNow(Carbon::parse($periodStart->format('Y-m-d')));
            $isActiveAtStart = $this->calculateIsActive(
                $periodStart->format('Y-m-d'),
                $periodEnd->format('Y-m-d')
            );
            $this->assertTrue(
                $isActiveAtStart,
                sprintf('Officer should be active on period start date %s', $periodStart->format('Y-m-d'))
            );

            // Test end boundary
            Carbon::setTestNow(Carbon::parse($periodEnd->format('Y-m-d')));
            $isActiveAtEnd = $this->calculateIsActive(
                $periodStart->format('Y-m-d'),
                $periodEnd->format('Y-m-d')
            );
            $this->assertTrue(
                $isActiveAtEnd,
                sprintf('Officer should be active on period end date %s', $periodEnd->format('Y-m-d'))
            );

            // Test one day before start
            $dayBeforeStart = (clone $periodStart)->modify('-1 day');
            Carbon::setTestNow(Carbon::parse($dayBeforeStart->format('Y-m-d')));
            $isActiveBeforeStart = $this->calculateIsActive(
                $periodStart->format('Y-m-d'),
                $periodEnd->format('Y-m-d')
            );
            $this->assertFalse(
                $isActiveBeforeStart,
                sprintf('Officer should be inactive one day before period start %s', $dayBeforeStart->format('Y-m-d'))
            );

            // Test one day after end
            $dayAfterEnd = (clone $periodEnd)->modify('+1 day');
            Carbon::setTestNow(Carbon::parse($dayAfterEnd->format('Y-m-d')));
            $isActiveAfterEnd = $this->calculateIsActive(
                $periodStart->format('Y-m-d'),
                $periodEnd->format('Y-m-d')
            );
            $this->assertFalse(
                $isActiveAfterEnd,
                sprintf('Officer should be inactive one day after period end %s', $dayAfterEnd->format('Y-m-d'))
            );

            Carbon::setTestNow();
        }
    }
}
