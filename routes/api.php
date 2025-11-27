<?php

use App\Http\Controllers\SurveyController;
use App\Http\Controllers\ValidatorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::post('/submit-survey', [SurveyController::class, 'store']);
Route::post('/update-survey', [SurveyController::class, 'update']);
Route::post('/validate-validator', [ValidatorController::class, 'validateValidator']);
Route::get('/sync-validators', [ValidatorController::class, 'syncValidators']);

// Health check route for connectivity testing
Route::get('/', function () {
    return response()->json(['status' => 'ok', 'message' => 'Chodams API is running']);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
