<?php

namespace App\Http\Controllers;

use App\Models\Revocation;
use App\Models\Survey;
use App\Models\SiteProj;
use App\Services\FileStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class RevocationController extends Controller
{
    /**
     * Display a listing of revocations with filters.
     * Requirements: 7.5
     */
    public function index(Request $request)
    {
        $query = Revocation::with([
            'survey.demographic',
            'project:project_id,project_name',
            'revokedBy:id,username',
        ]);

        // Filter by project
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('revoked_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('revoked_at', '<=', $request->date_to . ' 23:59:59');
        }

        // Filter by violation reason (check if any of the selected reasons are in the JSON array)
        if ($request->filled('violation_reason')) {
            $query->whereJsonContains('violation_reasons', $request->violation_reason);
        }

        // Search by lot info, remarks, beneficiary name, or barangay
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('lot_info', 'like', '%' . $search . '%')
                  ->orWhere('remarks', 'like', '%' . $search . '%')
                  ->orWhereHas('survey.demographic', function ($dq) use ($search) {
                      $dq->where('first_name', 'like', '%' . $search . '%')
                         ->orWhere('last_name', 'like', '%' . $search . '%')
                         ->orWhere('barangay', 'like', '%' . $search . '%')
                         ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ['%' . $search . '%']);
                  });
            });
        }

        $perPage = $request->get('per_page', 15);
        $revocations = $query->orderBy('revoked_at', 'desc')->paginate($perPage);

        // Get projects for filter dropdown
        $projects = SiteProj::select('project_id', 'project_name')->orderBy('project_name')->get();

        return response()->json([
            'success' => true,
            'revocations' => $revocations,
            'projects' => $projects,
            'violation_reasons' => Revocation::VIOLATION_REASONS,
        ]);
    }

    /**
     * Store a newly created revocation.
     * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'survey_id' => 'required|exists:survey,survey_id',
            'project_id' => 'nullable|exists:siteproj,project_id',
            'lot_info' => 'nullable|string|max:255',
            'violation_reasons' => 'required|array|min:1',
            'violation_reasons.*' => 'required|string|in:' . implode(',', array_keys(Revocation::VIOLATION_REASONS)),
            'remarks' => 'nullable|string|max:2000',
            'documentation' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240', // 10MB max
        ], [
            'violation_reasons.required' => 'At least one violation reason must be selected.',
            'violation_reasons.min' => 'At least one violation reason must be selected.',
            'violation_reasons.*.in' => 'Invalid violation reason selected.',
        ]);

        try {
            DB::beginTransaction();

            // Handle documentation upload if provided using FileStorageService
            $documentationPath = null;
            if ($request->hasFile('documentation')) {
                $result = FileStorageService::store(
                    $request->file('documentation'),
                    'revocation_documents',
                    'revocation_'
                );
                
                if (!$result['success']) {
                    throw new \Exception($result['error'] ?? 'Failed to upload documentation.');
                }
                
                $documentationPath = $result['path']; // e.g., 'revocation_documents/revocation_xxx.pdf'
            }

            // Get admin ID from session (admin uses session-based auth, not Laravel's auth)
            $adminId = session('admin_id');

            // Create the revocation record
            $revocation = Revocation::create([
                'survey_id' => $validated['survey_id'],
                'project_id' => $validated['project_id'] ?? null,
                'lot_info' => $validated['lot_info'] ?? null,
                'violation_reasons' => $validated['violation_reasons'],
                'remarks' => $validated['remarks'] ?? null,
                'documentation_path' => $documentationPath,
                'revoked_by' => $adminId,
                'revoked_at' => now(),
            ]);

            // Update beneficiary/survey status to reflect revocation
            // Requirements: 7.4
            $this->updateBeneficiaryStatus($validated['survey_id']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Revocation recorded successfully.',
                'revocation' => $revocation->load(['survey', 'project', 'revokedBy:id,username']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Revocation creation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to record revocation: ' . $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Display the specified revocation with full details.
     * Requirements: 7.5
     */
    public function show(int $id)
    {
        $revocation = Revocation::with([
            'survey.demographic',
            'project:project_id,project_name',
            'revokedBy:id,username',
        ])->findOrFail($id);

        // Map violation reason codes to their descriptions
        $violationDetails = [];
        foreach ($revocation->violation_reasons as $code) {
            $violationDetails[] = [
                'code' => $code,
                'description' => Revocation::VIOLATION_REASONS[$code] ?? 'Unknown violation',
            ];
        }

        return response()->json([
            'success' => true,
            'revocation' => $revocation,
            'violation_details' => $violationDetails,
        ]);
    }

    /**
     * Get the list of predefined violation reasons.
     * Requirements: 7.2
     */
    public function getViolationReasons()
    {
        return response()->json([
            'success' => true,
            'violation_reasons' => Revocation::VIOLATION_REASONS,
        ]);
    }

    /**
     * Update beneficiary/survey status when revoked.
     * Requirements: 7.4, 7.6
     * 
     * Status values:
     * - is_submitted = 0 → Draft
     * - is_submitted = 1 → Validated
     * - is_submitted = 2 → Approved/Pending Assignment
     * - is_submitted = 3 → Assigned
     * - is_submitted = 4 → Revoked
     * 
     * @param int $surveyId
     * @return void
     */
    private function updateBeneficiaryStatus(int $surveyId): void
    {
        $survey = Survey::find($surveyId);
        
        if ($survey) {
            // Update the survey status to revoked (is_submitted = 4)
            // This keeps the record visible for audit purposes but marks it as revoked
            $survey->is_submitted = 4;
            $survey->save();
            
            // Free up the lot by deleting the assignment record
            // This makes the lot available for reassignment
            $deletedAssignments = DB::table('assignments')
                ->where('survey_id', $surveyId)
                ->delete();
            
            Log::info('Beneficiary status updated due to revocation', [
                'survey_id' => $surveyId,
                'new_status' => 4,
                'assignments_deleted' => $deletedAssignments,
                'revoked_by' => session('admin_id'),
                'revoked_at' => now()->toDateTimeString(),
            ]);
        }
    }

    /**
     * Get revocation statistics for dashboard.
     * Requirements: 8.4
     */
    public function getStatistics()
    {
        $totalRevocations = Revocation::count();
        
        // Recent revocations (last 30 days)
        $recentRevocations = Revocation::where('revoked_at', '>=', now()->subDays(30))->count();
        
        // This month's revocations
        $thisMonthRevocations = Revocation::whereMonth('revoked_at', now()->month)
            ->whereYear('revoked_at', now()->year)
            ->count();

        // Revocations by violation reason
        $byViolationReason = [];
        foreach (Revocation::VIOLATION_REASONS as $code => $description) {
            $count = Revocation::whereJsonContains('violation_reasons', $code)->count();
            if ($count > 0) {
                $byViolationReason[$code] = [
                    'description' => $description,
                    'count' => $count,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'statistics' => [
                'total' => $totalRevocations,
                'recent' => $recentRevocations,
                'this_month' => $thisMonthRevocations,
                'by_violation_reason' => $byViolationReason,
            ],
        ]);
    }

    /**
     * Download revocation documentation.
     */
    public function downloadDocumentation(int $id)
    {
        $revocation = Revocation::findOrFail($id);

        if (!$revocation->documentation_path) {
            return response()->json([
                'success' => false,
                'message' => 'No documentation attached to this revocation.',
            ], 404);
        }

        // Get the normalized path and check if file exists
        $relativePath = FileStorageService::normalizePath($revocation->documentation_path);

        if (!FileStorageService::exists($relativePath)) {
            return response()->json([
                'success' => false,
                'message' => 'Documentation file not found.',
            ], 404);
        }

        $fullPath = FileStorageService::getFullPath($relativePath);
        $mimeType = FileStorageService::getMimeType($relativePath);
        
        // Get the original extension from the stored file
        $extension = pathinfo($relativePath, PATHINFO_EXTENSION);
        $filename = 'revocation_' . $revocation->revocation_id . '_documentation.' . $extension;

        return response()->download($fullPath, $filename, [
            'Content-Type' => $mimeType,
        ]);
    }
}
