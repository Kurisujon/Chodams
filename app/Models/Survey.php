<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Survey extends Model
{
    use SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'survey';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'survey_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'validator_id',
        'interviewed_by',
        'date_interviewed',
        'is_submitted',
        'validator_signature',
        'priority_score',
        'score_calculated_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_interviewed' => 'date',
        'is_submitted' => 'integer',
        'priority_score' => 'decimal:2',
        'score_calculated_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the monitoring records for the survey.
     */
    public function monitoringRecords(): HasMany
    {
        return $this->hasMany(MonitoringRecord::class, 'survey_id', 'survey_id');
    }

    /**
     * Get the HOA members associated with this survey.
     */
    public function hoaMembers(): HasMany
    {
        return $this->hasMany(HOAMember::class, 'survey_id', 'survey_id');
    }

    /**
     * Get the revocations for the survey.
     */
    public function revocations(): HasMany
    {
        return $this->hasMany(Revocation::class, 'survey_id', 'survey_id');
    }

    /**
     * Get the demographic data for the survey.
     */
    public function demographic(): HasOne
    {
        return $this->hasOne(Demographic::class, 'survey_id', 'survey_id');
    }

    /**
     * Scope to order surveys by priority score.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $direction Sort direction ('asc' or 'desc')
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeOrderByScore($query, string $direction = 'desc')
    {
        return $query->orderBy('priority_score', $direction);
    }

    /**
     * Check if the survey's priority score needs recalculation.
     *
     * @return bool
     */
    public function needsScoreRecalculation(): bool
    {
        // Score needs recalculation if:
        // 1. It has never been calculated (score_calculated_at is null)
        // 2. The survey has been updated after the score was calculated
        return $this->score_calculated_at === null 
            || $this->updated_at > $this->score_calculated_at;
    }
}
