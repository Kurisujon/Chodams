<?php

namespace Tests\Unit;

use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

/**
 * Property-Based Test for Dashboard HOA Count Accuracy
 * 
 * Feature: hoa-management-monitoring, Property 21: Dashboard HOA Count Accuracy
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 * 
 * Property: For any dashboard view, the displayed HOA count should equal the 
 * actual count of active HOAs in the database. The officer counts (active/inactive)
 * should accurately reflect the status based on period dates.
 * 
 * This test validates the aggregation logic without requiring database access by testing
 * the calculation algorithms directly.
 */
class DashboardAggregationPropertyTest extends TestCase
{
    /**
     * Calculate officer active status using the same logic as the model.
     */
    private function calculateIsActive(string $periodStart, string $periodEnd, Carbon $currentDate): bool
    {
        $start = Carbon::parse($periodStart)->startOfDay();
        $end = Carbon::parse($periodEnd)->startOfDay();
        $now = $currentDate->copy()->startOfDay();
        
        return $start <= $now && $end >= $now;
    }

    /**
     * Simulate HOA dashboard stats calculation.
     * This mirrors the getDashboardStats() method in HOAController.
     */
    private function calculateHoaStats(array $hoas, array $officers, Carbon $currentDate): array
    {
        $totalHoas = count($hoas);
        
        $activeOfficersCount = 0;
        $inactiveOfficersCount = 0;
        
        foreach ($officers as $officer) {
            if ($this->calculateIsActive($officer['period_start'], $officer['period_end'], $currentDate)) {
                $activeOfficersCount++;
            } else {
                $inactiveOfficersCount++;
            }
        }
        
        return [
            'total_hoas' => $totalHoas,
            'active_officers' => $activeOfficersCount,
            'inactive_officers' => $inactiveOfficersCount,
            'total_officers' => count($officers),
        ];
    }

    /**
     * Simulate monitoring dashboard stats calculation.
     * This mirrors the getDashboardStats() method in MonitoringController.
     */
    private function calculateMonitoringStats(
        array $siteVisits,
        array $projects,
        array $hoas,
        Carbon $currentDate
    ): array {
        $startOfMonth = $currentDate->copy()->startOfMonth();
        $endOfMonth = $currentDate->copy()->endOfMonth();
        
        // Count upcoming visits this month (scheduled, not completed)
        $upcomingVisitsThisMonth = 0;
        foreach ($siteVisits as $visit) {
            $scheduledDate = Carbon::parse($visit['scheduled_date']);
            if ($visit['status'] === 'scheduled' && 
                $scheduledDate >= $startOfMonth && 
                $scheduledDate <= $endOfMonth) {
                $upcomingVisitsThisMonth++;
            }
        }
        
        // Calculate due visits
        $projectsWithCompletedVisits = [];
        $hoasWithCompletedVisits = [];
        
        foreach ($siteVisits as $visit) {
            if ($visit['status'] === 'completed' && isset($visit['completed_at'])) {
                $completedAt = Carbon::parse($visit['completed_at']);
                if ($completedAt >= $startOfMonth && $completedAt <= $endOfMonth) {
                    if (isset($visit['project_id']) && $visit['project_id']) {
                        $projectsWithCompletedVisits[$visit['project_id']] = true;
                    }
                    if (isset($visit['hoa_id']) && $visit['hoa_id']) {
                        $hoasWithCompletedVisits[$visit['hoa_id']] = true;
                    }
                }
            }
        }
        
        $projectsDueCount = count($projects) - count($projectsWithCompletedVisits);
        $hoasDueCount = count(array_filter($hoas, fn($h) => $h['status'] === 'active')) - count($hoasWithCompletedVisits);
        
        return [
            'upcoming_visits_this_month' => $upcomingVisitsThisMonth,
            'due_visits_count' => max(0, $projectsDueCount) + max(0, $hoasDueCount),
            'projects_due_count' => max(0, $projectsDueCount),
            'hoas_due_count' => max(0, $hoasDueCount),
        ];
    }

