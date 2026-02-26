<?php

namespace App\Models;

use App\Services\FileStorageService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HOA extends Model
{
    use SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'hoa';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'hoa_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'project_id',
        'hoa_name',
        'hoa_image',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['image_url'];

    /**
     * Get the public URL for the HOA image.
     *
     * @return string|null
     */
    public function getImageUrlAttribute(): ?string
    {
        return FileStorageService::getUrl($this->hoa_image);
    }

    /**
     * Get the project site that owns the HOA.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(SiteProj::class, 'project_id', 'project_id');
    }

    /**
     * Get the officers for the HOA.
     */
    public function officers(): HasMany
    {
        return $this->hasMany(HOAOfficer::class, 'hoa_id', 'hoa_id');
    }

    /**
     * Get the members for the HOA.
     */
    public function members(): HasMany
    {
        return $this->hasMany(HOAMember::class, 'hoa_id', 'hoa_id');
    }

    /**
     * Get the documents for the HOA.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(HOADocument::class, 'hoa_id', 'hoa_id');
    }

    /**
     * Get the site visits for the HOA.
     */
    public function siteVisits(): HasMany
    {
        return $this->hasMany(SiteVisit::class, 'hoa_id', 'hoa_id');
    }

    /**
     * Scope to get active officers (current date between period_start and period_end).
     */
    public function activeOfficers(): HasMany
    {
        return $this->officers()
            ->where('period_start', '<=', now()->startOfDay())
            ->where('period_end', '>=', now()->startOfDay());
    }
}
