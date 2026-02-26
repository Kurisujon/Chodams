<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Demographic extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'demographic';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'demographic_id';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'survey_id',
        'interview_person',
        'last_name',
        'first_name',
        'middle_name',
        'suffix',
        'barangay',
        'purok',
        'tag_number',
    ];

    /**
     * Get the survey that owns the demographic.
     */
    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class, 'survey_id', 'survey_id');
    }
}