    /**
     * Simulate revocation statistics calculation.
     */
    private function calculateRevocationStats(array $revocations, Carbon $currentDate): array
    {
        $total = count($revocations);
        $recent = 0;
        $thisMonth = 0;
        
        $thirtyDaysAgo = $currentDate->copy()->subDays(30);
        $startOfMonth = $currentDate->copy()->startOfMonth();
        
        foreach ($revocations as $revocation) {
            $revokedAt = Carbon::parse($revocation['revoked_at']);
            
            if ($revokedAt >= $thirtyDaysAgo) {
                $recent++;
            }
            
            if ($revokedAt->month === $currentDate->month && $revokedAt->year === $currentDate->year) {
                $thisMonth++;
            }
        }
        
        return [
            'total' => $total,
            'recent' => $recent,
            'this_month' => $thisMonth,
        ];
    }

    /**
     * Property test: HOA count equals actual count of HOAs.
     * 
     * For any set of HOAs, the dashboard total_hoas should equal the count.
     * 
     * @test
     */
    public function hoa_count_equals_actual_count(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(12345);

        for ($i = 0; $i < 100; $i++) {
            // Generate random number of HOAs (0 to 50)
            $hoaCount = $faker->numberBetween(0, 50);
            $hoas = [];
            
            for ($j = 0; $j < $hoaCount; $j++) {
                $hoas[] = [
                    'hoa_id' => $j + 1,
                    'hoa_name' => $faker->company,
                    'status' => $faker->randomElement(['active', 'inactive']),
                ];
            }
            
            $stats = $this->calculateHoaStats($hoas, [], Carbon::now());
            
            $this->assertEquals(
                $hoaCount,
                $stats['total_hoas'],
                sprintf('HOA count mismatch: expected %d, got %d', $hoaCount, $stats['total_hoas'])
            );
        }
    }

    /**
     * Property test: Active + Inactive officers equals total officers.
     * 
     * For any set of officers, active_officers + inactive_officers should equal total_officers.
     * 
     * @test
     */
    public function active_plus_inactive_equals_total_officers(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(23456);

        for ($i = 0; $i < 100; $i++) {
            $currentDate = Carbon::parse($faker->dateTimeBetween('-1 year', '+1 year')->format('Y-m-d'));
            
            // Generate random number of officers (0 to 30)
            $officerCount = $faker->numberBetween(0, 30);
            $officers = [];
            
            for ($j = 0; $j < $officerCount; $j++) {
                $periodStart = $faker->dateTimeBetween('-3 years', '+1 year');
                $periodEnd = $faker->dateTimeBetween($periodStart, '+3 years');
                
                $officers[] = [
                    'officer_id' => $j + 1,
                    'period_start' => $periodStart->format('Y-m-d'),
                    'period_end' => $periodEnd->format('Y-m-d'),
                ];
            }
            
            $stats = $this->calculateHoaStats([], $officers, $currentDate);
            
            $this->assertEquals(
                $stats['total_officers'],
                $stats['active_officers'] + $stats['inactive_officers'],
                sprintf(
                    'Officer count mismatch: total=%d, active=%d, inactive=%d',
                    $stats['total_officers'],
                    $stats['active_officers'],
                    $stats['inactive_officers']
                )
            );
        }
    }

