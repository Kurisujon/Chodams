<?php

namespace App\Console\Commands;

use App\Services\FileStorageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class FixFileStoragePaths extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:fix-paths {--sync : Also sync files to public directory}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix file storage paths in the database and optionally sync files to public directory';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting file storage path fix...');
        $this->newLine();

        // Fix paths in database
        $this->fixDatabasePaths();

        // Optionally sync files to public directory
        if ($this->option('sync')) {
            $this->syncFilesToPublic();
        }

        $this->newLine();
        $this->info('File storage path fix completed!');
        $this->newLine();
        
        // Show instructions
        $this->showInstructions();

        return Command::SUCCESS;
    }

    /**
     * Fix file paths in the database.
     */
    private function fixDatabasePaths(): void
    {
        $this->info('Fixing database paths...');

        $tables = [
            ['table' => 'siteproj', 'column' => 'proj_image'],
            ['table' => 'hoa', 'column' => 'hoa_image'],
            ['table' => 'hoa_documents', 'column' => 'file_path'],
            ['table' => 'revocations', 'column' => 'documentation_path'],
        ];

        $totalFixed = 0;

        foreach ($tables as $config) {
            $count = FileStorageService::migrateFilePaths($config['table'], $config['column']);
            if ($count > 0) {
                $this->line("  - Fixed {$count} paths in {$config['table']}.{$config['column']}");
                $totalFixed += $count;
            }
        }

        if ($totalFixed === 0) {
            $this->line('  - No paths needed fixing.');
        } else {
            $this->info("  Total: {$totalFixed} paths fixed.");
        }
    }

    /**
     * Sync files from storage to public directory.
     */
    private function syncFilesToPublic(): void
    {
        $this->newLine();
        $this->info('Syncing files to public directory...');

        $directories = ['projects', 'hoa_images', 'hoa_documents', 'revocation_documents'];
        $totalSynced = 0;

        foreach ($directories as $dir) {
            $count = $this->syncDirectory($dir);
            if ($count > 0) {
                $this->line("  - Synced {$count} files in {$dir}/");
                $totalSynced += $count;
            }
        }

        if ($totalSynced === 0) {
            $this->line('  - No files needed syncing.');
        } else {
            $this->info("  Total: {$totalSynced} files synced.");
        }
    }

    /**
     * Sync a specific directory from storage to public.
     */
    private function syncDirectory(string $directory): int
    {
        $count = 0;

        try {
            if (!Storage::disk('public')->exists($directory)) {
                return 0;
            }

            $files = Storage::disk('public')->files($directory);
            $publicDir = public_path('storage/' . $directory);

            // Create public directory if it doesn't exist
            if (!is_dir($publicDir)) {
                @mkdir($publicDir, 0775, true);
            }

            foreach ($files as $file) {
                $filename = basename($file);
                $sourcePath = Storage::disk('public')->path($file);
                $destPath = $publicDir . '/' . $filename;

                // Only copy if destination doesn't exist or is older
                if (!file_exists($destPath) || filemtime($sourcePath) > filemtime($destPath)) {
                    if (@copy($sourcePath, $destPath)) {
                        $count++;
                    }
                }
            }

        } catch (\Exception $e) {
            $this->error("  Error syncing {$directory}: " . $e->getMessage());
        }

        return $count;
    }

    /**
     * Show setup instructions.
     */
    private function showInstructions(): void
    {
        $this->info('=== IMPORTANT SETUP INSTRUCTIONS ===');
        $this->newLine();
        
        $this->line('For the live server (cPanel/shared hosting):');
        $this->newLine();
        
        $this->line('1. Create the storage symbolic link:');
        $this->line('   Option A - Via SSH:');
        $this->line('   cd public_html && ln -s ../storage/app/public storage');
        $this->newLine();
        
        $this->line('   Option B - Via cPanel File Manager:');
        $this->line('   - Navigate to public_html');
        $this->line('   - Delete the storage folder if it exists (backup first!)');
        $this->line('   - Create a symbolic link named "storage" pointing to "../storage/app/public"');
        $this->newLine();
        
        $this->line('2. Set correct permissions:');
        $this->line('   chmod -R 755 storage/app/public');
        $this->line('   chmod -R 755 public_html/storage');
        $this->newLine();
        
        $this->line('3. Verify the link works:');
        $this->line('   Visit: https://yoursite.com/storage/projects/any-image.jpg');
        $this->newLine();
        
        $this->line('For development (Laravel):');
        $this->line('   php artisan storage:link');
        $this->newLine();
    }
}
