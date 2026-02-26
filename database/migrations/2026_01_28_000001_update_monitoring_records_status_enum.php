<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // First, update any existing 'not_occupied' records to 'vacant' for data consistency
        DB::table('monitoring_records')
            ->where('status', 'not_occupied')
            ->update(['status' => 'vacant']);

        // Modify the status column to use the new ENUM values
        DB::statement("ALTER TABLE monitoring_records MODIFY COLUMN status ENUM('house_constructed', 'under_construction', 'vacant', 'abandoned', 'other') NOT NULL");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Revert to the old ENUM values
        DB::statement("ALTER TABLE monitoring_records MODIFY COLUMN status ENUM('not_occupied', 'house_constructed', 'under_construction', 'vacant', 'other') NOT NULL");
        
        // Optionally revert 'vacant' back to 'not_occupied' if needed
        // DB::table('monitoring_records')
        //     ->where('status', 'vacant')
        //     ->update(['status' => 'not_occupied']);
    }
};