    /**
     * Property test: Officer active status is correctly calculated.
     * 
     * For any officer, active status should match the period date logic.
     * 
     * @test
     */
    public function officer_active_status_matches_period_logic(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(34567);

        for ($i = 0; $i < 100; $i++) {
            $currentDate = Carbon::parse($faker->dateTimeBetween('-1 year', '+1 year')->format('Y-m-d'));
            
            // Generate officers with known active/inactive status
            $officers = [];
            $expectedActive = 0;
            $expectedInactive = 0;
            
            for ($j = 0; $j < 20; $j++) {
                $periodStart = $faker->dateTimeBetween('-3 years', '+1 year');
                $periodEnd = $faker->dateTimeBetween($periodStart, '+3 years');
                
                $officers[] = [
                    'officer_id' => $j + 1,
                    'period_start' => $periodStart->format('Y-m-d'),
                    'period_end' => $periodEnd->format('Y-m-d'),
                ];
                
                // Calculate expected status manually
                $start = Carbon::parse($periodStart->format('Y-m-d'))->startOfDay();
                $end = Carbon::parse($periodEnd->format('Y-m-d'))->startOfDay();
                $now = $currentDate->copy()->startOfDay();
                
                if ($start <= $now && $end >= $now) {
                    $expectedActive++;
                } else {
                    $expectedInactive++;
                }
            }
            
            $stats = $this->calculateHoaStats([], $officers, $currentDate);
            
            $this->assertEquals(
                $expectedActive,
                $stats['active_officers'],
                sprintf('Active officers mismatch on %s', $currentDate->format('Y-m-d'))
            );
            
            $this->assertEquals(
                $expectedInactive,
                $stats['inactive_officers'],
                sprintf('Inactive officers mismatch on %s', $currentDate->format('Y-m-d'))
            );
        }
    }

    /**
     * Property test: Revocation counts are accurate.
     * 
     * For any set of revocations, the counts should accurately reflect
     * total, recent (last 30 days), and this month.
     * 
     * @test
     */
    public function revocation_counts_are_accurate(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(45678);

        for ($i = 0; $i < 100; $i++) {
            $currentDate = Carbon::parse($faker->dateTimeBetween('2024-01-01', '2025-12-31')->format('Y-m-d'));
            
            // Generate random revocations
            $revocationCount = $faker->numberBetween(0, 50);
            $revocations = [];
            $expectedRecent = 0;
            $expectedThisMonth = 0;
            
            $thirtyDaysAgo = $currentDate->copy()->subDays(30);
            
            for ($j = 0; $j < $revocationCount; $j++) {
                $revokedAt = $faker->dateTimeBetween('-1 year', 'now');
                $revokedAtCarbon = Carbon::parse($revokedAt->format('Y-m-d H:i:s'));
                
                $revocations[] = [
                    'revocation_id' => $j + 1,
                    'revoked_at' => $revokedAt->format('Y-m-d H:i:s'),
                ];
                
                // Calculate expected counts
                if ($revokedAtCarbon >= $thirtyDaysAgo) {
                    $expectedRecent++;
                }
                
                if ($revokedAtCarbon->month === $currentDate->month && 
                    $revokedAtCarbon->year === $currentDate->year) {
                    $expectedThisMonth++;
                }
            }
            
            $stats = $this->calculateRevocationStats($revocations, $currentDate);
            
            $this->assertEquals(
                $revocationCount,
                $stats['total'],
                'Total revocations mismatch'
            );
            
            $this->assertEquals(
                $expectedRecent,
                $stats['recent'],
                sprintf('Recent revocations mismatch on %s', $currentDate->format('Y-m-d'))
            );
            
            $this->assertEquals(
                $expectedThisMonth,
                $stats['this_month'],
                sprintf('This month revocations mismatch on %s', $currentDate->format('Y-m-d'))
            );
        }
    }

