<?php

namespace App\Models;

use App\Services\FileStorageService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HOADocument extends Model
{
    /**
     * Document type constants - HOA Registration Checklist of Requirements.
     */
    const TYPE_ELECTED_OFFICERS = 'elected-officers';
    const TYPE_CONSTITUTION_BYLAWS = 'constitution-bylaws';
    const TYPE_ARTICLES_INCORPORATION = 'articles-incorporation';
    const TYPE_WRITTEN_UNDERTAKING = 'written-undertaking';
    const TYPE_CERTIFICATION = 'certification';
    const TYPE_AUTHORIZATION = 'authorization';
    const TYPE_GENERAL_INFO_SHEET = 'general-info-sheet';
    const TYPE_MASTERLIST_MEMBERS = 'masterlist-members';
    const TYPE_SUBDIVISION_PLAN = 'subdivision-plan';
    const TYPE_REGISTRATION_LICENSE = 'registration-license';
    const TYPE_CODE_OF_ETHICS = 'code-of-ethics';
    const TYPE_BOARD_RESOLUTION = 'board-resolution';
    const TYPE_MINUTES_ORGANIZATIONAL = 'minutes-organizational';
    const TYPE_FILING_FEE = 'filing-fee';
    const TYPE_OTHER = 'other';

    /**
     * Available document types - HOA Registration Checklist of Requirements.
     */
    const DOCUMENT_TYPES = [
        self::TYPE_ELECTED_OFFICERS => 'List of Duly Elected Officers of the HOA',
        self::TYPE_CONSTITUTION_BYLAWS => 'Constitution and By Laws',
        self::TYPE_ARTICLES_INCORPORATION => 'Article of Incorporation',
        self::TYPE_WRITTEN_UNDERTAKING => 'Written Undertaking',
        self::TYPE_CERTIFICATION => 'Certification',
        self::TYPE_AUTHORIZATION => 'Authorization',
        self::TYPE_GENERAL_INFO_SHEET => 'General Information Sheet/Census Form',
        self::TYPE_MASTERLIST_MEMBERS => 'Masterlists of Members of the HOA',
        self::TYPE_SUBDIVISION_PLAN => 'Approved Subdivision Plan or Verified Survey Plan',
        self::TYPE_REGISTRATION_LICENSE => 'Photocopy of Certificate of Registration and License to Sell',
        self::TYPE_CODE_OF_ETHICS => 'Code of Ethics and Ethical Standards for Officer/Board Members of HOA',
        self::TYPE_BOARD_RESOLUTION => 'Board Resolution',
        self::TYPE_MINUTES_ORGANIZATIONAL => 'Minutes of the Organizational Meeting',
        self::TYPE_FILING_FEE => 'Filing/Processing Fee',
        self::TYPE_OTHER => 'Other',
    ];

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'hoa_documents';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'document_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'hoa_id',
        'document_name',
        'document_type',
        'file_path',
        'file_size',
        'uploaded_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['file_url', 'is_image'];

    /**
     * Get the public URL for the document file.
     *
     * @return string|null
     */
    public function getFileUrlAttribute(): ?string
    {
        return FileStorageService::getUrl($this->file_path);
    }

    /**
     * Check if the document is an image file.
     *
     * @return bool
     */
    public function getIsImageAttribute(): bool
    {
        if (empty($this->file_path)) {
            return false;
        }
        
        $extension = strtolower(pathinfo($this->file_path, PATHINFO_EXTENSION));
        return in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    }

    /**
     * Get the HOA that owns the document.
     */
    public function hoa(): BelongsTo
    {
        return $this->belongsTo(HOA::class, 'hoa_id', 'hoa_id');
    }

    /**
     * Get the admin who uploaded the document.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'uploaded_by', 'id');
    }
}
