<?php

namespace App\Http\Controllers;

use App\Models\MonitoringRecord;
use App\Models\SiteVisit;
use App\Models\Survey;
use App\Models\SiteProj;
use App\Models\HOA;
use App\Services\FileStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Carbon\Carbon;

class MonitoringController extends Controller
{
    // ==================== BENEFICIARY MONITORING ====================

    /**
     * Get beneficiary monitoring status and history.
     * Requirements: 5.1, 5.5
     */
    public function getBeneficiaryMonitoring(int $surveyId)
    {
        try {
            $survey = Survey::findOrFail($surveyId);

            // Get monitoring records in chronological order by visit_date
            $monitoringRecords = MonitoringRecord::where('survey_id', $surveyId)
                ->with(['creator:id,username'])
                ->orderBy('visit_date', 'asc')
                ->get();

            // Get the latest status
            $latestRecord = $monitoringRecords->last();

            return response()->json([
                'success' => true,
                'survey_id' => $surveyId,
                'current_status' => $latestRecord ? $latestRecord->status : null,
                'current_status_label' => $latestRecord 
                    ? MonitoringRecord::STATUS_OPTIONS[$latestRecord->status] ?? $latestRecord->status 
                    : 'No monitoring records',
                'monitoring_history' => $monitoringRecords,
                'status_options' => MonitoringRecord::STATUS_OPTIONS,
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Survey not found for monitoring', [
                'survey_id' => $surveyId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Survey not found.',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Error retrieving beneficiary monitoring', [
                'survey_id' => $surveyId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve monitoring information. Please try again later.',
            ], 500);
        }
    }

    /**
     * Store a new monitoring record for a beneficiary.
     * Requirements: 5.2, 5.3, 5.4
     */
    public function storeMonitoringRecord(Request $request, int $surveyId)
    {
        try {
            $survey = Survey::findOrFail($surveyId);

            // Validate form data including optional file
            $validated = $request->validate([
                'visit_date' => 'required|date',
                'status' => 'required|in:house_constructed,under_construction,vacant,abandoned,other',
                'remarks' => 'nullable|string|max:1000',
                'supporting_documents' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            ]);

            // Get admin ID from session (admin uses session-based auth, not Laravel's auth)
            $adminId = session('admin_id');
            
            if (!$adminId) {
                Log::warning('Unauthorized monitoring record creation attempt', [
                    'survey_id' => $surveyId,
                    'ip' => $request->ip(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access. Please log in to continue.',
                ], 403);
            }

            // Handle document upload if provided using FileStorageService
            $documentsPath = null;
            if ($request->hasFile('supporting_documents')) {
                $result = FileStorageService::store(
                    $request->file('supporting_documents'),
                    'monitoring_documents',
                    'monitoring_'
                );
                
                if (!$result['success']) {
                    // Log error but don't fail the entire request
                    Log::warning('Document upload failed during monitoring record creation', [
                        'survey_id' => $surveyId,
                        'error' => $result['error'],
                    ]);
                    // Continue without document
                    $documentsPath = null;
                } else {
                    $documentsPath = $result['path'];
                }
            }

            DB::beginTransaction();

            $record = MonitoringRecord::create([
                'survey_id' => $surveyId,
                'visit_date' => $validated['visit_date'],
                'status' => $validated['status'],
                'remarks' => $validated['remarks'] ?? null,
                'documents_path' => $documentsPath,
                'created_by' => $adminId,
            ]);

            DB::commit();

            Log::info('Monitoring record created', [
                'record_id' => $record->record_id,
                'survey_id' => $surveyId,
                'user_id' => $adminId,
                'status' => $validated['status'],
                'has_document' => !is_null($documentsPath),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Monitoring record added successfully.',
                'record' => $record->load('creator:id,username'),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::warning('Monitoring record validation failed', [
                'survey_id' => $surveyId,
                'errors' => $e->errors(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid data provided. Please check your input.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            Log::error('Survey not found for monitoring record creation', [
                'survey_id' => $surveyId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Survey not found.',
            ], 404);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Monitoring record creation error', [
                'survey_id' => $surveyId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->except(['supporting_documents']),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create monitoring record: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an existing monitoring record.
     * Requirements: 5.2, 5.3
     */
    public function updateMonitoringRecord(Request $request, int $recordId)
    {
        try {
            $record = MonitoringRecord::findOrFail($recordId);

            $validated = $request->validate([
                'visit_date' => 'sometimes|required|date',
                'status' => 'sometimes|required|in:house_constructed,under_construction,vacant,abandoned,other',
                'remarks' => 'nullable|string|max:1000',
            ]);

            $record->update($validated);

            Log::info('Monitoring record updated', [
                'record_id' => $recordId,
                'user_id' => session('admin_id'),
                'updated_fields' => array_keys($validated),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Monitoring record updated successfully.',
                'record' => $record->fresh()->load('creator:id,username'),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Monitoring record update validation failed', [
                'record_id' => $recordId,
                'errors' => $e->errors(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid data provided. Please check your input.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Monitoring record not found for update', [
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Monitoring record not found.',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Monitoring record update error', [
                'record_id' => $recordId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update monitoring record. Please try again later.',
            ], 500);
        }
    }

    /**
     * Download monitoring record supporting documents.
     * Requirements: 4.3, 4.4, 4.5, 4.6, 4.7
     */
    public function downloadDocuments(int $recordId)
    {
        try {
            $record = MonitoringRecord::findOrFail($recordId);

            if (!$record->documents_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'No documents attached to this monitoring record.',
                ], 404);
            }

            // Verify user permissions (admin only)
            $adminId = session('admin_id');
            if (!$adminId) {
                Log::warning('Unauthorized document download attempt', [
                    'record_id' => $recordId,
                    'ip' => request()->ip(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access. Please log in to continue.',
                ], 403);
            }

            // Get the normalized path and check if file exists
            $relativePath = FileStorageService::normalizePath($record->documents_path);

            if (!FileStorageService::exists($relativePath)) {
                Log::error('Document file not found', [
                    'record_id' => $recordId,
                    'documents_path' => $record->documents_path,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Document file not found.',
                ], 404);
            }

            $fullPath = FileStorageService::getFullPath($relativePath);
            $mimeType = FileStorageService::getMimeType($relativePath);
            
            // Get the original extension from the stored file
            $extension = pathinfo($relativePath, PATHINFO_EXTENSION);
            $filename = 'monitoring_' . $record->record_id . '_documents.' . $extension;

            Log::info('Document downloaded', [
                'record_id' => $recordId,
                'user_id' => $adminId,
                'filename' => $filename,
            ]);

            return response()->download($fullPath, $filename, [
                'Content-Type' => $mimeType,
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Monitoring record not found for document download', [
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Monitoring record not found.',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Document download error', [
                'record_id' => $recordId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to download document. Please try again later.',
            ], 500);
        }
    }


    // ==================== SITE VISITS ====================

    /**
     * Get site visits with filters.
     * Requirements: 6.3, 6.4
     */
    public function getSiteVisits(Request $request)
    {
        try {
            $query = SiteVisit::with(['project:project_id,project_name', 'hoa:hoa_id,hoa_name']);

            // Filter by project
            if ($request->filled('project_id')) {
                $query->where('project_id', $request->project_id);
            }

            // Filter by HOA
            if ($request->filled('hoa_id')) {
                $query->where('hoa_id', $request->hoa_id);
            }

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Filter by date range
            if ($request->filled('date_from')) {
                $query->where('scheduled_date', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->where('scheduled_date', '<=', $request->date_to);
            }

            // Filter for upcoming visits (scheduled and not completed)
            if ($request->boolean('upcoming')) {
                $query->where('status', SiteVisit::STATUS_SCHEDULED)
                      ->where('scheduled_date', '>=', now()->startOfDay());
            }

            $perPage = $request->get('per_page', 15);
            $visits = $query->orderBy('scheduled_date', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'site_visits' => $visits,
                'status_options' => SiteVisit::STATUS_OPTIONS,
            ]);

        } catch (\Exception $e) {
            Log::error('Error retrieving site visits', [
                'filters' => $request->only(['project_id', 'hoa_id', 'status', 'date_from', 'date_to', 'upcoming']),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve site visits. Please try again later.',
            ], 500);
        }
    }

    /**
     * Schedule a new site visit.
     * Requirements: 6.1
     */
    public function scheduleSiteVisit(Request $request)
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required_without:hoa_id|nullable|exists:siteproj,project_id',
                'hoa_id' => 'required_without:project_id|nullable|exists:hoa,hoa_id',
                'scheduled_date' => 'required|date|after_or_equal:today',
                'assigned_staff' => 'required|string|max:255',
                'visit_notes' => 'nullable|string|max:1000',
            ], [
                'project_id.required_without' => 'Either a project site or HOA must be selected.',
                'hoa_id.required_without' => 'Either a project site or HOA must be selected.',
            ]);

            $visit = SiteVisit::create([
                'project_id' => $validated['project_id'] ?? null,
                'hoa_id' => $validated['hoa_id'] ?? null,
                'scheduled_date' => $validated['scheduled_date'],
                'assigned_staff' => $validated['assigned_staff'],
                'status' => SiteVisit::STATUS_SCHEDULED,
                'visit_notes' => $validated['visit_notes'] ?? null,
            ]);

            Log::info('Site visit scheduled', [
                'visit_id' => $visit->id,
                'project_id' => $validated['project_id'] ?? null,
                'hoa_id' => $validated['hoa_id'] ?? null,
                'scheduled_date' => $validated['scheduled_date'],
                'user_id' => session('admin_id'),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Site visit scheduled successfully.',
                'visit' => $visit->load(['project:project_id,project_name', 'hoa:hoa_id,hoa_name']),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Site visit scheduling validation failed', [
                'errors' => $e->errors(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid data provided. Please check your input.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Site visit scheduling error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to schedule site visit. Please try again later.',
            ], 500);
        }
    }

    /**
     * Complete a site visit with notes and findings.
     * Requirements: 6.2
     */
    public function completeSiteVisit(Request $request, int $visitId)
    {
        try {
            $visit = SiteVisit::findOrFail($visitId);

            if ($visit->status === SiteVisit::STATUS_COMPLETED) {
                return response()->json([
                    'success' => false,
                    'message' => 'This site visit has already been completed.',
                ], 422);
            }

            $validated = $request->validate([
                'visit_notes' => 'nullable|string|max:1000',
                'findings' => 'nullable|string|max:2000',
            ]);

            $visit->update([
                'status' => SiteVisit::STATUS_COMPLETED,
                'visit_notes' => $validated['visit_notes'] ?? $visit->visit_notes,
                'findings' => $validated['findings'] ?? null,
                'completed_at' => now(),
            ]);

            Log::info('Site visit completed', [
                'visit_id' => $visitId,
                'user_id' => session('admin_id'),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Site visit completed successfully.',
                'visit' => $visit->fresh()->load(['project:project_id,project_name', 'hoa:hoa_id,hoa_name']),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Site visit completion validation failed', [
                'visit_id' => $visitId,
                'errors' => $e->errors(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid data provided. Please check your input.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Site visit not found for completion', [
                'visit_id' => $visitId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Site visit not found.',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Site visit completion error', [
                'visit_id' => $visitId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete site visit. Please try again later.',
            ], 500);
        }
    }

    /**
     * Get project sites and HOAs that are due for monthly visits.
     * Requirements: 6.5
     */
    public function getDueVisits()
    {
        try {
            $currentMonth = now()->month;
            $currentYear = now()->year;
            $startOfMonth = now()->startOfMonth();
            $endOfMonth = now()->endOfMonth();

            // Get all project sites
            $projects = SiteProj::select('project_id', 'project_name')->get();

            // Get all active HOAs
            $hoas = HOA::select('hoa_id', 'hoa_name', 'project_id')
                ->where('status', 'active')
                ->with('project:project_id,project_name')
                ->get();

            // Get completed visits this month for projects
            $projectVisitsThisMonth = SiteVisit::whereNotNull('project_id')
                ->where('status', SiteVisit::STATUS_COMPLETED)
                ->whereBetween('completed_at', [$startOfMonth, $endOfMonth])
                ->pluck('project_id')
                ->unique()
                ->toArray();

            // Get completed visits this month for HOAs
            $hoaVisitsThisMonth = SiteVisit::whereNotNull('hoa_id')
                ->where('status', SiteVisit::STATUS_COMPLETED)
                ->whereBetween('completed_at', [$startOfMonth, $endOfMonth])
                ->pluck('hoa_id')
                ->unique()
                ->toArray();

            // Identify projects needing attention (no completed visit this month)
            $projectsDue = $projects->filter(function ($project) use ($projectVisitsThisMonth) {
                return !in_array($project->project_id, $projectVisitsThisMonth);
            })->values();

            // Identify HOAs needing attention (no completed visit this month)
            $hoasDue = $hoas->filter(function ($hoa) use ($hoaVisitsThisMonth) {
                return !in_array($hoa->hoa_id, $hoaVisitsThisMonth);
            })->values();

            return response()->json([
                'success' => true,
                'current_month' => now()->format('F Y'),
                'projects_due' => $projectsDue,
                'projects_due_count' => $projectsDue->count(),
                'hoas_due' => $hoasDue,
                'hoas_due_count' => $hoasDue->count(),
                'total_due' => $projectsDue->count() + $hoasDue->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('Error calculating due visits', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate due visits. Please try again later.',
            ], 500);
        }
    }

    /**
     * Cancel a scheduled site visit.
     */
    public function cancelSiteVisit(int $visitId)
    {
        try {
            $visit = SiteVisit::findOrFail($visitId);

            if ($visit->status !== SiteVisit::STATUS_SCHEDULED) {
                Log::warning('Attempt to cancel non-scheduled visit', [
                    'visit_id' => $visitId,
                    'current_status' => $visit->status,
                    'user_id' => session('admin_id'),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Only scheduled visits can be cancelled.',
                ], 422);
            }

            $visit->update([
                'status' => SiteVisit::STATUS_CANCELLED,
            ]);

            Log::info('Site visit cancelled', [
                'visit_id' => $visitId,
                'user_id' => session('admin_id'),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Site visit cancelled successfully.',
                'visit' => $visit->fresh(),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Site visit not found for cancellation', [
                'visit_id' => $visitId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Site visit not found.',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Site visit cancellation error', [
                'visit_id' => $visitId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel site visit. Please try again later.',
            ], 500);
        }
    }

    /**
     * Get monitoring dashboard statistics.
     * Requirements: 8.3
     */
    public function getDashboardStats()
    {
        try {
            $startOfMonth = now()->startOfMonth();
            $endOfMonth = now()->endOfMonth();

            // Upcoming site visits this month (scheduled, not completed)
            $upcomingVisitsThisMonth = SiteVisit::where('status', SiteVisit::STATUS_SCHEDULED)
                ->whereBetween('scheduled_date', [$startOfMonth, $endOfMonth])
                ->count();

            // Get due visits data
            $dueVisitsData = $this->calculateDueVisits();

            return response()->json([
                'success' => true,
                'monitoring_stats' => [
                    'upcoming_visits_this_month' => $upcomingVisitsThisMonth,
                    'due_visits_count' => $dueVisitsData['total_due'],
                    'projects_due_count' => $dueVisitsData['projects_due_count'],
                    'hoas_due_count' => $dueVisitsData['hoas_due_count'],
                    'current_month' => now()->format('F Y'),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error retrieving dashboard statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve dashboard statistics. Please try again later.',
            ], 500);
        }
    }

    /**
     * Calculate due visits for dashboard.
     */
    private function calculateDueVisits(): array
    {
        try {
            $startOfMonth = now()->startOfMonth();
            $endOfMonth = now()->endOfMonth();

            // Get all project sites
            $projectsCount = SiteProj::count();

            // Get all active HOAs
            $hoasCount = HOA::where('status', 'active')->count();

            // Get completed visits this month for projects
            $projectVisitsThisMonth = SiteVisit::whereNotNull('project_id')
                ->where('status', SiteVisit::STATUS_COMPLETED)
                ->whereBetween('completed_at', [$startOfMonth, $endOfMonth])
                ->distinct('project_id')
                ->count('project_id');

            // Get completed visits this month for HOAs
            $hoaVisitsThisMonth = SiteVisit::whereNotNull('hoa_id')
                ->where('status', SiteVisit::STATUS_COMPLETED)
                ->whereBetween('completed_at', [$startOfMonth, $endOfMonth])
                ->distinct('hoa_id')
                ->count('hoa_id');

            $projectsDueCount = max(0, $projectsCount - $projectVisitsThisMonth);
            $hoasDueCount = max(0, $hoasCount - $hoaVisitsThisMonth);

            return [
                'projects_due_count' => $projectsDueCount,
                'hoas_due_count' => $hoasDueCount,
                'total_due' => $projectsDueCount + $hoasDueCount,
            ];

        } catch (\Exception $e) {
            Log::error('Error calculating due visits', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return default values on error
            return [
                'projects_due_count' => 0,
                'hoas_due_count' => 0,
                'total_due' => 0,
            ];
        }
    }
}
