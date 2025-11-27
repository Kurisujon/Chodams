<?php

namespace App\Http\Controllers;

use App\Models\SurveyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class SurveyController extends Controller
{
    public function store(Request $request)
    {
        try {
            // Log the request for debugging
            Log::info('Survey sync request received', ['data' => $request->except('house_photo')]);

            // Exclude file-related fields from the main data array
            // house_photo is the file input
            // house_photo_filename and house_photo_type are metadata sent by Flutter
            $data = $request->except(['house_photo', 'house_photo_filename', 'house_photo_type']);

            // Handle Photo Upload
            if ($request->hasFile('house_photo')) {
                $file = $request->file('house_photo');
                
                // Use the provided filename or generate a unique one
                $filename = $request->input('house_photo_filename');
                if (!$filename) {
                    $filename = 'survey_' . time() . '_' . uniqid() . '.jpg';
                }
                
                // Store in 'public/survey_photos'
                // Ensure you have run `php artisan storage:link`
                $path = $file->storeAs('survey_photos', $filename, 'public');
                
                // Save the relative path to the database column 'house_photo'
                // Adjust this path format based on how you want to access it (e.g., full URL or relative)
                $data['house_photo'] = 'storage/survey_photos/' . $filename; 
            }

            if ($request->filled('validator_signature')) {
                $sig = $request->input('validator_signature');
                if (str_starts_with($sig, 'storage/')) {
                    $data['validator_signature'] = $sig;
                } elseif (str_starts_with($sig, 'data:image')) {
                    $parts = explode(';base64,', $sig);
                    $typeAux = explode('image/', $parts[0]);
                    $type = $typeAux[1] ?? 'png';
                    $decoded = base64_decode($parts[1] ?? '', true);
                    if ($decoded !== false && strlen($decoded) > 0) {
                        $filename = 'validator_sig_' . time() . '_' . uniqid() . '.' . $type;
                        Storage::disk('public')->put('signatures/' . $filename, $decoded);
                        $data['validator_signature'] = 'storage/signatures/' . $filename;
                    }
                } else {
                    $decoded = base64_decode($sig, true);
                    if ($decoded !== false && strlen($decoded) > 0) {
                        $filename = 'validator_sig_' . time() . '_' . uniqid() . '.png';
                        Storage::disk('public')->put('signatures/' . $filename, $decoded);
                        $data['validator_signature'] = 'storage/signatures/' . $filename;
                    } else {
                        $data['validator_signature'] = $sig;
                    }
                }
            }

            if ($request->filled('respondent_signature')) {
                $sig = $request->input('respondent_signature');
                if (str_starts_with($sig, 'storage/')) {
                    $data['respondent_signature'] = $sig;
                } elseif (str_starts_with($sig, 'data:image')) {
                    $parts = explode(';base64,', $sig);
                    $typeAux = explode('image/', $parts[0]);
                    $type = $typeAux[1] ?? 'png';
                    $decoded = base64_decode($parts[1] ?? '', true);
                    if ($decoded !== false && strlen($decoded) > 0) {
                        $filename = 'respondent_sig_' . time() . '_' . uniqid() . '.' . $type;
                        Storage::disk('public')->put('signatures/' . $filename, $decoded);
                        $data['respondent_signature'] = 'storage/signatures/' . $filename;
                    }
                } else {
                    $decoded = base64_decode($sig, true);
                    if ($decoded !== false && strlen($decoded) > 0) {
                        $filename = 'respondent_sig_' . time() . '_' . uniqid() . '.png';
                        Storage::disk('public')->put('signatures/' . $filename, $decoded);
                        $data['respondent_signature'] = 'storage/signatures/' . $filename;
                    } else {
                        $data['respondent_signature'] = $sig;
                    }
                }
            }

            // Create the record in survey_response table
            $survey = SurveyResponse::create($data);

            return response()->json([
                'success' => true,
                'server_id' => $survey->survey_id,
                'message' => 'Survey synced successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Survey sync error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server Error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $id = $request->input('survey_id');
            
            if (!$id) {
                 return response()->json(['success' => false, 'message' => 'Survey ID required'], 400);
            }

            $survey = SurveyResponse::find($id);

            if (!$survey) {
                return response()->json(['success' => false, 'message' => 'Survey not found'], 404);
            }

            // Exclude file-related fields and ID
            $data = $request->except(['house_photo', 'house_photo_filename', 'house_photo_type', 'survey_id']);

            // Handle Photo Upload
            if ($request->hasFile('house_photo')) {
                $file = $request->file('house_photo');
                $filename = $request->input('house_photo_filename');
                if (!$filename) {
                    $filename = 'survey_' . time() . '_' . uniqid() . '.jpg';
                }
                
                $path = $file->storeAs('survey_photos', $filename, 'public');
                $data['house_photo'] = 'storage/survey_photos/' . $filename; 
            }

            if ($request->filled('validator_signature')) {
                $sig = $request->input('validator_signature');
                if (str_starts_with($sig, 'storage/')) {
                    $data['validator_signature'] = $sig;
                } elseif (str_starts_with($sig, 'data:image')) {
                    $parts = explode(';base64,', $sig);
                    $typeAux = explode('image/', $parts[0]);
                    $type = $typeAux[1] ?? 'png';
                    $decoded = base64_decode($parts[1] ?? '', true);
                    if ($decoded !== false && strlen($decoded) > 0) {
                        $filename = 'validator_sig_' . time() . '_' . uniqid() . '.' . $type;
                        Storage::disk('public')->put('signatures/' . $filename, $decoded);
                        $data['validator_signature'] = 'storage/signatures/' . $filename;
                    }
                } else {
                    $decoded = base64_decode($sig, true);
                    if ($decoded !== false && strlen($decoded) > 0) {
                        $filename = 'validator_sig_' . time() . '_' . uniqid() . '.png';
                        Storage::disk('public')->put('signatures/' . $filename, $decoded);
                        $data['validator_signature'] = 'storage/signatures/' . $filename;
                    } else {
                        $data['validator_signature'] = $sig;
                    }
                }
            }

            if ($request->filled('respondent_signature')) {
                $sig = $request->input('respondent_signature');
                if (str_starts_with($sig, 'storage/')) {
                    $data['respondent_signature'] = $sig;
                } elseif (str_starts_with($sig, 'data:image')) {
                    $parts = explode(';base64,', $sig);
                    $typeAux = explode('image/', $parts[0]);
                    $type = $typeAux[1] ?? 'png';
                    $decoded = base64_decode($parts[1] ?? '', true);
                    if ($decoded !== false && strlen($decoded) > 0) {
                        $filename = 'respondent_sig_' . time() . '_' . uniqid() . '.' . $type;
                        Storage::disk('public')->put('signatures/' . $filename, $decoded);
                        $data['respondent_signature'] = 'storage/signatures/' . $filename;
                    }
                } else {
                    $decoded = base64_decode($sig, true);
                    if ($decoded !== false && strlen($decoded) > 0) {
                        $filename = 'respondent_sig_' . time() . '_' . uniqid() . '.png';
                        Storage::disk('public')->put('signatures/' . $filename, $decoded);
                        $data['respondent_signature'] = 'storage/signatures/' . $filename;
                    } else {
                        $data['respondent_signature'] = $sig;
                    }
                }
            }

            $survey->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Survey updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Survey update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server Error: ' . $e->getMessage()
            ], 500);
        }
    }
}
