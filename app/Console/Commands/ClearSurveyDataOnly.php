<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClearSurveyDataOnly extends Command
{
    protected $signature = 'surveys:clear-data';

    protected $description = 'Clear all survey-related data while preserving admin and validator accounts';

    public function handle()
    {
        $this->warn('This will clear ALL survey data (survey, demographic, household, economic, training, household_mem, classification, assignments).');
        $this->info('Admin and Validator accounts will be preserved.');
        
        if (!$this->confirm('Do you wish to continue?', true)) {
            $this->info('Operation cancelled.');
            return 0;
        }

        $tables = [
            'household_mem',
            'training',
            'economic',
            'household',
            'demographic',
            'classification',
            'assignments',
            'survey',
        ];

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    $count = DB::table($table)->count();
                    $this->info("Clearing table: $table ($count rows)");
                    DB::table($table)->truncate();
                } else {
                    $this->warn("Table $table does not exist, skipping.");
                }
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            $this->info('✓ Successfully cleared all survey data.');
            $this->info('✓ Admin and Validator accounts preserved.');
            
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            $this->error('An error occurred while clearing data: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
