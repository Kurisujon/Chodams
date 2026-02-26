<?php

namespace App\Models;

use App\Services\FileStorageService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Revocation extends Model
{
    /**
     * Violation reason codes based on usufruct terms.
     */
    const VIOLATION_REASONS = [
        '4.1' => 'Used lot for non-residential purposes',
        '4.3' => 'Sold, disposed, mortgaged, or transferred without consent',
        '4.4' => 'Entered unauthorized lease or use agreements',
        '4.5' => 'Alienated or transferred usufructuary rights',
        '4.6' => 'Failed to notify of third-party prejudicial acts',
        '4.7' => 'Failed to build house within 6 months of award',
        '4.9' => 'Transferred residence to another place/barangay',
        '4.10' => 'Used property for unlawful/illegal acts',
        '1.1' => 'Violated contract conditions',
        '1.2' => 'Bad faith or prejudicial acts against landowner',
    ];

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'revocations';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'revocation_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'survey_id',
        'project_id',
        'lot_info',
        'violation_reasons',
        'remarks',
        'documentation_path',
        'revoked_by',
        'revoked_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'violation_reasons' => 'array',
        'revoked_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['documentation_url', 'is_documentation_image'];

    /**
     * Get the public URL for the documentation file.
     *
     * @return string|null
     */
    public function getDocumentationUrlAttribute(): ?string
    {
        return FileStorageService::getUrl($this->documentation_path);
    }

    /**
     * Check if the documentation is an image file.
     *
     * @return bool
     */
    public function getIsDocumentationImageAttribute(): bool
    {
        if (empty($this->documentation_path)) {
            return false;
        }
        
        $extension = strtolower(pathinfo($this->documentation_path, PATHINFO_EXTENSION));
        return in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    }

    /**
     * Get the survey (beneficiary) associated with the revocation.
     */
    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class, 'survey_id', 'survey_id');
    }

    /**
     * Get the project site associated with the revocation.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(SiteProj::class, 'project_id', 'project_id');
    }

    /**
     * Get the admin who performed the revocation.
     */
    public function revokedBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'revoked_by', 'id');
    }
}
