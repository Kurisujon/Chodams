<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HOAMember extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'hoa_members';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'member_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'hoa_id',
        'survey_id',
        'name',
        'contact_info',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the HOA that owns the member.
     */
    public function hoa(): BelongsTo
    {
        return $this->belongsTo(HOA::class, 'hoa_id', 'hoa_id');
    }

    /**
     * Get the survey (beneficiary) associated with the member.
     */
    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class, 'survey_id', 'survey_id');
    }
}
