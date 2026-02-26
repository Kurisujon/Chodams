<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BeneficiaryScoreService;

class RecalculateBeneficiaryScores extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scores:recalculate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate priority scores for all beneficiaries';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting score recalculation for all beneficiaries...');
        
        $service = new BeneficiaryScoreService();
        
        try {
            $count = $service->recalculateAll();
            
            $this->info("Successfully recalculated scores for {$count} beneficiaries.");
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to recalculate scores: ' . $e->getMessage());
            
            return Command::FAILURE;
        }
    }
}
