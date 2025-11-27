<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyResponse extends Model
{
    use HasFactory;

    protected $table = 'survey_response';
    
    protected $primaryKey = 'survey_id';

    protected $guarded = [];

    // Disable timestamps if the table doesn't have created_at/updated_at
    public $timestamps = false; 
    // Assuming it has timestamps since usually Laravel tables do.
}
