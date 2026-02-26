<?php

namespace App\Models;

use App\Services\FileStorageService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonitoringRecord extends Model
{
    /**
     * Status option constants.
     */
    const STATUS_HOUSE_CONSTRUCTED = 'house_constructed';
    const STATUS_UNDER_CONSTRUCTION = 'under_construction';
    const STATUS_VACANT = 'vacant';
    const STATUS_ABANDONED = 'abandoned';
    const STATUS_OTHER = 'other';

    /**
     * Available status options with display labels.
     */
    const STATUS_OPTIONS = [
        self::STATUS_HOUSE_CONSTRUCTED => 'House constructed',
        self::STATUS_UNDER_CONSTRUCTION => 'Under construction',
        self::STATUS_VACANT => 'Vacant',
        self::STATUS_ABANDONED => 'Abandoned',
        self::STATUS_OTHER => 'Other',
    ];

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'monitoring_records';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'record_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'survey_id',
        'visit_date',
        'status',
        'remarks',
        'documents_path',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'visit_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['documents_url', 'is_documents_image'];

    /**
     * Get the survey (beneficiary) that owns the monitoring record.
     */
    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class, 'survey_id', 'survey_id');
    }

    /**
     * Get the admin who created the monitoring record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by', 'id');
    }

    /**
     * Get the public URL for the documents file.
     *
     * @return string|null
     */
    public function getDocumentsUrlAttribute(): ?string
    {
        return FileStorageService::getUrl($this->documents_path);
    }

    /**
     * Check if the documents file is an image.
     *
     * @return bool
     */
    public function getIsDocumentsImageAttribute(): bool
    {
        if (empty($this->documents_path)) {
            return false;
        }
        
        $extension = strtolower(pathinfo($this->documents_path, PATHINFO_EXTENSION));
        return in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    }
}
