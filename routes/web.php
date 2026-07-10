<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ValidatorDashboardController;
use App\Http\Controllers\ValidatorPasswordController;
use App\Http\Controllers\HOAController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\RevocationController;

/*
|--------------------------------------------------------------------------
| CLEAN WEB ROUTES FOR CHODAMS
|--------------------------------------------------------------------------
*/

// Landing Page
Route::get('/', function () {
    return Inertia::render('Landing');
});

// Login Page (React)
Route::get('/login', [LoginController::class, 'showLogin'])->name('login');
Route::post('/login', [LoginController::class, 'login']);

Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store']);

    Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');

    Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [NewPasswordController::class, 'store'])->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('/verify-email', EmailVerificationPromptController::class)->name('verification.notice');

    Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('/confirm-password', [ConfirmablePasswordController::class, 'show'])->name('password.confirm');
    Route::post('/confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('/password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('/logout', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin Dashboard (React)
Route::middleware('role:admin')->group(function () {
    Route::get('/admin/dashboard', function () {
        return Inertia::render('AdminDashboard');
    });

    Route::get('/admin/mapping', function () {
        return Inertia::render('AdminMapping');
    });
    Route::get('/admin/mapping', function () {
        return Inertia::render('AdminMapping');
    });

    Route::get('/admin/beneficiaries', function () {
        return Inertia::render('AdminBeneficiaries');
    });

    Route::get('/admin/project-sites', function () {
        return Inertia::render('AdminProjectSites');
    });
    Route::get('/admin/project-sites/add', function () {
        return Inertia::render('AdminProjectAdd');
    });

    Route::get('/admin/assignments', function () {
        return Inertia::render('AdminAssignments');
    });

    Route::get('/admin/profile', function () {
        return Inertia::render('AdminProfile');
    });
    Route::get('/admin/profile/edit', function () {
        return Inertia::render('EditAdminProfile');
    });
    Route::get('/admin/validators/create', function () {
        return Inertia::render('ValidatorSignup');
    });

    Route::get('/admin/beneficiaries/{survey_id}', function ($survey_id) {
        return Inertia::render('SurveyDetails', ['survey_id' => $survey_id, 'api_base' => '/admin/api']);
    });

    // HOA Management page
    Route::get('/admin/hoa', function () {
        return Inertia::render('AdminHOA');
    });

    // Monitoring page
    Route::get('/admin/monitoring', function () {
        return Inertia::render('AdminMonitoring');
    });

    // Revocations page
    Route::get('/admin/revocations', function () {
        return Inertia::render('AdminRevocations');
    });

    Route::post('/admin/logout', [LoginController::class, 'logout']);
});

// Admin API Routes
Route::prefix('admin/api')->middleware('role:admin')->group(function () {
    Route::get('/totals', [ValidatorDashboardController::class, 'adminTotals']);
    Route::get('/barangay', [ValidatorDashboardController::class, 'adminBarangay']);
    Route::get('/classification', [ValidatorDashboardController::class, 'adminClassification']);
    Route::get('/subclass-displaced', [ValidatorDashboardController::class, 'adminSubclassDisplaced']);
    Route::get('/subclass-doubleup', [ValidatorDashboardController::class, 'adminSubclassDoubleUp']);
    Route::get('/subclass-homeless', [ValidatorDashboardController::class, 'adminSubclassHomeless']);
    Route::get('/indicators', [ValidatorDashboardController::class, 'adminIndicators']);
    Route::get('/timeseries', [ValidatorDashboardController::class, 'adminTimeSeries']);
    Route::get('/data-quality', [ValidatorDashboardController::class, 'adminDataQuality']);
    Route::get('/crosstab/income-classification', [ValidatorDashboardController::class, 'adminCrosstabIncomeClassification']);
    Route::get('/crosstab/classification-barangay', [ValidatorDashboardController::class, 'adminCrosstabClassificationBarangay']);
    Route::get('/beneficiaries/validated', [ValidatorDashboardController::class, 'adminBeneficiariesValidated']);
    Route::get('/beneficiaries/approved', [ValidatorDashboardController::class, 'adminBeneficiariesApproved']);
    Route::get('/beneficiaries/assigned', [ValidatorDashboardController::class, 'adminBeneficiariesAssigned']);
    Route::get('/beneficiaries/affiliated', [ValidatorDashboardController::class, 'adminBeneficiariesAffiliated']);
    Route::get('/beneficiaries/affiliated/export', [ValidatorDashboardController::class, 'adminExportAffiliatedCsv']);
    Route::get('/beneficiaries/mayor-endorsed', [ValidatorDashboardController::class, 'adminBeneficiariesMayorEndorsed']);
    Route::get('/beneficiaries/validated/export', [ValidatorDashboardController::class, 'adminExportValidatedCsv']);
    Route::get('/beneficiaries/mayor-endorsed/export', [ValidatorDashboardController::class, 'adminExportMayorCsv']);
    Route::post('/beneficiaries/{surveyId}/revalidate', [ValidatorDashboardController::class, 'adminRevalidateSurvey']);
    Route::post('/beneficiaries/{surveyId}/disapprove', [ValidatorDashboardController::class, 'adminDisapproveSurvey']);

    Route::get('/profile', [ValidatorDashboardController::class, 'adminProfile']);
    Route::post('/profile', [ValidatorDashboardController::class, 'adminProfileUpdate']);

    Route::get('/validators', [ValidatorDashboardController::class, 'adminValidators']);
    Route::post('/validators', [ValidatorDashboardController::class, 'adminValidatorCreate'])->middleware('throttle:6,1');
    Route::post('/validators/{validator_id}/status', [ValidatorDashboardController::class, 'adminValidatorUpdateStatus']);

    Route::get('/survey/{survey_id}', [ValidatorDashboardController::class, 'adminSurveyDetails']);
    Route::get('/survey/{survey_id}/export', [ValidatorDashboardController::class, 'adminExportSurveyCsv']);
    Route::get('/export/barangay', [ValidatorDashboardController::class, 'adminExportBarangayCsv']);
    Route::get('/survey/{survey_id}/photo', [ValidatorDashboardController::class, 'adminSurveyPhoto']);
    Route::get('/survey/{survey_id}/person-photo', [ValidatorDashboardController::class, 'adminSurveyPersonPhoto']);
    Route::get('/map-points', [ValidatorDashboardController::class, 'adminMapPoints']);
    Route::post('/surveys/restore-deleted-all', [ValidatorDashboardController::class, 'adminRestoreAllDeletedSurveys']);
    Route::post('/approve', [ValidatorDashboardController::class, 'adminApproveSurvey']);
    Route::get('/db-info', [ValidatorDashboardController::class, 'adminDbInfo']);
    
    // Recalculate beneficiary scores
    Route::get('/recalculate-scores', function () {
        try {
            $service = new \App\Services\BeneficiaryScoreService();
            $count = $service->recalculateAll();
            return response()->json([
                'success' => true,
                'message' => "Successfully recalculated scores for {$count} beneficiaries.",
                'count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to recalculate scores: ' . $e->getMessage()
            ], 500);
        }
    });

    Route::get('/notifications', [ValidatorDashboardController::class, 'adminNotifications']);
    Route::post('/notifications/read', [ValidatorDashboardController::class, 'adminNotificationRead']);

    Route::get('/project-sites', [ValidatorDashboardController::class, 'adminProjectSitesList']);
    Route::post('/project-sites', [ValidatorDashboardController::class, 'adminProjectSitesCreate']);
    Route::put('/project-sites/{project_id}', [ValidatorDashboardController::class, 'adminProjectSitesUpdate']);
    Route::delete('/project-sites/{project_id}', [ValidatorDashboardController::class, 'adminProjectSitesDelete']);
    Route::post('/project-sites/{project_id}/boundary', [ValidatorDashboardController::class, 'adminProjectBoundarySave']);
    Route::get('/project-sites/{project_id}/blocks', [ValidatorDashboardController::class, 'adminProjectBlocks']);
    Route::get('/project-sites/{project_id}/blocks/{block_no}/available-lots', [ValidatorDashboardController::class, 'adminProjectBlockAvailableLots']);

    Route::get('/assignments', [ValidatorDashboardController::class, 'adminAssignmentsList']);
    Route::get('/assignments/pending', [ValidatorDashboardController::class, 'adminAssignmentsPending']);
    Route::post('/assignments', [ValidatorDashboardController::class, 'adminAssignmentsCreate']);

    // ==================== HOA MANAGEMENT ROUTES ====================
    // Requirements: 1.1-4.7
    
    // HOA CRUD routes
    Route::get('/hoas', [HOAController::class, 'index']);
    Route::post('/hoas', [HOAController::class, 'store']);
    Route::get('/hoas/{id}', [HOAController::class, 'show']);
    Route::post('/hoas/{id}', [HOAController::class, 'update']); // POST for file upload support
    Route::delete('/hoas/{id}', [HOAController::class, 'destroy']);
    
    // HOA Dashboard stats
    Route::get('/hoa-dashboard-stats', [HOAController::class, 'getDashboardStats']);
    
    // HOA Officers nested routes
    Route::post('/hoas/{hoaId}/officers', [HOAController::class, 'storeOfficer']);
    Route::put('/hoas/{hoaId}/officers/{officerId}', [HOAController::class, 'updateOfficer']);
    Route::delete('/hoas/{hoaId}/officers/{officerId}', [HOAController::class, 'destroyOfficer']);
    Route::get('/hoas/{hoaId}/officers/export', [HOAController::class, 'exportOfficers']);
    
    // HOA Members nested routes
    Route::post('/hoas/{hoaId}/members', [HOAController::class, 'storeMembers']);
    Route::delete('/hoas/{hoaId}/members/{memberId}', [HOAController::class, 'destroyMember']);
    Route::get('/hoas/{hoaId}/members/export', [HOAController::class, 'exportMembers']);
    
    // HOA Documents nested routes
    Route::post('/hoas/{hoaId}/documents', [HOAController::class, 'storeDocument']);
    Route::get('/hoas/{hoaId}/documents/{documentId}/download', [HOAController::class, 'downloadDocument']);
    Route::delete('/hoas/{hoaId}/documents/{documentId}', [HOAController::class, 'destroyDocument']);
    Route::get('/hoa-document-types', [HOAController::class, 'getDocumentTypes']);

    // ==================== MONITORING ROUTES ====================
    // Requirements: 5.1-6.5
    
    // Beneficiary Monitoring routes
    Route::get('/beneficiaries/{surveyId}/monitoring', [MonitoringController::class, 'getBeneficiaryMonitoring']);
    Route::post('/beneficiaries/{surveyId}/monitoring', [MonitoringController::class, 'storeMonitoringRecord']);
    Route::put('/monitoring-records/{recordId}', [MonitoringController::class, 'updateMonitoringRecord']);
    Route::get('/monitoring/{recordId}/documents/download', [MonitoringController::class, 'downloadDocuments']);
    
    // Site Visit routes
    Route::get('/site-visits', [MonitoringController::class, 'getSiteVisits']);
    Route::post('/site-visits', [MonitoringController::class, 'scheduleSiteVisit']);
    Route::put('/site-visits/{visitId}/complete', [MonitoringController::class, 'completeSiteVisit']);
    Route::put('/site-visits/{visitId}/cancel', [MonitoringController::class, 'cancelSiteVisit']);
    Route::get('/site-visits/due', [MonitoringController::class, 'getDueVisits']);
    
    // Monitoring Dashboard stats
    Route::get('/monitoring-dashboard-stats', [MonitoringController::class, 'getDashboardStats']);

    // ==================== REVOCATION ROUTES ====================
    // Requirements: 7.1-7.6
    
    // Revocation CRUD routes
    Route::get('/revocations', [RevocationController::class, 'index']);
    Route::post('/revocations', [RevocationController::class, 'store']);
    Route::get('/revocations/{id}', [RevocationController::class, 'show']);
    Route::get('/revocations/{id}/documentation', [RevocationController::class, 'downloadDocumentation']);
    Route::get('/revocation-reasons', [RevocationController::class, 'getViolationReasons']);
    Route::get('/revocation-statistics', [RevocationController::class, 'getStatistics']);
});

Route::middleware('role:validator')->group(function () {
    Route::post('/validator/logout', [LoginController::class, 'logout']);
    Route::get('/validator/dashboard', function () {
        return Inertia::render('ValidatorDashboard');
    });
    Route::get('/validator/survey-form', function () {
        return Inertia::render('SurveyForm', [
            'validator_name' => session('name'),
        ]);
    });
    Route::get('/validator/survey/{survey_id}', function ($survey_id) {
        return Inertia::render('SurveyDetails', ['survey_id' => $survey_id]);
    });
    Route::get('/validator/profile', function () {
        return Inertia::render('ValidatorProfile');
    });
});

// Validator API Routes
Route::prefix('validator/api')->middleware('role:validator')->group(function () {
    Route::get('/totals', [ValidatorDashboardController::class, 'totals']);
    Route::get('/surveys', [ValidatorDashboardController::class, 'surveys']);
    Route::get('/surveys/ids', [ValidatorDashboardController::class, 'getAllSurveyIds']);
    Route::get('/submitted', [ValidatorDashboardController::class, 'submitted']);
    Route::get('/deleted', [ValidatorDashboardController::class, 'deleted']);
    Route::get('/survey/{survey_id}', [ValidatorDashboardController::class, 'surveyDetails']);
    Route::get('/survey/{survey_id}/export', [ValidatorDashboardController::class, 'exportSurveyCsv']);
    Route::get('/survey/{survey_id}/photo', [ValidatorDashboardController::class, 'surveyPhoto']);
    Route::get('/survey/{survey_id}/person-photo', [ValidatorDashboardController::class, 'surveyPersonPhoto']);
    Route::get('/export/barangay', [ValidatorDashboardController::class, 'validatorExportBarangayCsv']);
    Route::get('/profile', [ValidatorDashboardController::class, 'profile']);
    Route::post('/profile/password', [ValidatorDashboardController::class, 'updatePassword']);
    Route::post('/profile/email', [ValidatorDashboardController::class, 'updateEmail']);
    Route::get('/tag-number/preview', [ValidatorDashboardController::class, 'previewTagNumber']);
    Route::post('/survey', [ValidatorDashboardController::class, 'createSurvey']);
    Route::post('/submit', [ValidatorDashboardController::class, 'submitSurvey']);
    Route::post('/submit-batch', [ValidatorDashboardController::class, 'submitSurveysBatch']);
    Route::put('/survey/{survey_id}', [ValidatorDashboardController::class, 'updateSurvey']);
    Route::delete('/survey/{survey_id}', [ValidatorDashboardController::class, 'deleteSurvey']);
    Route::post('/survey/{survey_id}/restore', [ValidatorDashboardController::class, 'restoreSurvey']);
});

Route::get('/validator/reset-password', [ValidatorPasswordController::class, 'showResetForm']);
Route::post('/validator/reset-password', [ValidatorPasswordController::class, 'submitResetForm']);
Route::post('/validator/forgot-password', [ValidatorPasswordController::class, 'sendResetLink']);

// Mobile App API (backward-compatible paths for existing Flutter app)
Route::get('/sync_validators_api.php', [ValidatorDashboardController::class, 'mobileSyncValidators']);
Route::post('/submit_survey_api.php', [ValidatorDashboardController::class, 'mobileSubmitSurvey']);
Route::post('/validate_validator_api.php', [ValidatorDashboardController::class, 'mobileValidateValidator']);
Route::get('/test_api_connection.php', [ValidatorDashboardController::class, 'mobilePing']);

// Alternative prefix to match legacy serverUrl '/Chodams/survey'
Route::prefix('Chodams/survey')->group(function () {
    Route::get('/sync_validators_api.php', [ValidatorDashboardController::class, 'mobileSyncValidators']);
    Route::post('/submit_survey_api.php', [ValidatorDashboardController::class, 'mobileSubmitSurvey']);
    Route::post('/validate_validator_api.php', [ValidatorDashboardController::class, 'mobileValidateValidator']);
    Route::get('/test_api_connection.php', [ValidatorDashboardController::class, 'mobilePing']);
});

Route::fallback(function () {
    return Inertia::render('Landing');
});