<?php

namespace App\Console\Commands;

use App\Models\Validator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ClearDummySurveys extends Command
{
    protected $signature = 'surveys:clear-dummy';

    protected $description = 'Clear dummy survey records created by Kent and Cris (is_submitted = 0)';

    public function handle(): int
    {
        $validatorUsernames = ['Kent', 'Cris'];

        $validators = Validator::query()
            ->whereIn('username', $validatorUsernames)
            ->get()
            ->keyBy('username');

        if ($validators->count() < 2) {
            $this->warn('Kent and/or Cris validators not found. Checking for any dummy surveys...');
        }

        $kentId = $validators['Kent']->validator_id ?? null;
        $crisId = $validators['Cris']->validator_id ?? null;

        $validatorIds = array_filter([$kentId, $crisId]);

        if (empty($validatorIds)) {
            $this->error('No validators found. Cannot clear dummy surveys.');
            return 1;
        }

        // Find all unsubmitted surveys from Kent and Cris
        $existingSurveyIds = DB::table('survey')
            ->whereIn('validator_id', $validatorIds)
            ->where('is_submitted', 0)
            ->pluck('survey_id');

        if ($existingSurveyIds->isEmpty()) {
            $this->info('No dummy surveys found to clear.');
            return 0;
        }

        $count = $existingSurveyIds->count();
        $this->warn("Found {$count} dummy survey(s) to delete.");

        if (!$this->confirm('Do you want to delete these dummy surveys?', true)) {
            $this->info('Operation cancelled.');
            return 0;
        }

        try {
            DB::transaction(function () use ($existingSurveyIds) {
                DB::table('household_mem')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('training')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('economic')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('household')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('demographic')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('classification')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('assignments')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('survey')->whereIn('survey_id', $existingSurveyIds)->delete();
            });

            $this->info("✓ Successfully deleted {$count} dummy survey(s) and all related data.");
            return 0;
        } catch (\Exception $e) {
            $this->error('An error occurred while clearing dummy surveys: ' . $e->getMessage());
            return 1;
        }
    }
}
