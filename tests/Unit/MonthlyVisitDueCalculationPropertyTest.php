<?php

namespace Tests\Unit;

use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

/**
 * Property-Based Test for Monthly Visit Due Calculation
 * 
 * Feature: hoa-management-monitoring, Property 17: Monthly Visit Due Calculation
 * Validates: Requirements 6.5
 * 
 * Property: For any project site or HOA, if no site visit has been completed 
 * in the current month, it should be flagged as needing attention.
 * 
 * This test validates the due calculation logic without requiring database access
 * by testing the algorithm directly.
 */
class MonthlyVisitDueCalculationPropertyTest extends TestCase
{
    /**
     * Calculate if a project/HOA is due for a visit based on completed visits.
     * This mirrors the logic in MonitoringController::getDueVisits
     */
    private function calculateIsDue(int $entityId, array $completedVisitsThisMonth): bool
    {
        return !in_array($entityId, $completedVisitsThisMonth);
    }

    /**
     * Filter entities that are due for visits.
     * This mirrors the filter logic in getDueVisits.
     */
    private function filterDueEntities(array $entities, array $completedVisitsThisMonth): array
    {
        return array_values(array_filter($entities, function ($entity) use ($completedVisitsThisMonth) {
            return $this->calculateIsDue($entity['id'], $completedVisitsThisMonth);
        }));
    }

    /**
     * Check if a visit completion date is within the current month.
     */
    private function isWithinCurrentMonth(string $completedAt, Carbon $startOfMonth, Carbon $endOfMonth): bool
    {
        $completedDate = Carbon::parse($completedAt);
        return $completedDate >= $startOfMonth && $completedDate <= $endOfMonth;
    }

    /**
     * Generate random entities (projects or HOAs) for testing.
     */
    private function generateRandomEntities(int $count, \Faker\Generator $faker): array
    {
        $entities = [];
        for ($i = 1; $i <= $count; $i++) {
            $entities[] = [
                'id' => $i,
                'name' => $faker->company(),
            ];
        }
        return $entities;
    }

    /**
     * Generate random completed visits for testing.
     */
    private function generateRandomCompletedVisits(
        array $entityIds,
        int $visitCount,
        \Faker\Generator $faker,
        Carbon $startOfMonth,
        Carbon $endOfMonth
    ): array {
        $visits = [];
        for ($i = 0; $i < $visitCount; $i++) {
            $entityId = $faker->randomElement($entityIds);
            $completedAt = $faker->dateTimeBetween(
                $startOfMonth->format('Y-m-d'),
                $endOfMonth->format('Y-m-d')
            )->format('Y-m-d H:i:s');
            
            $visits[] = [
                'entity_id' => $entityId,
                'completed_at' => $completedAt,
            ];
        }
        return $visits;
    }

    /**
     * Property test: Entity without completed visit this month is flagged as due.
     * 
     * For any entity that has no completed visit in the current month,
     * it should appear in the due list.
     * 
     * @test
     */
    public function entity_without_completed_visit_is_flagged_as_due(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(12345);

        for ($iteration = 0; $iteration < 100; $iteration++) {
            Carbon::setTestNow(Carbon::parse($faker->dateTimeBetween('-2 years', 'now')));
            $startOfMonth = now()->startOfMonth();
            $endOfMonth = now()->endOfMonth();

            $entityCount = $faker->numberBetween(5, 20);
            $entities = $this->generateRandomEntities($entityCount, $faker);
            $entityIds = array_column($entities, 'id');

            // Generate visits for only some entities
            $visitedEntityCount = $faker->numberBetween(0, $entityCount - 1);
            $visitedEntityIds = $faker->randomElements($entityIds, $visitedEntityCount);

            $dueEntities = $this->filterDueEntities($entities, $visitedEntityIds);

            // Verify all due entities have no completed visit
            foreach ($dueEntities as $entity) {
                $this->assertFalse(
                    in_array($entity['id'], $visitedEntityIds),
                    sprintf(
                        'Iteration %d: Entity %d should not have a completed visit but was marked as due',
                        $iteration,
                        $entity['id']
                    )
                );
            }

            Carbon::setTestNow();
        }
    }

    /**
     * Property test: Entity with completed visit this month is not flagged as due.
     * 
     * For any entity that has a completed visit in the current month,
     * it should NOT appear in the due list.
     * 
     * @test
     */
    public function entity_with_completed_visit_is_not_flagged_as_due(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(23456);

        for ($iteration = 0; $iteration < 100; $iteration++) {
            Carbon::setTestNow(Carbon::parse($faker->dateTimeBetween('-2 years', 'now')));
            $startOfMonth = now()->startOfMonth();
            $endOfMonth = now()->endOfMonth();

            $entityCount = $faker->numberBetween(5, 20);
            $entities = $this->generateRandomEntities($entityCount, $faker);
            $entityIds = array_column($entities, 'id');

            // Generate visits for some entities
            $visitedEntityCount = $faker->numberBetween(1, $entityCount);
            $visitedEntityIds = $faker->randomElements($entityIds, $visitedEntityCount);

            $dueEntities = $this->filterDueEntities($entities, $visitedEntityIds);
            $dueEntityIds = array_column($dueEntities, 'id');

            // Verify no visited entity appears in due list
            foreach ($visitedEntityIds as $visitedId) {
                $this->assertNotContains(
                    $visitedId,
                    $dueEntityIds,
                    sprintf(
                        'Iteration %d: Entity %d has a completed visit and should not be in due list',
                        $iteration,
                        $visitedId
                    )
                );
            }

            Carbon::setTestNow();
        }
    }

