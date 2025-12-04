<?php

namespace App\Http\Controllers;

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
                $filename = $request->input('house_photo_filename');
                if (!$filename) {
                    $filename = 'survey_' . time() . '_' . uniqid() . '.jpg';
                }
                $path = $file->storeAs('images', $filename, 'public');
                $data['house_photo'] = 'storage/images/' . $filename; 
            }

            if (!array_key_exists('house_photo', $data)) {
                $data['house_photo'] = '';
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

            $surveyId = \Illuminate\Support\Facades\DB::transaction(function() use ($request, $data) {
                $toInt = function($v) { return is_numeric($v) ? (int)$v : null; };
                $yn = function($v) { $s = is_string($v) ? strtolower(trim($v)) : $v; return ($s === 'yes' || $s === 1 || $s === '1') ? 1 : (($s === 'no' || $s === 0 || $s === '0') ? 0 : null); };
                $classMap = [
                    'displaced' => 1,
                    'double-up' => 2,
                    'homeless' => 3,
                    'upgrading of land tenure' => 4,
                    'upgrading_of_land_tenure' => 4,
                ];
                $displacedMap = [
                    'coastal areas' => 1,
                    'drought' => 2,
                    'earthquake affected' => 3,
                    'flood affected' => 4,
                    'sea level rise' => 5,
                    'threat of eviction' => 6,
                    'eviction/demolition order' => 7,
                    'human induced disaster' => 8,
                    'infra projects' => 9,
                    'landslide affected' => 10,
                    'near waterways' => 11,
                ];
                $doubleupMap = [
                    'renter/tenant' => 1,
                    'rent-free/sharer' => 2,
                    'caretaker' => 3,
                ];
                $homelessMap = [
                    'public - living in tent' => 1,
                    'private - living in tent' => 2,
                ];
                $genderMap = ['male'=>1,'female'=>2];
                $affMap = [
                    'none'=>0,'n/a'=>0,
                    'sss'=>1,'gsis'=>2,'philhealth'=>3,'pagibig'=>4,
                    'pwd'=>5,'senior_citizen'=>6,'solo_parent'=>7,'4ps'=>8,
                ];

                $classificationCode = $classMap[strtolower((string)$request->input('classification'))] ?? null;
                $subDisplacedCode = ($request->input('sub_class_displaced') ?? $request->input('subclass_displaced')) ? ($displacedMap[strtolower((string)($request->input('sub_class_displaced') ?? $request->input('subclass_displaced')))] ?? null) : null;
                $subDoubleupCode = ($request->input('sub_class_double_up') ?? $request->input('subclass_doubleup')) ? ($doubleupMap[strtolower((string)($request->input('sub_class_double_up') ?? $request->input('subclass_doubleup')))] ?? null) : null;
                $subHomelessCode = ($request->input('sub_class_homeless') ?? $request->input('subclass_homeless')) ? ($homelessMap[strtolower((string)($request->input('sub_class_homeless') ?? $request->input('subclass_homeless')))] ?? null) : null;
                $prevClientCode = $yn($request->input('previous_client'));
                $spouseGenderCode = $genderMap[strtolower((string)$request->input('spouse_gender'))] ?? null;
                $affRaw = strtolower(str_replace(' ', '_', (string)$request->input('affiliation')));
                $affCode = $affMap[$affRaw] ?? 0;

                $sid = \Illuminate\Support\Facades\DB::table('survey')->insertGetId([
                    'validator_id' => (int)($request->input('validator_id') ?? 1),
                    'interviewed_by' => $request->input('interviewed_by'),
                    'date_interviewed' => $request->input('date_interviewed'),
                    'is_submitted' => (int)($request->input('is_submitted') ?? 0),
                    'validator_signature' => $data['validator_signature'] ?? null,
                ]);

                \Illuminate\Support\Facades\DB::table('classification')->insert([
                    'survey_id' => $sid,
                    'previous_client' => $prevClientCode,
                    'year_inhabited' => $toInt($request->input('year_inhabited')),
                    'classification' => $classificationCode,
                    'subclass_displaced' => $subDisplacedCode,
                    'subclass_doubleup' => $subDoubleupCode,
                    'subclass_homeless' => $subHomelessCode,
                ]);

                \Illuminate\Support\Facades\DB::table('demographic')->insert([
                    'survey_id' => $sid,
                    'interview_person' => $request->input('interview_person'),
                    'last_name' => $request->input('last_name'),
                    'first_name' => $request->input('first_name'),
                    'middle_name' => $request->input('middle_name'),
                    'suffix' => $request->input('suffix'),
                    'barangay' => $request->input('barangay'),
                    'purok' => $request->input('purok'),
                    'street' => $request->input('street'),
                    'gender' => $request->input('gender'),
                    'religion' => $request->input('religion'),
                    'birth_place' => $request->input('birth_place'),
                    'birth_date' => $request->input('birth_date'),
                    'person_age' => $toInt($request->input('person_age')),
                    'marital_status' => $request->input('marital_status'),
                    'contact_number' => $request->input('contact_number'),
                    'language_spoken' => $request->input('language_spoken'),
                    'tribe' => $request->input('tribe'),
                    'highest_education' => $request->input('highest_education'),
                    'last_school_name' => $request->input('last_school_name'),
                    'year_graduated' => $toInt($request->input('year_graduated')),
                    'spouse_name' => $request->input('spouse_name'),
                    'spouse_religion' => $request->input('spouse_religion'),
                    'spouse_tribe' => $request->input('spouse_tribe'),
                    'spouse_age' => $toInt($request->input('spouse_age')),
                    'spouse_gender' => $spouseGenderCode,
                    'affiliation' => $affCode,
                ]);

                $housing_structure = $request->input('housing_structure');
                if ($housing_structure === 'Others') $housing_structure = $request->input('other_housing_structure');
                $type_of_toilet = $request->input('type_of_toilet');
                if ($type_of_toilet === 'Others') $type_of_toilet = $request->input('other_type_of_toilet');
                $source_of_water = $request->input('source_of_water');
                if ($source_of_water === 'Others') $source_of_water = $request->input('other_source_of_water');
                $source_of_electricity = $request->input('source_of_electricity');
                if ($source_of_electricity === 'Others') $source_of_electricity = $request->input('other_source_of_electricity');

                \Illuminate\Support\Facades\DB::table('household')->insert([
                    'survey_id' => $sid,
                    'lot_ownership' => $request->input('lot_ownership'),
                    'house_ownership' => $request->input('house_ownership'),
                    'avail_socialized_housing' => $request->input('avail_socialized_housing'),
                    'temporary_living_area' => $request->input('temporary_living_area'),
                    'housing_structure' => $housing_structure,
                    'type_of_toilet' => $type_of_toilet,
                    'source_of_water' => $source_of_water,
                    'source_of_electricity' => $source_of_electricity,
                ]);

                $main_income_source = $request->input('main_income_source');
                if (strtolower((string)$main_income_source) === 'others') $main_income_source = $request->input('other_main_income_source');
                $work_status = $request->input('work_status');
                if (strtolower((string)$work_status) === 'others') $work_status = $request->input('other_work_status');

                \Illuminate\Support\Facades\DB::table('economic')->insert([
                    'survey_id' => $sid,
                    'main_income_source' => $main_income_source,
                    'work_status' => $work_status,
                    'work_location_head' => $request->input('work_location_head'),
                    'monthly_salary' => $request->input('monthly_salary'),
                    'combine_monthly_income' => $request->input('combine_monthly_income'),
                ]);

                $skills_for_living = $request->input('skills_for_living');
                $specific_skill = null;
                if ($skills_for_living === 'Yes') {
                    $specific_skill = $request->input('specific_skill');
                    if (strtolower((string)$specific_skill) === 'others') $specific_skill = $request->input('other_skill');
                }
                $organization_member = $request->input('organization_member');
                $specific_organization = null;
                if ($organization_member === 'Yes') {
                    $specific_organization = $request->input('specific_organization');
                    if (strtolower((string)$specific_organization) === 'others') $specific_organization = $request->input('other_organization');
                }

                \Illuminate\Support\Facades\DB::table('training')->insert([
                    'survey_id' => $sid,
                    'skills_for_living' => $skills_for_living,
                    'specific_skill' => $specific_skill,
                    'organization_member' => $organization_member,
                    'specific_organization' => $specific_organization,
                    'house_photo' => $data['house_photo'] ?? '',
                    'wanttolearn' => $request->input('wanttolearn'),
                    'remarks' => $request->input('remarks'),
                    'latitude' => $request->input('latitude'),
                    'longitude' => $request->input('longitude'),
                    'respondent_signature' => $data['respondent_signature'] ?? null,
                ]);

                return $sid;
            });

            return response()->json([
                'success' => true,
                'server_id' => $surveyId,
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
            $id = (int) $request->input('survey_id');
            if (!$id) { return response()->json(['success' => false, 'message' => 'Survey ID required'], 400); }

            $exists = \Illuminate\Support\Facades\DB::table('survey')->where('survey_id', $id)->first();
            if (!$exists) { return response()->json(['success' => false, 'message' => 'Survey not found'], 404); }

            $data = $request->except(['house_photo', 'house_photo_filename', 'house_photo_type', 'survey_id']);

            if ($request->hasFile('house_photo')) {
                $file = $request->file('house_photo');
                $filename = $request->input('house_photo_filename');
                if (!$filename) { $filename = 'survey_' . time() . '_' . uniqid() . '.jpg'; }
                $path = $file->storeAs('images', $filename, 'public');
                $data['house_photo'] = 'storage/images/' . $filename;
            }

            if ($request->filled('validator_signature')) {
                $sig = $request->input('validator_signature');
                if (str_starts_with($sig, 'storage/')) { $data['validator_signature'] = $sig; }
                elseif (str_starts_with($sig, 'data:image')) {
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
                    } else { $data['validator_signature'] = $sig; }
                }
            }

            if ($request->filled('respondent_signature')) {
                $sig = $request->input('respondent_signature');
                if (str_starts_with($sig, 'storage/')) { $data['respondent_signature'] = $sig; }
                elseif (str_starts_with($sig, 'data:image')) {
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
                    } else { $data['respondent_signature'] = $sig; }
                }
            }

            $toInt = function($v) { return is_numeric($v) ? (int)$v : null; };
            $yn = function($v) { $s = is_string($v) ? strtolower(trim($v)) : $v; return ($s === 'yes' || $s === 1 || $s === '1') ? 1 : (($s === 'no' || $s === 0 || $s === '0') ? 0 : null); };
            $classMap = ['displaced'=>1,'double-up'=>2,'homeless'=>3,'upgrading of land tenure'=>4,'upgrading_of_land_tenure'=>4];
            $displacedMap = ['coastal areas'=>1,'drought'=>2,'earthquake affected'=>3,'flood affected'=>4,'sea level rise'=>5,'threat of eviction'=>6,'eviction/demolition order'=>7,'human induced disaster'=>8,'infra projects'=>9,'landslide affected'=>10,'near waterways'=>11];
            $doubleupMap = ['renter/tenant'=>1,'rent-free/sharer'=>2,'caretaker'=>3];
            $homelessMap = ['public - living in tent'=>1,'private - living in tent'=>2];
            $genderMap = ['male'=>1,'female'=>2];
            $affMap = ['none'=>0,'n/a'=>0,'sss'=>1,'gsis'=>2,'philhealth'=>3,'pagibig'=>4,'pwd'=>5,'senior_citizen'=>6,'solo_parent'=>7,'4ps'=>8];

            $classificationCode = $classMap[strtolower((string)$request->input('classification'))] ?? null;
            $subDisplacedCode = ($request->input('sub_class_displaced') ?? $request->input('subclass_displaced')) ? ($displacedMap[strtolower((string)($request->input('sub_class_displaced') ?? $request->input('subclass_displaced')))] ?? null) : null;
            $subDoubleupCode = ($request->input('sub_class_double_up') ?? $request->input('subclass_doubleup')) ? ($doubleupMap[strtolower((string)($request->input('sub_class_double_up') ?? $request->input('subclass_doubleup')))] ?? null) : null;
            $subHomelessCode = ($request->input('sub_class_homeless') ?? $request->input('subclass_homeless')) ? ($homelessMap[strtolower((string)($request->input('sub_class_homeless') ?? $request->input('subclass_homeless')))] ?? null) : null;
            $prevClientCode = $yn($request->input('previous_client'));
            $spouseGenderCode = $genderMap[strtolower((string)$request->input('spouse_gender'))] ?? null;
            $affRaw = strtolower(str_replace(' ', '_', (string)$request->input('affiliation')));
            $affCode = $affMap[$affRaw] ?? 0;

            \Illuminate\Support\Facades\DB::table('survey')->where('survey_id', $id)->update([
                'validator_id' => (int)($request->input('validator_id') ?? 1),
                'interviewed_by' => $request->input('interviewed_by'),
                'date_interviewed' => $request->input('date_interviewed'),
                'is_submitted' => (int)($request->input('is_submitted') ?? 0),
                'validator_signature' => $data['validator_signature'] ?? $exists->validator_signature ?? null,
            ]);

            $clsExists = \Illuminate\Support\Facades\DB::table('classification')->where('survey_id', $id)->first();
            if ($clsExists) {
                \Illuminate\Support\Facades\DB::table('classification')->where('survey_id', $id)->update([
                    'previous_client' => $prevClientCode,
                    'year_inhabited' => $toInt($request->input('year_inhabited')),
                    'classification' => $classificationCode,
                    'subclass_displaced' => $subDisplacedCode,
                    'subclass_doubleup' => $subDoubleupCode,
                    'subclass_homeless' => $subHomelessCode,
                ]);
            } else {
                \Illuminate\Support\Facades\DB::table('classification')->insert([
                    'survey_id' => $id,
                    'previous_client' => $prevClientCode,
                    'year_inhabited' => $toInt($request->input('year_inhabited')),
                    'classification' => $classificationCode,
                    'subclass_displaced' => $subDisplacedCode,
                    'subclass_doubleup' => $subDoubleupCode,
                    'subclass_homeless' => $subHomelessCode,
                ]);
            }

            $demoExists = \Illuminate\Support\Facades\DB::table('demographic')->where('survey_id', $id)->first();
            $demoData = [
                'survey_id' => $id,
                'interview_person' => $request->input('interview_person'),
                'last_name' => $request->input('last_name'),
                'first_name' => $request->input('first_name'),
                'middle_name' => $request->input('middle_name'),
                'suffix' => $request->input('suffix'),
                'barangay' => $request->input('barangay'),
                'purok' => $request->input('purok'),
                'street' => $request->input('street'),
                'gender' => $request->input('gender'),
                'religion' => $request->input('religion'),
                'birth_place' => $request->input('birth_place'),
                'birth_date' => $request->input('birth_date'),
                'person_age' => $toInt($request->input('person_age')),
                'marital_status' => $request->input('marital_status'),
                'contact_number' => $request->input('contact_number'),
                'language_spoken' => $request->input('language_spoken'),
                'tribe' => $request->input('tribe'),
                'highest_education' => $request->input('highest_education'),
                'last_school_name' => $request->input('last_school_name'),
                'year_graduated' => $toInt($request->input('year_graduated')),
                'spouse_name' => $request->input('spouse_name'),
                'spouse_religion' => $request->input('spouse_religion'),
                'spouse_tribe' => $request->input('spouse_tribe'),
                'spouse_age' => $toInt($request->input('spouse_age')),
                'spouse_gender' => $spouseGenderCode,
                'affiliation' => $affCode,
            ];
            if ($demoExists) {
                \Illuminate\Support\Facades\DB::table('demographic')->where('survey_id', $id)->update($demoData);
            } else {
                \Illuminate\Support\Facades\DB::table('demographic')->insert($demoData);
            }

            $housing_structure = $request->input('housing_structure');
            if ($housing_structure === 'Others') $housing_structure = $request->input('other_housing_structure');
            $type_of_toilet = $request->input('type_of_toilet');
            if ($type_of_toilet === 'Others') $type_of_toilet = $request->input('other_type_of_toilet');
            $source_of_water = $request->input('source_of_water');
            if ($source_of_water === 'Others') $source_of_water = $request->input('other_source_of_water');
            $source_of_electricity = $request->input('source_of_electricity');
            if ($source_of_electricity === 'Others') $source_of_electricity = $request->input('other_source_of_electricity');

            $houseExists = \Illuminate\Support\Facades\DB::table('household')->where('survey_id', $id)->first();
            $houseData = [
                'survey_id' => $id,
                'lot_ownership' => $request->input('lot_ownership'),
                'house_ownership' => $request->input('house_ownership'),
                'avail_socialized_housing' => $request->input('avail_socialized_housing'),
                'temporary_living_area' => $request->input('temporary_living_area'),
                'housing_structure' => $housing_structure,
                'type_of_toilet' => $type_of_toilet,
                'source_of_water' => $source_of_water,
                'source_of_electricity' => $source_of_electricity,
            ];
            if ($houseExists) {
                \Illuminate\Support\Facades\DB::table('household')->where('survey_id', $id)->update($houseData);
            } else {
                \Illuminate\Support\Facades\DB::table('household')->insert($houseData);
            }

            $main_income_source = $request->input('main_income_source');
            if (strtolower((string)$main_income_source) === 'others') $main_income_source = $request->input('other_main_income_source');
            $work_status = $request->input('work_status');
            if (strtolower((string)$work_status) === 'others') $work_status = $request->input('other_work_status');

            $econExists = \Illuminate\Support\Facades\DB::table('economic')->where('survey_id', $id)->first();
            $econData = [
                'survey_id' => $id,
                'main_income_source' => $main_income_source,
                'work_status' => $request->input('work_status'),
                'work_location_head' => $request->input('work_location_head'),
                'monthly_salary' => $request->input('monthly_salary'),
                'combine_monthly_income' => $request->input('combine_monthly_income'),
            ];
            if ($econExists) {
                \Illuminate\Support\Facades\DB::table('economic')->where('survey_id', $id)->update($econData);
            } else {
                \Illuminate\Support\Facades\DB::table('economic')->insert($econData);
            }

            $skills_for_living = $request->input('skills_for_living');
            $specific_skill = null;
            if ($skills_for_living === 'Yes') {
                $specific_skill = $request->input('specific_skill');
                if (strtolower((string)$specific_skill) === 'others') $specific_skill = $request->input('other_skill');
            }
            $organization_member = $request->input('organization_member');
            $specific_organization = null;
            if ($organization_member === 'Yes') {
                $specific_organization = $request->input('specific_organization');
                if (strtolower((string)$specific_organization) === 'others') $specific_organization = $request->input('other_organization');
            }

            $trainExists = \Illuminate\Support\Facades\DB::table('training')->where('survey_id', $id)->first();
            $trainData = [
                'survey_id' => $id,
                'skills_for_living' => $skills_for_living,
                'specific_skill' => $specific_skill,
                'organization_member' => $organization_member,
                'specific_organization' => $specific_organization,
                'house_photo' => $data['house_photo'] ?? ($trainExists->house_photo ?? ''),
                'wanttolearn' => $request->input('wanttolearn'),
                'remarks' => $request->input('remarks'),
                'latitude' => $request->input('latitude'),
                'longitude' => $request->input('longitude'),
                'respondent_signature' => $data['respondent_signature'] ?? ($trainExists->respondent_signature ?? null),
            ];
            if ($trainExists) {
                \Illuminate\Support\Facades\DB::table('training')->where('survey_id', $id)->update($trainData);
            } else {
                \Illuminate\Support\Facades\DB::table('training')->insert($trainData);
            }

            return response()->json(['success' => true, 'message' => 'Survey updated successfully']);

        } catch (\Exception $e) {
            Log::error('Survey update error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }
}
