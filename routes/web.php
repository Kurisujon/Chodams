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
Route::middleware('admin')->group(function () {
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

    Route::prefix('admin/api')->group(function () {
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
    });
});

// Validator Logout
Route::post('/validator/logout', [LoginController::class, 'logout']);

// Validator Dashboard (React)
Route::get('/validator/dashboard', function () {
    return Inertia::render('ValidatorDashboard');
});

// Survey Form Page (React)
Route::get('/validator/survey-form', function () {
    return Inertia::render('SurveyForm', [
        'validator_name' => session('name'),
    ]);
});

// Survey Details Page (React)
Route::get('/validator/survey/{survey_id}', function ($survey_id) {
    return Inertia::render('SurveyDetails', ['survey_id' => $survey_id]);
});

// Validator Profile Page (React)
Route::get('/validator/profile', function () {
    return Inertia::render('ValidatorProfile');
});

// Validator Logout
Route::post('/validator/logout', [LoginController::class, 'logout']);

// Validator API Routes
Route::prefix('validator/api')->group(function () {
    Route::get('/totals', [ValidatorDashboardController::class, 'totals']);
    Route::get('/surveys', [ValidatorDashboardController::class, 'surveys']);
    Route::get('/submitted', [ValidatorDashboardController::class, 'submitted']);
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