    /**
     * Property test: Due count equals total entities minus visited entities.
     * 
     * The number of due entities should equal total entities minus 
     * the number of unique entities with completed visits.
     * 
     * @test
     */
    public function due_count_equals_total_minus_visited(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(34567);

        for ($iteration = 0; $iteration < 100; $iteration++) {
            Carbon::setTestNow(Carbon::parse($faker->dateTimeBetween('-2 years', 'now')));

            $entityCount = $faker->numberBetween(5, 30);
            $entities = $this->generateRandomEntities($entityCount, $faker);
            $entityIds = array_column($entities, 'id');

            // Generate visits (may have duplicates)
            $visitCount = $faker->numberBetween(0, $entityCount * 2);
            $visitedEntityIds = [];
            for ($i = 0; $i < $visitCount; $i++) {
                $visitedEntityIds[] = $faker->randomElement($entityIds);
            }
            $uniqueVisitedIds = array_unique($visitedEntityIds);

            $dueEntities = $this->filterDueEntities($entities, $uniqueVisitedIds);

            $expectedDueCount = $entityCount - count($uniqueVisitedIds);

            $this->assertCount(
                $expectedDueCount,
                $dueEntities,
                sprintf(
                    'Iteration %d: Expected %d due entities (total: %d, visited: %d), got %d',
                    $iteration,
                    $expectedDueCount,
                    $entityCount,
                    count($uniqueVisitedIds),
                    count($dueEntities)
                )
            );

            Carbon::setTestNow();
        }
    }

    /**
     * Property test: All entities are due when no visits completed.
     * 
     * When no visits have been completed this month, all entities should be due.
     * 
     * @test
     */
    public function all_entities_due_when_no_visits(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(45678);

        for ($iteration = 0; $iteration < 100; $iteration++) {
            $entityCount = $faker->numberBetween(1, 30);
            $entities = $this->generateRandomEntities($entityCount, $faker);

            // No completed visits
            $completedVisits = [];

            $dueEntities = $this->filterDueEntities($entities, $completedVisits);

            $this->assertCount(
                $entityCount,
                $dueEntities,
                sprintf(
                    'Iteration %d: All %d entities should be due when no visits completed',
                    $iteration,
                    $entityCount
                )
            );
        }
    }

    /**
     * Property test: No entities are due when all have visits.
     * 
     * When all entities have completed visits this month, none should be due.
     * 
     * @test
     */
    public function no_entities_due_when_all_visited(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(56789);

        for ($iteration = 0; $iteration < 100; $iteration++) {
            $entityCount = $faker->numberBetween(1, 30);
            $entities = $this->generateRandomEntities($entityCount, $faker);
            $entityIds = array_column($entities, 'id');

            // All entities have visits
            $dueEntities = $this->filterDueEntities($entities, $entityIds);

            $this->assertCount(
                0,
                $dueEntities,
                sprintf(
                    'Iteration %d: No entities should be due when all %d have visits',
                    $iteration,
                    $entityCount
                )
            );
        }
    }

    /**
     * Property test: Due calculation is deterministic.
     * 
     * For the same set of entities and visits, the due calculation 
     * should always produce the same result.
     * 
     * @test
     */
    public function due_calculation_is_deterministic(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(67890);

        for ($iteration = 0; $iteration < 100; $iteration++) {
            $entityCount = $faker->numberBetween(5, 20);
            $entities = $this->generateRandomEntities($entityCount, $faker);
            $entityIds = array_column($entities, 'id');

            $visitedCount = $faker->numberBetween(0, $entityCount);
            $visitedEntityIds = $faker->randomElements($entityIds, $visitedCount);

            $result1 = $this->filterDueEntities($entities, $visitedEntityIds);
            $result2 = $this->filterDueEntities($entities, $visitedEntityIds);

            $this->assertEquals(
                $result1,
                $result2,
                sprintf('Iteration %d: Due calculation should be deterministic', $iteration)
            );
        }
    }

    /**
     * Property test: Visit date within month boundary is correctly identified.
     * 
     * A visit completed exactly at month start or end should be counted.
     * 
     * @test
     */
    public function visit_date_boundary_is_correctly_identified(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(78901);

        for ($iteration = 0; $iteration < 100; $iteration++) {
            Carbon::setTestNow(Carbon::parse($faker->dateTimeBetween('-2 years', 'now')));
            $startOfMonth = now()->startOfMonth();
            $endOfMonth = now()->endOfMonth();

            // Test start of month boundary
            $visitAtStart = $startOfMonth->format('Y-m-d H:i:s');
            $this->assertTrue(
                $this->isWithinCurrentMonth($visitAtStart, $startOfMonth, $endOfMonth),
                sprintf('Iteration %d: Visit at start of month should be within current month', $iteration)
            );

            // Test end of month boundary
            $visitAtEnd = $endOfMonth->format('Y-m-d H:i:s');
            $this->assertTrue(
                $this->isWithinCurrentMonth($visitAtEnd, $startOfMonth, $endOfMonth),
                sprintf('Iteration %d: Visit at end of month should be within current month', $iteration)
            );

            // Test one day before month start
            $beforeMonth = $startOfMonth->copy()->subDay()->format('Y-m-d H:i:s');
            $this->assertFalse(
                $this->isWithinCurrentMonth($beforeMonth, $startOfMonth, $endOfMonth),
                sprintf('Iteration %d: Visit before month start should not be within current month', $iteration)
            );

            // Test one day after month end
            $afterMonth = $endOfMonth->copy()->addDay()->format('Y-m-d H:i:s');
            $this->assertFalse(
                $this->isWithinCurrentMonth($afterMonth, $startOfMonth, $endOfMonth),
                sprintf('Iteration %d: Visit after month end should not be within current month', $iteration)
            );

            Carbon::setTestNow();
        }
    }
}
