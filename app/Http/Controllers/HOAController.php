<?php

namespace App\Http\Controllers;

use App\Models\HOA;
use App\Models\HOAOfficer;
use App\Models\HOAMember;
use App\Models\HOADocument;
use App\Models\SiteProj;
use App\Services\FileStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class HOAController extends Controller
{
    /**
     * Display a listing of HOAs with pagination, search, and project filter.
     * Requirements: 1.3
     */
    public function index(Request $request)
    {
        $query = HOA::with(['project', 'officers']);

        // Search by HOA name
        if ($request->filled('search')) {
            $query->where('hoa_name', 'like', '%' . $request->search . '%');
        }

        // Filter by project
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 10);
        $hoas = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Add active officers count to each HOA
        $hoas->getCollection()->transform(function ($hoa) {
            $hoa->active_officers_count = $hoa->officers->filter(function ($officer) {
                return $officer->is_active;
            })->count();
            $hoa->total_officers_count = $hoa->officers->count();
            return $hoa;
        });

        $projects = SiteProj::select('project_id', 'project_name')->orderBy('project_name')->get();

        return response()->json([
            'hoas' => $hoas,
            'projects' => $projects,
        ]);
    }

    /**
     * Store a newly created HOA.
     * Requirements: 1.1, 1.2, 1.5
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'hoa_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('hoa')->where(function ($query) use ($request) {
                    return $query->where('project_id', $request->project_id)
                                 ->whereNull('deleted_at');
                }),
            ],
            'project_id' => 'required|exists:siteproj,project_id',
            'hoa_image' => 'required|file|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            'status' => 'sometimes|in:active,inactive',
        ], [
            'hoa_name.unique' => 'An HOA with this name already exists in the selected project site.',
            'hoa_image.required' => 'Please select an image for the HOA.',
            'hoa_image.file' => 'The HOA image must be a valid file.',
            'hoa_image.mimes' => 'The HOA image must be a JPEG, PNG, JPG, or GIF file.',
            'hoa_image.max' => 'The HOA image must not exceed 5MB.',
        ]);

        try {
            DB::beginTransaction();

            // Handle image upload using FileStorageService
            $imagePath = null;
            if ($request->hasFile('hoa_image')) {
                $result = FileStorageService::store(
                    $request->file('hoa_image'),
                    'hoa_images',
                    'hoa_'
                );
                
                if (!$result['success']) {
                    throw new \Exception($result['error'] ?? 'Failed to upload image.');
                }
                
                $imagePath = $result['path']; // e.g., 'hoa_images/hoa_xxx.jpg'
            }

            $hoa = HOA::create([
                'hoa_name' => $validated['hoa_name'],
                'project_id' => $validated['project_id'],
                'hoa_image' => $imagePath,
                'status' => $validated['status'] ?? 'active',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'HOA created successfully.',
                'hoa' => $hoa->load('project'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('HOA creation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create HOA: ' . $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Position hierarchy for sorting officers (highest to lowest).
     */
    const POSITION_HIERARCHY = [
        'president' => 1,
        'vice president' => 2,
        'vice-president' => 2,
        'secretary' => 3,
        'treasurer' => 4,
        'auditor' => 5,
        'pro' => 6,
        'p.r.o' => 6,
        'p.r.o.' => 6,
        'board member' => 7,
        'board of director' => 7,
        'director' => 8,
        'member' => 9,
    ];

    /**
     * Get position rank for sorting (lower number = higher position).
     */
    private function getPositionRank(string $position): int
    {
        $normalizedPosition = strtolower(trim($position));
        
        // Check for exact match first
        if (isset(self::POSITION_HIERARCHY[$normalizedPosition])) {
            return self::POSITION_HIERARCHY[$normalizedPosition];
        }
        
        // Check for partial match
        foreach (self::POSITION_HIERARCHY as $key => $rank) {
            if (str_contains($normalizedPosition, $key)) {
                return $rank;
            }
        }
        
        // Unknown positions go to the end
        return 99;
    }

    /**
     * Display the specified HOA with officers, members, and documents.
     * Requirements: 1.3
     */
    public function show(int $id)
    {
        $hoa = HOA::with([
            'project',
            'officers',
            'members' => function ($query) {
                $query->orderBy('name');
            },
            'documents' => function ($query) {
                $query->orderBy('created_at', 'desc');
            },
        ])->findOrFail($id);

        // Add is_active status and sort officers by position hierarchy
        $sortedOfficers = $hoa->officers->map(function ($officer) {
            $officer->is_active = $officer->is_active;
            $officer->position_rank = $this->getPositionRank($officer->position ?? '');
            return $officer;
        })->sortBy('position_rank')->values();
        
        $hoa->setRelation('officers', $sortedOfficers);

        return response()->json([
            'success' => true,
            'hoa' => $hoa,
        ]);
    }

    /**
     * Update the specified HOA.
     * Requirements: 1.4
     */
    public function update(Request $request, int $id)
    {
        $hoa = HOA::findOrFail($id);

        $validated = $request->validate([
            'hoa_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('hoa')->where(function ($query) use ($request, $hoa) {
                    return $query->where('project_id', $request->project_id ?? $hoa->project_id)
                                 ->whereNull('deleted_at');
                })->ignore($hoa->hoa_id, 'hoa_id'),
            ],
            'project_id' => 'sometimes|required|exists:siteproj,project_id',
            'hoa_image' => 'sometimes|file|mimes:jpeg,png,jpg,gif|max:5120',
            'status' => 'sometimes|in:active,inactive',
        ], [
            'hoa_name.unique' => 'An HOA with this name already exists in the selected project site.',
            'hoa_image.file' => 'The HOA image must be a valid file.',
            'hoa_image.mimes' => 'The HOA image must be a JPEG, PNG, JPG, or GIF file.',
            'hoa_image.max' => 'The HOA image must not exceed 5MB.',
        ]);

        try {
            DB::beginTransaction();

            // Handle image upload if provided
            if ($request->hasFile('hoa_image')) {
                // Delete old image if exists
                if ($hoa->hoa_image) {
                    FileStorageService::delete($hoa->hoa_image);
                }

                $result = FileStorageService::store(
                    $request->file('hoa_image'),
                    'hoa_images',
                    'hoa_'
                );
                
                if (!$result['success']) {
                    throw new \Exception($result['error'] ?? 'Failed to upload image.');
                }
                
                $validated['hoa_image'] = $result['path']; // e.g., 'hoa_images/hoa_xxx.jpg'
            }

            $hoa->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'HOA updated successfully.',
                'hoa' => $hoa->fresh()->load('project'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('HOA update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update HOA: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Soft delete the specified HOA.
     * Requirements: 1.4
     */
    public function destroy(int $id)
    {
        $hoa = HOA::findOrFail($id);

        try {
            $hoa->delete(); // Soft delete

            return response()->json([
                'success' => true,
                'message' => 'HOA deleted successfully.',
            ]);

        } catch (\Exception $e) {
            Log::error('HOA deletion error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete HOA: ' . $e->getMessage(),
            ], 500);
        }
    }


    // ==================== OFFICER MANAGEMENT ====================

    /**
     * Store a new officer for an HOA.
     * Requirements: 2.1, 2.2, 2.7
     */
    public function storeOfficer(Request $request, int $hoaId)
    {
        $hoa = HOA::findOrFail($hoaId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'required|string|max:100',
            'phone_number' => 'required|string|max:20',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'remarks' => 'nullable|string',
        ]);

        try {
            $officer = $hoa->officers()->create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Officer added successfully.',
                'officer' => $officer,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Officer creation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add officer: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an officer's information.
     * Requirements: 2.6
     */
    public function updateOfficer(Request $request, int $hoaId, int $officerId)
    {
        $hoa = HOA::findOrFail($hoaId);
        $officer = $hoa->officers()->where('officer_id', $officerId)->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'position' => 'sometimes|required|string|max:100',
            'phone_number' => 'sometimes|required|string|max:20',
            'period_start' => 'sometimes|required|date',
            'period_end' => 'sometimes|required|date|after_or_equal:period_start',
            'remarks' => 'nullable|string',
        ]);

        try {
            $officer->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Officer updated successfully.',
                'officer' => $officer->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Officer update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update officer: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an officer from an HOA.
     * Requirements: 2.7
     */
    public function destroyOfficer(int $hoaId, int $officerId)
    {
        $hoa = HOA::findOrFail($hoaId);
        $officer = $hoa->officers()->where('officer_id', $officerId)->firstOrFail();

        try {
            $officer->delete();

            return response()->json([
                'success' => true,
                'message' => 'Officer removed successfully.',
            ]);

        } catch (\Exception $e) {
            Log::error('Officer deletion error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove officer: ' . $e->getMessage(),
            ], 500);
        }
    }


    // ==================== MEMBER MANAGEMENT ====================

    /**
     * Store members for an HOA (bulk add).
     * Requirements: 3.1, 3.5
     */
    public function storeMembers(Request $request, int $hoaId)
    {
        $hoa = HOA::findOrFail($hoaId);

        $validated = $request->validate([
            'members' => 'required|array|min:1',
            'members.*.name' => 'required|string|max:255',
            'members.*.contact_info' => 'nullable|string|max:255',
            'members.*.survey_id' => 'nullable|exists:survey,survey_id',
        ]);

        try {
            DB::beginTransaction();

            $createdMembers = [];
            foreach ($validated['members'] as $memberData) {
                $member = $hoa->members()->create([
                    'name' => $memberData['name'],
                    'contact_info' => $memberData['contact_info'] ?? null,
                    'survey_id' => $memberData['survey_id'] ?? null,
                ]);
                $createdMembers[] = $member;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($createdMembers) . ' member(s) added successfully.',
                'members' => $createdMembers,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Member creation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add members: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a member from an HOA.
     * Requirements: 3.2
     */
    public function destroyMember(int $hoaId, int $memberId)
    {
        $hoa = HOA::findOrFail($hoaId);
        $member = $hoa->members()->where('member_id', $memberId)->firstOrFail();

        try {
            $member->delete();

            return response()->json([
                'success' => true,
                'message' => 'Member removed successfully.',
            ]);

        } catch (\Exception $e) {
            Log::error('Member deletion error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove member: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export members list as CSV (Excel compatible).
     * Requirements: 3.3, 3.4
     */
    public function exportMembers(int $hoaId)
    {
        $hoa = HOA::with(['members' => function ($query) {
            $query->orderBy('name');
        }, 'project'])->findOrFail($hoaId);

        // Build CSV content
        $csv = [];
        
        // Header row
        $csv[] = ['#', 'Member Name', 'Contact Information'];
        
        // Data rows
        $counter = 1;
        foreach ($hoa->members as $member) {
            $csv[] = [
                $counter++,
                $member->name,
                $member->contact_info ?? 'N/A'
            ];
        }
        
        // Convert to CSV string
        $output = fopen('php://temp', 'r+');
        // Add BOM for Excel UTF-8 compatibility
        fwrite($output, "\xEF\xBB\xBF");
        foreach ($csv as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        $filename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $hoa->hoa_name) . '_members.csv';

        return response($csvContent)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Export officers list as CSV (Excel compatible).
     * Requirements: 2.8
     */
    public function exportOfficers(int $hoaId)
    {
        $hoa = HOA::with(['officers', 'project'])->findOrFail($hoaId);

        // Sort officers by position hierarchy
        $sortedOfficers = $hoa->officers->map(function ($officer) {
            $officer->position_rank = $this->getPositionRank($officer->position ?? '');
            return $officer;
        })->sortBy('position_rank')->values();
        
        $hoa->setRelation('officers', $sortedOfficers);

        $now = now()->startOfDay();
        
        // Build CSV content
        $csv = [];
        
        // Header row
        $csv[] = ['#', 'Name', 'Position', 'Phone Number', 'Period Start', 'Period End', 'Status', 'Remarks'];
        
        // Data rows
        $counter = 1;
        foreach ($hoa->officers as $officer) {
            $isActive = $officer->period_start <= $now && $officer->period_end >= $now;
            $statusText = $isActive ? 'Active' : 'Inactive';
            $periodStart = $officer->period_start ? date('M j, Y', strtotime($officer->period_start)) : 'N/A';
            $periodEnd = $officer->period_end ? date('M j, Y', strtotime($officer->period_end)) : 'N/A';
            
            $csv[] = [
                $counter++,
                $officer->name,
                $officer->position ?? 'N/A',
                $officer->phone_number ?? 'N/A',
                $periodStart,
                $periodEnd,
                $statusText,
                $officer->remarks ?? ''
            ];
        }
        
        // Convert to CSV string
        $output = fopen('php://temp', 'r+');
        // Add BOM for Excel UTF-8 compatibility
        fwrite($output, "\xEF\xBB\xBF");
        foreach ($csv as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        $filename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $hoa->hoa_name) . '_officers.csv';

        return response($csvContent)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }


    // ==================== DOCUMENT MANAGEMENT ====================

    /**
     * Store a document for an HOA.
     * Requirements: 4.1, 4.2, 4.3, 4.6
     */
    public function storeDocument(Request $request, int $hoaId)
    {
        $hoa = HOA::findOrFail($hoaId);

        $validated = $request->validate([
            'document' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240', // 10MB max
            'document_name' => 'required|string|max:255',
            'document_type' => 'required|in:elected-officers,constitution-bylaws,articles-incorporation,written-undertaking,certification,authorization,general-info-sheet,masterlist-members,subdivision-plan,registration-license,code-of-ethics,board-resolution,minutes-organizational,filing-fee,other',
        ], [
            'document.required' => 'Please select a document to upload.',
            'document.file' => 'The document must be a valid file.',
            'document.max' => 'The document must not exceed 10MB.',
            'document.mimes' => 'The document must be a PDF, DOC, DOCX, or image file.',
        ]);

        try {
            DB::beginTransaction();

            $file = $request->file('document');
            
            // Use FileStorageService for dual storage
            $result = FileStorageService::store($file, 'hoa_documents', 'doc_');
            
            if (!$result['success']) {
                throw new \Exception($result['error'] ?? 'Failed to upload document.');
            }

            $document = $hoa->documents()->create([
                'document_name' => $validated['document_name'],
                'document_type' => $validated['document_type'],
                'file_path' => $result['path'], // e.g., 'hoa_documents/doc_xxx.pdf'
                'file_size' => $file->getSize(),
                'uploaded_by' => session('admin_id'),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully.',
                'document' => $document->load('uploader'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Document upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download a document.
     * Requirements: 4.4, 4.5
     */
    public function downloadDocument(int $hoaId, int $documentId)
    {
        $hoa = HOA::findOrFail($hoaId);
        $document = $hoa->documents()->where('document_id', $documentId)->firstOrFail();

        // Get the normalized path and check if file exists
        $relativePath = FileStorageService::normalizePath($document->file_path);

        if (!FileStorageService::exists($relativePath)) {
            return response()->json([
                'success' => false,
                'message' => 'Document file not found.',
            ], 404);
        }

        $fullPath = FileStorageService::getFullPath($relativePath);
        $mimeType = FileStorageService::getMimeType($relativePath);

        // Get the original extension from the stored file
        $extension = pathinfo($relativePath, PATHINFO_EXTENSION);
        
        // Construct download filename with original extension
        $downloadName = $document->document_name;
        if (!str_ends_with(strtolower($downloadName), '.' . strtolower($extension))) {
            $downloadName .= '.' . $extension;
        }

        return response()->download($fullPath, $downloadName, [
            'Content-Type' => $mimeType,
        ]);
    }

    /**
     * Delete a document from an HOA.
     * Requirements: 4.5
     */
    public function destroyDocument(int $hoaId, int $documentId)
    {
        $hoa = HOA::findOrFail($hoaId);
        $document = $hoa->documents()->where('document_id', $documentId)->firstOrFail();

        try {
            // Delete file from both storage locations
            FileStorageService::delete($document->file_path);

            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully.',
            ]);

        } catch (\Exception $e) {
            Log::error('Document deletion error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete document: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get document types for dropdown.
     */
    public function getDocumentTypes()
    {
        return response()->json([
            'document_types' => HOADocument::DOCUMENT_TYPES,
        ]);
    }

    /**
     * Get HOA dashboard statistics.
     * Requirements: 8.1, 8.2
     */
    public function getDashboardStats()
    {
        // Total HOAs count
        $totalHoas = HOA::count();

        // Get all officers and calculate active/inactive counts
        $allOfficers = HOAOfficer::all();
        $now = now()->startOfDay();
        
        $activeOfficersCount = $allOfficers->filter(function ($officer) use ($now) {
            return $officer->period_start <= $now && $officer->period_end >= $now;
        })->count();
        
        $inactiveOfficersCount = $allOfficers->count() - $activeOfficersCount;

        return response()->json([
            'success' => true,
            'hoa_stats' => [
                'total_hoas' => $totalHoas,
                'active_officers' => $activeOfficersCount,
                'inactive_officers' => $inactiveOfficersCount,
                'total_officers' => $allOfficers->count(),
            ],
        ]);
    }
}
