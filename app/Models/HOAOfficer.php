<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HOAOfficer extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'hoa_officers';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'officer_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'hoa_id',
        'name',
        'position',
        'phone_number',
        'period_start',
        'period_end',
        'remarks',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the HOA that owns the officer.
     */
    public function hoa(): BelongsTo
    {
        return $this->belongsTo(HOA::class, 'hoa_id', 'hoa_id');
    }

    /**
     * Accessor to determine if the officer is currently active.
     * An officer is active if the current date is between period_start and period_end (inclusive).
     *
     * @return bool
     */
    public function getIsActiveAttribute(): bool
    {
        $now = now()->startOfDay();
        return $this->period_start <= $now && $this->period_end >= $now;
    }
}