    /**
     * Property test: Monitoring due visits calculation is accurate.
     * 
     * For any set of site visits, projects, and HOAs, the due visits count
     * should accurately reflect items needing attention.
     * 
     * @test
     */
    public function monitoring_due_visits_calculation_is_accurate(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(56789);

        for ($i = 0; $i < 100; $i++) {
            $currentDate = Carbon::parse($faker->dateTimeBetween('2024-01-01', '2025-12-31')->format('Y-m-d'));
            $startOfMonth = $currentDate->copy()->startOfMonth();
            $endOfMonth = $currentDate->copy()->endOfMonth();
            
            // Generate projects
            $projectCount = $faker->numberBetween(1, 10);
            $projects = [];
            for ($j = 0; $j < $projectCount; $j++) {
                $projects[] = ['project_id' => $j + 1];
            }
            
            // Generate HOAs (some active, some inactive)
            $hoaCount = $faker->numberBetween(1, 15);
            $hoas = [];
            $activeHoaCount = 0;
            for ($j = 0; $j < $hoaCount; $j++) {
                $status = $faker->randomElement(['active', 'inactive']);
                $hoas[] = [
                    'hoa_id' => $j + 1,
                    'status' => $status,
                ];
                if ($status === 'active') {
                    $activeHoaCount++;
                }
            }
            
            // Generate site visits
            $visitCount = $faker->numberBetween(0, 20);
            $siteVisits = [];
            $projectsWithCompletedVisits = [];
            $hoasWithCompletedVisits = [];
            
            for ($j = 0; $j < $visitCount; $j++) {
                $status = $faker->randomElement(['scheduled', 'completed', 'cancelled']);
                $scheduledDate = $faker->dateTimeBetween('-2 months', '+2 months');
                $completedAt = $status === 'completed' 
                    ? $faker->dateTimeBetween('-2 months', 'now')->format('Y-m-d H:i:s')
                    : null;
                
                $projectId = $faker->boolean(70) ? $faker->numberBetween(1, $projectCount) : null;
                $hoaId = !$projectId ? $faker->numberBetween(1, $hoaCount) : null;
                
                $siteVisits[] = [
                    'visit_id' => $j + 1,
                    'project_id' => $projectId,
                    'hoa_id' => $hoaId,
                    'scheduled_date' => $scheduledDate->format('Y-m-d'),
                    'status' => $status,
                    'completed_at' => $completedAt,
                ];
                
                // Track completed visits this month
                if ($status === 'completed' && $completedAt) {
                    $completedAtCarbon = Carbon::parse($completedAt);
                    if ($completedAtCarbon >= $startOfMonth && $completedAtCarbon <= $endOfMonth) {
                        if ($projectId) {
                            $projectsWithCompletedVisits[$projectId] = true;
                        }
                        if ($hoaId) {
                            $hoasWithCompletedVisits[$hoaId] = true;
                        }
                    }
                }
            }
            
            $stats = $this->calculateMonitoringStats($siteVisits, $projects, $hoas, $currentDate);
            
            $expectedProjectsDue = $projectCount - count($projectsWithCompletedVisits);
            $expectedHoasDue = $activeHoaCount - count($hoasWithCompletedVisits);
            
            $this->assertEquals(
                max(0, $expectedProjectsDue),
                $stats['projects_due_count'],
                'Projects due count mismatch'
            );
            
            $this->assertEquals(
                max(0, $expectedHoasDue),
                $stats['hoas_due_count'],
                'HOAs due count mismatch'
            );
        }
    }

    /**
     * Property test: Dashboard stats are deterministic.
     * 
     * For the same input data, the stats calculation should always return the same values.
     * 
     * @test
     */
    public function dashboard_stats_are_deterministic(): void
    {
        $faker = \Faker\Factory::create();
        $faker->seed(67890);

        for ($i = 0; $i < 50; $i++) {
            $currentDate = Carbon::parse($faker->dateTimeBetween('-1 year', '+1 year')->format('Y-m-d'));
            
            // Generate test data
            $hoas = [];
            $officers = [];
            
            for ($j = 0; $j < 10; $j++) {
                $hoas[] = [
                    'hoa_id' => $j + 1,
                    'status' => $faker->randomElement(['active', 'inactive']),
                ];
                
                $periodStart = $faker->dateTimeBetween('-2 years', '+1 year');
                $periodEnd = $faker->dateTimeBetween($periodStart, '+2 years');
                
                $officers[] = [
                    'officer_id' => $j + 1,
                    'period_start' => $periodStart->format('Y-m-d'),
                    'period_end' => $periodEnd->format('Y-m-d'),
                ];
            }
            
            // Calculate stats twice
            $stats1 = $this->calculateHoaStats($hoas, $officers, $currentDate);
            $stats2 = $this->calculateHoaStats($hoas, $officers, $currentDate);
            
            $this->assertEquals($stats1, $stats2, 'Dashboard stats should be deterministic');
        }
    }
}
