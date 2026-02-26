<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SiteProj extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'siteproj';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'project_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'project_name',
        'land_area',
        'total_blocks',
        'total_lots',
        'barangay',
        'year_started',
        'description',
        'proj_image',
        'geojson',
        'blocks_json',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'land_area' => 'decimal:2',
        'total_blocks' => 'integer',
        'total_lots' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the HOAs for the project site.
     */
    public function hoas(): HasMany
    {
        return $this->hasMany(HOA::class, 'project_id', 'project_id');
    }

    /**
     * Get the site visits for the project site.
     */
    public function siteVisits(): HasMany
    {
        return $this->hasMany(SiteVisit::class, 'project_id', 'project_id');
    }

    /**
     * Get the revocations for the project site.
     */
    public function revocations(): HasMany
    {
        return $this->hasMany(Revocation::class, 'project_id', 'project_id');
    }
}
