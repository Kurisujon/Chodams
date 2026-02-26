<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteVisit extends Model
{
    /**
     * Status constants.
     */
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Available status options.
     */
    const STATUS_OPTIONS = [
        self::STATUS_SCHEDULED => 'Scheduled',
        self::STATUS_COMPLETED => 'Completed',
        self::STATUS_CANCELLED => 'Cancelled',
    ];

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'site_visits';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'visit_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'project_id',
        'hoa_id',
        'scheduled_date',
        'assigned_staff',
        'status',
        'visit_notes',
        'findings',
        'completed_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'scheduled_date' => 'date',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the project site for the site visit.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(SiteProj::class, 'project_id', 'project_id');
    }

    /**
     * Get the HOA for the site visit.
     */
    public function hoa(): BelongsTo
    {
        return $this->belongsTo(HOA::class, 'hoa_id', 'hoa_id');
    }
}
