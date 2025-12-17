<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ValidatorDashboardController;
use App\Http\Controllers\ValidatorPasswordController;

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

Route::middleware('role:admin')->group(function () {
    Route::get('/admin/dashboard', function () {
        return Inertia::render('AdminDashboard');
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
    Route::get('/admin/about', function () {
        return Inertia::render('AdminAbout');
    });
    Route::get('/admin/beneficiaries/{survey_id}', function ($survey_id) {
        return Inertia::render('SurveyDetails', ['survey_id' => $survey_id, 'api_base' => '/admin/api']);
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
    Route::get('/crosstab/income-classification', [ValidatorDashboardController::class, 'adminCrosstabIncomeClassification']);
    Route::get('/crosstab/classification-barangay', [ValidatorDashboardController::class, 'adminCrosstabClassificationBarangay']);
    Route::get('/beneficiaries/validated', [ValidatorDashboardController::class, 'adminBeneficiariesValidated']);
    Route::get('/beneficiaries/approved', [ValidatorDashboardController::class, 'adminBeneficiariesApproved']);
    Route::get('/beneficiaries/affiliated', [ValidatorDashboardController::class, 'adminBeneficiariesAffiliated']);
    Route::get('/beneficiaries/affiliated/export', [ValidatorDashboardController::class, 'adminExportAffiliatedCsv']);
    Route::get('/beneficiaries/mayor-endorsed', [ValidatorDashboardController::class, 'adminBeneficiariesMayorEndorsed']);
    Route::get('/beneficiaries/validated/export', [ValidatorDashboardController::class, 'adminExportValidatedCsv']);
    Route::get('/beneficiaries/mayor-endorsed/export', [ValidatorDashboardController::class, 'adminExportMayorCsv']);

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
    Route::post('/approve', [ValidatorDashboardController::class, 'adminApproveSurvey']);
    Route::get('/db-info', [ValidatorDashboardController::class, 'adminDbInfo']);

    Route::get('/notifications', [ValidatorDashboardController::class, 'adminNotifications']);
    Route::post('/notifications/read', [ValidatorDashboardController::class, 'adminNotificationRead']);

    // Project Sites API
    Route::get('/project-sites', [ValidatorDashboardController::class, 'adminProjectSitesList']);
    Route::post('/project-sites', [ValidatorDashboardController::class, 'adminProjectSitesCreate']);
    Route::put('/project-sites/{project_id}', [ValidatorDashboardController::class, 'adminProjectSitesUpdate']);
    Route::post('/project-sites/{project_id}', [ValidatorDashboardController::class, 'adminProjectSitesUpdate']);
    Route::delete('/project-sites/{project_id}', [ValidatorDashboardController::class, 'adminProjectSitesDelete']);
    Route::post('/project-sites/{project_id}/boundary', [ValidatorDashboardController::class, 'adminProjectBoundarySave']);
    Route::get('/project-sites/{project_id}/blocks', [ValidatorDashboardController::class, 'adminProjectBlocks']);
    Route::get('/project-sites/{project_id}/blocks/{block_no}/available-lots', [ValidatorDashboardController::class, 'adminProjectBlockAvailableLots']);

    // Assignments API
    Route::get('/assignments', [ValidatorDashboardController::class, 'adminAssignmentsList']);
    Route::get('/assignments/pending', [ValidatorDashboardController::class, 'adminAssignmentsPending']);
    Route::post('/assignments', [ValidatorDashboardController::class, 'adminAssignmentsCreate']);
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
    Route::post('/validator/logout', [LoginController::class, 'logout']);
});

// Validator API Routes
Route::prefix('validator/api')->middleware('role:validator')->group(function () {
    Route::get('/totals', [ValidatorDashboardController::class, 'totals']);
    Route::get('/surveys', [ValidatorDashboardController::class, 'surveys']);
    Route::get('/submitted', [ValidatorDashboardController::class, 'submitted']);
    Route::get('/deleted', [ValidatorDashboardController::class, 'deleted']);
    Route::get('/survey/{survey_id}', [ValidatorDashboardController::class, 'surveyDetails']);
    Route::get('/survey/{survey_id}/export', [ValidatorDashboardController::class, 'exportSurveyCsv']);
    Route::get('/survey/{survey_id}/photo', [ValidatorDashboardController::class, 'surveyPhoto']);
    Route::get('/survey/{survey_id}/person-photo', [ValidatorDashboardController::class, 'surveyPersonPhoto']);
    Route::get('/export/barangay', [ValidatorDashboardController::class, 'validatorExportBarangayCsv']);
    Route::get('/profile', [ValidatorDashboardController::class, 'profile']);
    Route::post('/profile/password', [ValidatorDashboardController::class, 'updatePassword']);
    Route::get('/tag-number/preview', [ValidatorDashboardController::class, 'previewTagNumber']);
    Route::post('/survey', [ValidatorDashboardController::class, 'createSurvey']);
    Route::post('/submit', [ValidatorDashboardController::class, 'submitSurvey']);
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
