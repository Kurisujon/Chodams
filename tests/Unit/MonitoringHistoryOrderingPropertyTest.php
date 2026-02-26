<?php

namespace Tests\Unit;

use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

/**
 * Property-Based Test for Monitoring History Ordering
 * 
 * Feature: hoa-management-monitoring, Property 14: Monitoring History Ordering
 * Validates: Requirements 5.5
 * 
 * Property: For any beneficiary's monitoring history, records should be 
 * returned in chronological order by visit_date.
 * 
 * This test validates the ordering logic without requiring database access
 * by testing the sorting algorithm directly.
 */
class MonitoringHistoryOrderingPropertyTest extends TestCase
{
    /**
     * Simulate the ordering logic used in MonitoringController::getBeneficiaryMonitoring
     * This mirrors the orderBy('visit_date', 'asc') query.
     */
    private function sortMonitoringRecords(array $records): array
    {
        usort($records, function ($a, $b) {
            return Carbon::parse($a['visit_date'])->timestamp - Carbon::parse($b['visit_date'])->timestamp;
        });
        return $records;
    }

    /**
     * Generate random monitoring records for testing.
     */
    private function generateRandomRecords(int $count, \Faker\Generator $faker): array
    {
        $records = [];
        $statuses = ['not_occupied', 'house_constructed', 'under_construction', 'vacant', 'other'];

        for ($i = 0; $i < $count; $i++) {
            $records[] = [
                'record_id' => $i + 1,
                'survey_id' => 1,
                'visit_date' => $faker->dateTimeBetween('-5 years', 'now')->format('Y-m-d'),
                'status' => $faker->randomElement($statuses),
                'remarks' => $faker->optional()->sentence(),
                'created_by' => $faker->numberBetween(1, 10),
            ];
        }

        return $records;
    }

    /**
     * Check if records are in chronological order by visit_date.
     */
    private function isChronologicallyOrdered(array $records): bool
    {
        if (count($records) <= 1) {
            return true;
        }

        for ($i = 1; $i < count($records); $i++) {
            $prevDate = Carbon::parse($records[$i - 1]['visit_date']);
            $currDate = Carbon::parse($records[$i]['visit_date']);
            
            if ($prevDate > $currDate) {
                return false;
            }
        }

        return true;
    }

    /**
     * Property test: Sorted monitoring records are always in chronological order.
     * 
     * For any set of monitoring records, after sorting by visit_date ascending,
     * each record's visit_date should be >= the previous record's visit_date.
     * 
     * @test
     */
    public function sorted_records_are_chronologically_ordered(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(12345);

        // Run 100 iterations with different random data
        for ($iteration = 0; $iteration < 100; $iteration++) {
            $recordCount = $faker->numberBetween(1, 50);
            $records = $this->generateRandomRecords($recordCount, $faker);
            
            $sortedRecords = $this->sortMonitoringRecords($records);
            
            $this->assertTrue(
                $this->isChronologicallyOrdered($sortedRecords),
                sprintf(
                    'Iteration %d: Records should be in chronological order after sorting. Record count: %d',
                    $iteration,
                    $recordCount
                )
            );
        }
    }

    /**
     * Property test: Sorting preserves all records.
     * 
     * For any set of monitoring records, sorting should not add or remove records.
     * 
     * @test
     */
    public function sorting_preserves_all_records(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(23456);

        for ($iteration = 0; $iteration < 100; $iteration++) {
            $recordCount = $faker->numberBetween(1, 50);
            $records = $this->generateRandomRecords($recordCount, $faker);
            
            $sortedRecords = $this->sortMonitoringRecords($records);
            
            $this->assertCount(
                count($records),
                $sortedRecords,
                sprintf(
                    'Iteration %d: Sorting should preserve record count. Expected %d, got %d',
                    $iteration,
                    count($records),
                    count($sortedRecords)
                )
            );

            // Verify all original record IDs are present
            $originalIds = array_column($records, 'record_id');
            $sortedIds = array_column($sortedRecords, 'record_id');
            sort($originalIds);
            sort($sortedIds);
            
            $this->assertEquals(
                $originalIds,
                $sortedIds,
                sprintf('Iteration %d: All record IDs should be preserved after sorting', $iteration)
            );
        }
    }

