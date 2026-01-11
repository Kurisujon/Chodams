<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClearSurveyData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'surveys:clear-all';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all survey-related data while preserving admin and validator accounts';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->warn('This will clear ALL data from survey, demographic, household, economic, training, household_mem, classification, and assignments tables.');
        
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
            // Disable foreign key checks for truncation
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    $this->info("Clearing table: $table");
                    DB::table($table)->truncate();
                } else {
                    $this->warn("Table $table does not exist, skipping.");
                }
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            $this->info('Successfully cleared all survey-related dummy data.');
            $this->info('Admin and Validator accounts remain untouched.');
            
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            $this->error('An error occurred while clearing data: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
