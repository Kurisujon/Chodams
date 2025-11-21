<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ValidatorDashboardController;

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

// Admin Dashboard (React)
Route::get('/admin/dashboard', function () {
    return Inertia::render('AdminDashboard');
});

// Admin Beneficiaries Page (React)
Route::get('/admin/beneficiaries', function () {
    return Inertia::render('AdminBeneficiaries');
});

// Admin Profile (React)
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

// Admin Beneficiary Details (reuse SurveyDetails)
Route::get('/admin/beneficiaries/{survey_id}', function ($survey_id) {
    return Inertia::render('SurveyDetails', ['survey_id' => $survey_id, 'api_base' => '/admin/api']);
});

// Admin Logout
Route::post('/admin/logout', [LoginController::class, 'logout']);

// Admin API Routes
Route::prefix('admin/api')->group(function () {
    Route::get('/totals', [ValidatorDashboardController::class, 'adminTotals']);
    Route::get('/barangay', [ValidatorDashboardController::class, 'adminBarangay']);
    Route::get('/classification', [ValidatorDashboardController::class, 'adminClassification']);
    Route::get('/subclass-displaced', [ValidatorDashboardController::class, 'adminSubclassDisplaced']);
    Route::get('/subclass-doubleup', [ValidatorDashboardController::class, 'adminSubclassDoubleUp']);
    Route::get('/beneficiaries/validated', [ValidatorDashboardController::class, 'adminBeneficiariesValidated']);
    Route::get('/beneficiaries/approved', [ValidatorDashboardController::class, 'adminBeneficiariesApproved']);

    Route::get('/profile', [ValidatorDashboardController::class, 'adminProfile']);
    Route::post('/profile', [ValidatorDashboardController::class, 'adminProfileUpdate']);

    Route::get('/validators', [ValidatorDashboardController::class, 'adminValidators']);
    Route::post('/validators', [ValidatorDashboardController::class, 'adminValidatorCreate']);
    Route::post('/validators/{validator_id}/status', [ValidatorDashboardController::class, 'adminValidatorUpdateStatus']);

    Route::get('/survey/{survey_id}', [ValidatorDashboardController::class, 'adminSurveyDetails']);
    Route::get('/survey/{survey_id}/photo', [ValidatorDashboardController::class, 'adminSurveyPhoto']);
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
    Route::get('/profile', [ValidatorDashboardController::class, 'profile']);
    Route::post('/profile/password', [ValidatorDashboardController::class, 'updatePassword']);
    Route::post('/survey', [ValidatorDashboardController::class, 'createSurvey']);
    Route::post('/submit', [ValidatorDashboardController::class, 'submitSurvey']);
});

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
