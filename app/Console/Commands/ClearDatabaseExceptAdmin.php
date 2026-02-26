<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ClearDatabaseExceptAdmin extends Command
{
    protected $signature = 'db:clear-except-admin';

    protected $description = 'Clear all database tables except the admin and core system tables';

    public function handle()
    {
        $this->warn('This will CLEAR almost all data in the database except admin and core tables.');

        if (! $this->confirm('Do you wish to continue?', true)) {
            $this->info('Operation cancelled.');
            return 0;
        }

        $database = DB::getDatabaseName();

        if (! $database) {
            $this->error('No database is configured.');
            return 1;
        }

        $excludedTables = [
            'admin',
            'migrations',
            'personal_access_tokens',
            'failed_jobs',
            'password_resets',
        ];

        try {
            $tables = DB::select("
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = ?
            ", [$database]);

            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            foreach ($tables as $table) {
                $name = $table->table_name ?? $table->TABLE_NAME ?? null;

                if (! $name) {
                    continue;
                }

                if (in_array($name, $excludedTables)) {
                    $this->info("Skipping table: {$name}");
                    continue;
                }

                $this->info("Truncating table: {$name}");
                DB::statement("TRUNCATE TABLE `{$name}`");
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            $this->info('Database cleared successfully except admin and core tables.');

        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            $this->error('An error occurred while clearing the database: '.$e->getMessage());
            return 1;
        }

        return 0;
    }
}

