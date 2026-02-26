<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Updates zone names from numeric format (Zone 1, Zone 2, Zone 3) 
     * to Roman numeral format (Zone I, Zone II, Zone III) for consistency
     * across mobile and web applications.
     */
    public function up(): void
    {
        // Update demographic table
        DB::table('demographic')
            ->where('barangay', 'Zone 1')
            ->update(['barangay' => 'Zone I']);
            
        DB::table('demographic')
            ->where('barangay', 'Zone 2')
            ->update(['barangay' => 'Zone II']);
            
        DB::table('demographic')
            ->where('barangay', 'Zone 3')
            ->update(['barangay' => 'Zone III']);

        // Update with underscore variants
        DB::table('demographic')
            ->where('barangay', 'Zone_1')
            ->update(['barangay' => 'Zone_I']);
            
        DB::table('demographic')
            ->where('barangay', 'Zone_2')
            ->update(['barangay' => 'Zone_II']);
            
        DB::table('demographic')
            ->where('barangay', 'Zone_3')
            ->update(['barangay' => 'Zone_III']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to numeric format
        DB::table('demographic')
            ->where('barangay', 'Zone I')
            ->update(['barangay' => 'Zone 1']);
            
        DB::table('demographic')
            ->where('barangay', 'Zone II')
            ->update(['barangay' => 'Zone 2']);
            
        DB::table('demographic')
            ->where('barangay', 'Zone III')
            ->update(['barangay' => 'Zone 3']);

        // Revert underscore variants
        DB::table('demographic')
            ->where('barangay', 'Zone_I')
            ->update(['barangay' => 'Zone_1']);
            
        DB::table('demographic')
            ->where('barangay', 'Zone_II')
            ->update(['barangay' => 'Zone_2']);
            
        DB::table('demographic')
            ->where('barangay', 'Zone_III')
            ->update(['barangay' => 'Zone_3']);
    }
};