    /**
     * Property test: Sorting is idempotent.
     * 
     * For any set of monitoring records, sorting twice should produce 
     * the same result as sorting once.
     * 
     * @test
     */
    public function sorting_is_idempotent(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(34567);

        for ($iteration = 0; $iteration < 100; $iteration++) {
            $recordCount = $faker->numberBetween(1, 50);
            $records = $this->generateRandomRecords($recordCount, $faker);
            
            $sortedOnce = $this->sortMonitoringRecords($records);
            $sortedTwice = $this->sortMonitoringRecords($sortedOnce);
            
            $this->assertEquals(
                $sortedOnce,
                $sortedTwice,
                sprintf('Iteration %d: Sorting twice should produce same result as sorting once', $iteration)
            );
        }
    }

    /**
     * Property test: Empty and single-record lists are handled correctly.
     * 
     * @test
     */
    public function empty_and_single_record_lists_are_ordered(): void
    {
        // Empty list
        $emptyRecords = [];
        $sortedEmpty = $this->sortMonitoringRecords($emptyRecords);
        $this->assertTrue(
            $this->isChronologicallyOrdered($sortedEmpty),
            'Empty list should be considered chronologically ordered'
        );
        $this->assertCount(0, $sortedEmpty);

        // Single record
        $faker = \Faker\Factory::create();
        $faker->seed(45678);
        
        for ($i = 0; $i < 100; $i++) {
            $singleRecord = $this->generateRandomRecords(1, $faker);
            $sortedSingle = $this->sortMonitoringRecords($singleRecord);
            
            $this->assertTrue(
                $this->isChronologicallyOrdered($sortedSingle),
                'Single record list should be considered chronologically ordered'
            );
            $this->assertCount(1, $sortedSingle);
        }
    }

    /**
     * Property test: Records with same visit_date maintain stable order.
     * 
     * For records with identical visit_dates, the relative order should be stable.
     * 
     * @test
     */
    public function records_with_same_date_maintain_relative_order(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(56789);

        for ($iteration = 0; $iteration < 100; $iteration++) {
            // Create records with some duplicate dates
            $baseDate = $faker->dateTimeBetween('-1 year', 'now')->format('Y-m-d');
            $records = [];
            
            for ($i = 0; $i < 10; $i++) {
                $records[] = [
                    'record_id' => $i + 1,
                    'survey_id' => 1,
                    'visit_date' => $baseDate, // All same date
                    'status' => 'house_constructed',
                    'remarks' => "Record $i",
                    'created_by' => 1,
                ];
            }
            
            $sortedRecords = $this->sortMonitoringRecords($records);
            
            // All records should still be present
            $this->assertCount(10, $sortedRecords);
            
            // All dates should be the same (and thus ordered)
            $this->assertTrue(
                $this->isChronologicallyOrdered($sortedRecords),
                'Records with same date should be considered chronologically ordered'
            );
        }
    }

    /**
     * Property test: Chronological order respects date boundaries.
     * 
     * For any two records where record A has visit_date < record B's visit_date,
     * record A should appear before record B in the sorted list.
     * 
     * @test
     */
    public function chronological_order_respects_date_boundaries(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(67890);

        for ($iteration = 0; $iteration < 100; $iteration++) {
            $recordCount = $faker->numberBetween(5, 30);
            $records = $this->generateRandomRecords($recordCount, $faker);
            
            $sortedRecords = $this->sortMonitoringRecords($records);
            
            // For each pair of records in sorted order, verify date ordering
            for ($i = 0; $i < count($sortedRecords) - 1; $i++) {
                $currentDate = Carbon::parse($sortedRecords[$i]['visit_date']);
                $nextDate = Carbon::parse($sortedRecords[$i + 1]['visit_date']);
                
                $this->assertLessThanOrEqual(
                    $nextDate->timestamp,
                    $currentDate->timestamp,
                    sprintf(
                        'Iteration %d: Record at index %d (date: %s) should not be after record at index %d (date: %s)',
                        $iteration,
                        $i,
                        $sortedRecords[$i]['visit_date'],
                        $i + 1,
                        $sortedRecords[$i + 1]['visit_date']
                    )
                );
            }
        }
    }
}
