<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class ValidatorDashboardController extends Controller
{
    // Return totals
    public function totals(Request $request)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $total_surveyed = DB::table('survey')
            ->where('validator_id', $validator_id)
            ->count();

        $total_submitted = DB::table('survey')
            ->where('validator_id', $validator_id)
            ->whereIn('is_submitted', [1,2])
            ->count();

        return response()->json([
            'total_surveyed' => $total_surveyed,
            'total_submitted' => $total_submitted
        ]);
    }

    // Paginated surveyed
    public function surveys(Request $request)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $offset = ($page - 1) * $perPage;

        $total = DB::table('survey AS s')
            ->where('s.validator_id', $validator_id)
            ->count();

        $rows = DB::table('survey AS s')
            ->join('demographic AS d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification AS c', 'c.survey_id', '=', 's.survey_id')
            ->select('s.survey_id','s.date_interviewed','d.barangay','d.purok','d.last_name','c.classification','c.subclass_displaced','c.subclass_doubleup')
            ->where('s.validator_id', $validator_id)
            ->orderBy('s.survey_id','desc')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->map(function($row){
                $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',
                    6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'
                ];
                $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?: '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?: '');
                return $row;
            });

        return response()->json([
            'data' => $rows,
            'total' => $total,
            'per_page' => $perPage,
            'page' => $page
        ]);
    }

    // Paginated submitted
    public function submitted(Request $request)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $offset = ($page - 1) * $perPage;

        $total = DB::table('survey AS s')
            ->where('s.validator_id', $validator_id)
            ->whereIn('s.is_submitted', [1,2])
            ->count();

        $rows = DB::table('survey AS s')
            ->join('demographic AS d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification AS c', 'c.survey_id', '=', 's.survey_id')
            ->select('s.survey_id','s.date_interviewed','d.barangay','d.purok','d.last_name','c.classification','c.subclass_displaced','c.subclass_doubleup')
            ->where('s.validator_id', $validator_id)
            ->whereIn('s.is_submitted', [1,2])
            ->orderBy('s.survey_id','desc')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->map(function($row){
                $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',
                    6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'
                ];
                $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?: '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?: '');
                return $row;
            });

        return response()->json([
            'data' => $rows,
            'total' => $total,
            'per_page' => $perPage,
            'page' => $page
        ]);
    }

    // Submit a survey to admin (change is_submitted)
    public function submitSurvey(Request $request)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $survey_id = $request->input('survey_id');
        if (!$survey_id) {
            return response()->json(['message' => 'Missing survey_id'], 400);
        }

        $updated = DB::table('survey')
            ->where('survey_id', $survey_id)
            ->where('validator_id', $validator_id)
            ->update(['is_submitted' => 1]);

        return response()->json(['updated' => (bool)$updated]);
    }

    public function surveyDetails(Request $request, $survey_id)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $s = DB::table('survey as s')
            ->where('s.survey_id', $survey_id)
            ->where('s.validator_id', $validator_id)
            ->first();
        if (!$s) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $c = DB::table('classification')->where('survey_id', $survey_id)->first();
        $d = DB::table('demographic')->where('survey_id', $survey_id)->first();
        $h = DB::table('household')->where('survey_id', $survey_id)->first();
        $e = DB::table('economic')->where('survey_id', $survey_id)->first();
        $t = DB::table('training')->where('survey_id', $survey_id)->first();

        $surveyArr = [];
        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
        $displacedLabel = [
            1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',
            6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'
        ];
        $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
        $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];
        $ynLabel = [0=>'No',1=>'Yes'];
        $genderLabel = [1=>'Male',2=>'Female'];
        $affLabel = [0=>'None',1=>'SSS',2=>'GSIS',3=>'PhilHealth',4=>'PagIbig',5=>'PWD',6=>'Senior_Citizen',7=>'Solo_Parent',8=>'4Ps'];
        $surveyArr['survey_id'] = $survey_id;
        $surveyArr['interviewed_by'] = $s->interviewed_by ?? null;
        $surveyArr['date_interviewed'] = $s->date_interviewed ?? null;
        $surveyArr['is_submitted'] = $s->is_submitted ?? null;
        $surveyArr['validator_signature'] = $s->validator_signature ?? null;

        if ($c) {
            $surveyArr['previous_client'] = array_key_exists($c->previous_client, $ynLabel) ? $ynLabel[$c->previous_client] : $c->previous_client;
            $surveyArr['year_inhabited'] = $c->year_inhabited ?? null;
            $surveyArr['classification'] = array_key_exists($c->classification, $classLabel) ? $classLabel[$c->classification] : $c->classification;
            $surveyArr['subclass_displaced'] = array_key_exists($c->subclass_displaced, $displacedLabel) ? $displacedLabel[$c->subclass_displaced] : $c->subclass_displaced;
            $surveyArr['subclass_doubleup'] = array_key_exists($c->subclass_doubleup, $doubleupLabel) ? $doubleupLabel[$c->subclass_doubleup] : $c->subclass_doubleup;
            $surveyArr['subclass_homeless'] = array_key_exists($c->subclass_homeless, $homelessLabel) ? $homelessLabel[$c->subclass_homeless] : $c->subclass_homeless;
        }

        if ($d) {
            $surveyArr['interview_person'] = $d->interview_person ?? null;
            $surveyArr['last_name'] = $d->last_name ?? null;
            $surveyArr['first_name'] = $d->first_name ?? null;
            $surveyArr['middle_name'] = $d->middle_name ?? null;
            $surveyArr['suffix'] = $d->suffix ?? null;
            $surveyArr['barangay'] = $d->barangay ?? null;
            $surveyArr['purok'] = $d->purok ?? null;
            $surveyArr['street'] = $d->street ?? null;
            $surveyArr['gender'] = $d->gender ?? null;
            $surveyArr['religion'] = $d->religion ?? null;
            $surveyArr['birth_place'] = $d->birth_place ?? null;
            $surveyArr['birth_date'] = $d->birth_date ?? null;
            $surveyArr['person_age'] = $d->person_age ?? null;
            $surveyArr['marital_status'] = $d->marital_status ?? null;
            $surveyArr['contact_number'] = $d->contact_number ?? null;
            $surveyArr['language_spoken'] = $d->language_spoken ?? null;
            $surveyArr['tribe'] = $d->tribe ?? null;
            $surveyArr['highest_education'] = $d->highest_education ?? null;
            $surveyArr['last_school_name'] = $d->last_school_name ?? null;
            $surveyArr['year_graduated'] = $d->year_graduated ?? null;
            $surveyArr['spouse_name'] = $d->spouse_name ?? null;
            $surveyArr['spouse_religion'] = $d->spouse_religion ?? null;
            $surveyArr['spouse_tribe'] = $d->spouse_tribe ?? null;
            $surveyArr['spouse_age'] = $d->spouse_age ?? null;
            $surveyArr['spouse_gender'] = array_key_exists($d->spouse_gender, $genderLabel) ? $genderLabel[$d->spouse_gender] : $d->spouse_gender;
            $surveyArr['affiliation'] = array_key_exists($d->affiliation, $affLabel) ? $affLabel[$d->affiliation] : $d->affiliation;
        }

        if ($h) {
            $surveyArr['lot_ownership'] = $h->lot_ownership ?? null;
            $surveyArr['house_ownership'] = $h->house_ownership ?? null;
            $surveyArr['avail_socialized_housing'] = $h->avail_socialized_housing ?? null;
            $surveyArr['temporary_living_area'] = $h->temporary_living_area ?? null;
            $surveyArr['housing_structure'] = $h->housing_structure ?? null;
            $surveyArr['type_of_toilet'] = $h->type_of_toilet ?? null;
            $surveyArr['source_of_water'] = $h->source_of_water ?? null;
            $surveyArr['source_of_electricity'] = $h->source_of_electricity ?? null;
        }

        if ($e) {
            $surveyArr['main_income_source'] = $e->main_income_source ?? null;
            $surveyArr['work_status'] = $e->work_status ?? null;
            $surveyArr['work_location_head'] = $e->work_location_head ?? null;
            $surveyArr['monthly_salary'] = $e->monthly_salary ?? null;
            $surveyArr['combine_monthly_income'] = $e->combine_monthly_income ?? null;
        }

        if ($t) {
            $surveyArr['skills_for_living'] = $t->skills_for_living ?? null;
            $surveyArr['specific_skill'] = $t->specific_skill ?? null;
            $surveyArr['organization_member'] = $t->organization_member ?? null;
            $surveyArr['specific_organization'] = $t->specific_organization ?? null;
            $surveyArr['wanttolearn'] = $t->wanttolearn ?? null;
            $surveyArr['remarks'] = $t->remarks ?? null;
            $surveyArr['house_photo'] = $t->house_photo ?? null;
            $surveyArr['latitude'] = $t->latitude ?? null;
            $surveyArr['longitude'] = $t->longitude ?? null;
            $surveyArr['respondent_signature'] = $t->respondent_signature ?? null;
        }

        $members = DB::table('household_mem')
            ->where('survey_id', $survey_id)
            ->get();

        return response()->json([
            'survey' => $surveyArr,
            'members' => $members,
        ]);
    }

    public function surveyPhoto(Request $request, $survey_id)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $row = DB::table('training as t')
            ->join('survey as s', 's.survey_id', '=', 't.survey_id')
            ->select('t.house_photo')
            ->where('t.survey_id', $survey_id)
            ->where('s.validator_id', $validator_id)
            ->first();

        if (!$row || empty($row->house_photo)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $pathStr = trim((string)$row->house_photo);
        $ctype = 'image/jpeg';

        if ($pathStr !== '') {
            $p = ltrim($pathStr, '/');
            if (str_starts_with($p, 'storage/')) {
                $rel = substr($p, 8);
                if (\Illuminate\Support\Facades\Storage::disk('public')->exists($rel)) {
                    $abs = \Illuminate\Support\Facades\Storage::disk('public')->path($rel);
                    $mime = \Illuminate\Support\Facades\Storage::disk('public')->mimeType($rel) ?: $ctype;
                    return response()->file($abs, ['Content-Type' => $mime]);
                }
            }
            $absPublic = public_path($p);
            if (file_exists($absPublic)) {
                $mime = function_exists('mime_content_type') ? mime_content_type($absPublic) : $ctype;
                return response()->file($absPublic, ['Content-Type' => $mime]);
            }
        }

        return response()->json(['message' => 'Not found'], 404);
    }

    public function createSurvey(Request $request)
    {
        $validator_id = session('validator_id');
        $interviewed_by = session('name');
        if (!$validator_id || !$interviewed_by) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $normalize = function ($v) {
            if ($v === null) return null;
            $v = is_string($v) ? trim($v) : $v;
            return is_string($v) ? str_replace('_', ' ', $v) : $v;
        };

        $classification = $normalize($request->input('classification'));
        $subclass_displaced = $normalize($request->input('sub_class_displaced'));
        $subclass_doubleup = $normalize($request->input('sub_class_double_up'));
        $subclass_homeless = $normalize($request->input('sub_class_homeless'));

        if ($classification === 'Homeless') {
            $subclass_displaced = null;
            $subclass_doubleup = null;
        } elseif ($classification === 'Upgrading of Land Tenure') {
            $subclass_displaced = null;
            $subclass_doubleup = null;
            $subclass_homeless = null;
        } elseif ($classification === 'Displaced') {
            $subclass_doubleup = null;
            $subclass_homeless = null;
        } elseif ($classification === 'Double-up') {
            $subclass_displaced = null;
            $subclass_homeless = null;
        }
        $subclass_displaced = $subclass_displaced ?? null;
        $subclass_doubleup = $subclass_doubleup ?? null;
        $subclass_homeless = $subclass_homeless ?? null;

        $skills_for_living = $normalize($request->input('skills_for_living'));
        $specific_skill = null;
        if ($skills_for_living === 'Yes') {
            $specific_skill = $normalize($request->input('specific_skill'));
            if ($specific_skill === 'others') {
                $specific_skill = $normalize($request->input('other_skill'));
            }
        }
        if ($skills_for_living !== 'Yes') {
            $specific_skill = '';
        }

        $organization_member = $normalize($request->input('organization_member'));
        $specific_organization = null;
        if ($organization_member === 'Yes') {
            $specific_organization = $normalize($request->input('specific_organization'));
            if ($specific_organization === 'others') {
                $specific_organization = $normalize($request->input('other_organization'));
            }
        }
        if ($organization_member !== 'Yes') {
            $specific_organization = '';
        }

        $housing_structure = $normalize($request->input('housing_structure'));
        if ($housing_structure === 'Others') {
            $housing_structure = $normalize($request->input('other_housing_structure'));
        }
        $type_of_toilet = $normalize($request->input('type_of_toilet'));
        if ($type_of_toilet === 'Others') {
            $type_of_toilet = $normalize($request->input('other_type_of_toilet'));
        }
        $source_of_water = $normalize($request->input('source_of_water'));
        if ($source_of_water === 'Others') {
            $source_of_water = $normalize($request->input('other_source_of_water'));
        }
        $source_of_electricity = $normalize($request->input('source_of_electricity'));
        if ($source_of_electricity === 'Others') {
            $source_of_electricity = $normalize($request->input('other_source_of_electricity'));
        }

        $main_income_source = $normalize($request->input('main_income_source'));
        if ($main_income_source === 'others') {
            $main_income_source = $normalize($request->input('other_main_income_source'));
        }
        $work_status = $normalize($request->input('work_status'));
        if ($work_status === 'others') {
            $work_status = $normalize($request->input('other_work_status'));
        }

        $file = $request->file('house_photo');
        $house_photo_path = '';
        if ($file) {
            if ($file->getSize() > 5 * 1024 * 1024) {
                return response()->json(['message' => 'File too large'], 422);
            }
            $allowed = ['image/jpeg','image/png','image/gif','image/jpg'];
            if (!in_array($file->getMimeType(), $allowed)) {
                return response()->json(['message' => 'Invalid file type'], 422);
            }
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = uniqid('house_').'.'.$ext;
            \Illuminate\Support\Facades\Storage::disk('public')->putFileAs('house_photos', $file, $filename);
            $house_photo_path = 'storage/house_photos/'.$filename;
        }

        $saveSignature = function ($input) {
            if (!$input) return null;
            $s = is_string($input) ? trim($input) : '';
            if ($s === '') return null;
            if (strpos($s, ',') !== false) {
                $parts = explode(',', $s);
                if (count($parts) !== 2) return null;
                $data = base64_decode($parts[1]);
                $path = 'signatures/'.uniqid().'.png';
                Storage::disk('public')->put($path, $data);
                return $path;
            }
            return $s;
        };

        $validator_signature = $saveSignature($request->input('validator_signature'));
        $respondent_signature = $saveSignature($request->input('respondent_signature'));

        $marital_status = $normalize($request->input('marital_status'));
        $allowSpouse = in_array($marital_status, ['Married','Live-in','Widow/Widower','Separated','Annulled']);

        $spouse_name = $allowSpouse ? $normalize($request->input('spouse_name')) : null;
        $spouse_religion = $allowSpouse ? $normalize($request->input('spouse_religion')) : null;
        $spouse_tribe = $allowSpouse ? $normalize($request->input('spouse_tribe')) : null;
        $spouse_age = $allowSpouse ? $normalize($request->input('spouse_age')) : null;
        $spouse_gender = $allowSpouse ? $normalize($request->input('spouse_gender')) : null;

        $survey_id = DB::transaction(function() use ($validator_id, $interviewed_by, $request, $classification, $subclass_displaced, $subclass_doubleup, $subclass_homeless, $housing_structure, $type_of_toilet, $source_of_water, $source_of_electricity, $main_income_source, $work_status, $skills_for_living, $specific_skill, $organization_member, $specific_organization, $house_photo_path, $validator_signature, $respondent_signature, $marital_status, $spouse_name, $spouse_religion, $spouse_tribe, $spouse_age, $spouse_gender) {
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

            $classificationCode = $classMap[strtolower((string)$classification)] ?? null;
            $subDisplacedCode = $subclass_displaced ? ($displacedMap[strtolower((string)$subclass_displaced)] ?? null) : null;
            $subDoubleupCode = $subclass_doubleup ? ($doubleupMap[strtolower((string)$subclass_doubleup)] ?? null) : null;
            $subHomelessCode = $subclass_homeless ? ($homelessMap[strtolower((string)$subclass_homeless)] ?? null) : null;
            $prevClientCode = $yn($request->input('previous_client'));
            $spouseGenderCode = $genderMap[strtolower((string)$spouse_gender)] ?? null;
            $affRaw = strtolower(str_replace(' ', '_', (string)$request->input('affiliation')));
            $affCode = $affMap[$affRaw] ?? 0;
            $sid = DB::table('survey')->insertGetId([
                'validator_id' => $validator_id,
                'interviewed_by' => $interviewed_by,
                'date_interviewed' => trim((string)$request->input('date_interviewed')),
                'is_submitted' => 0,
                'validator_signature' => $validator_signature,
            ]);

            DB::table('classification')->insert([
                'survey_id' => $sid,
                'previous_client' => $prevClientCode,
                'year_inhabited' => $toInt($request->input('year_inhabited')),
                'classification' => $classificationCode,
                'subclass_displaced' => $subDisplacedCode,
                'subclass_doubleup' => $subDoubleupCode,
                'subclass_homeless' => $subHomelessCode,
            ]);

            DB::table('demographic')->insert([
                'survey_id' => $sid,
                'interview_person' => trim((string)$request->input('interview_person')),
                'last_name' => trim((string)$request->input('last_name')),
                'first_name' => trim((string)$request->input('first_name')),
                'middle_name' => trim((string)$request->input('middle_name')),
                'suffix' => trim((string)$request->input('suffix')),
                'barangay' => trim((string)$request->input('barangay')),
                'purok' => trim((string)$request->input('purok')),
                'street' => trim((string)$request->input('street')),
                'gender' => trim((string)$request->input('gender')),
                'religion' => trim((string)$request->input('religion')),
                'birth_place' => trim((string)$request->input('birth_place')),
                'birth_date' => trim((string)$request->input('birth_date')),
                'person_age' => $toInt($request->input('person_age')),
                'marital_status' => $marital_status,
                'contact_number' => trim((string)$request->input('contact_number')),
                'language_spoken' => trim((string)$request->input('language_spoken')),
                'tribe' => trim((string)$request->input('tribe')),
                'highest_education' => trim((string)$request->input('highest_education')),
                'last_school_name' => trim((string)$request->input('last_school_attended')),
                'year_graduated' => $toInt($request->input('year_graduated')),
                'spouse_name' => $spouse_name,
                'spouse_religion' => $spouse_religion,
                'spouse_tribe' => $spouse_tribe,
                'spouse_age' => $toInt($spouse_age),
                'spouse_gender' => $spouseGenderCode,
                'affiliation' => $affCode,
            ]);

            DB::table('household')->insert([
                'survey_id' => $sid,
                'lot_ownership' => trim((string)$request->input('lot_ownership')),
                'house_ownership' => trim((string)$request->input('house_ownership')),
                'avail_socialized_housing' => trim((string)$request->input('avail_socialized_housing')),
                'temporary_living_area' => trim((string)$request->input('temporary_living_area')),
                'housing_structure' => $housing_structure,
                'type_of_toilet' => $type_of_toilet,
                'source_of_water' => $source_of_water,
                'source_of_electricity' => $source_of_electricity,
            ]);

            DB::table('economic')->insert([
                'survey_id' => $sid,
                'main_income_source' => $main_income_source,
                'work_status' => $work_status,
                'work_location_head' => trim((string)$request->input('work_location_head')),
                'monthly_salary' => trim((string)$request->input('monthly_salary')),
                'combine_monthly_income' => trim((string)$request->input('combine_monthly_income')),
            ]);

            DB::table('training')->insert([
                'survey_id' => $sid,
                'skills_for_living' => $skills_for_living,
                'specific_skill' => $specific_skill,
                'organization_member' => $organization_member,
                'specific_organization' => $specific_organization,
                'house_photo' => $house_photo_path,
                'wanttolearn' => trim((string)$request->input('wanttolearn')),
                'remarks' => trim((string)$request->input('remarks')),
                'latitude' => trim((string)$request->input('latitude')),
                'longitude' => trim((string)$request->input('longitude')),
                'respondent_signature' => $respondent_signature,
            ]);

            return $sid;
        });

        $names = $request->input('name');
        $hmCols = Schema::getColumnListing('household_mem');
        $colCivil = in_array('civilStatus', $hmCols) ? 'civilStatus' : 'civil_status';
        $colEdu = in_array('educationalAttainment', $hmCols) ? 'educationalAttainment' : 'educational_attainment';
        $colIncome = in_array('monthlyIncome', $hmCols) ? 'monthlyIncome' : 'monthly_income';
        if (is_array($names)) {
            $relationships = $request->input('relationship', []);
            $ages = $request->input('age', []);
            $civil_statuses = $request->input('civil_status', []);
            $educations = $request->input('educational_attainment', []);
            $occupations = $request->input('occupation', []);
            $incomes = $request->input('monthly_income', []);

            foreach ($names as $i => $n) {
                $n = $normalize($n);
                $rel = $normalize($relationships[$i] ?? null);
                $age = (int) ($ages[$i] ?? 0);
                $civ = $normalize($civil_statuses[$i] ?? null);
                $edu = $normalize($educations[$i] ?? null);
                $occ = $normalize($occupations[$i] ?? null);
                $inc = $normalize($incomes[$i] ?? null);

                if (empty($n) && empty($rel) && empty($age)) continue;

                $payload = [
                    'survey_id' => $survey_id,
                    'name' => $n,
                    'relationship' => $rel,
                    'age' => $age,
                    'occupation' => $occ ?? '',
                ];
                $payload[$colCivil] = $civ ?? '';
                $payload[$colEdu] = $edu ?? '';
                $payload[$colIncome] = $inc ?? '';
                DB::table('household_mem')->insert($payload);
            }
        }

        if ($allowSpouse && $spouse_name) {
            $exists = DB::table('household_mem')
                ->where('survey_id', $survey_id)
                ->where('name', $spouse_name)
                ->count();
            if ($exists === 0) {
                $payload = [
                    'survey_id' => $survey_id,
                    'name' => $spouse_name,
                    'relationship' => 'Spouse',
                    'age' => is_numeric($spouse_age) ? (int)$spouse_age : null,
                    'occupation' => null,
                ];
                $payload[$colCivil] = $marital_status;
                $payload[$colEdu] = null;
                $payload[$colIncome] = null;
                DB::table('household_mem')->insert($payload);
            }
        }

        return response()->json(['survey_id' => $survey_id]);
    }

    public function profile(Request $request)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $row = DB::table('validator')
            ->select('validator_id','username','name','email','signature_data')
            ->where('validator_id', $validator_id)
            ->first();
        if ($row && is_string($row->signature_data ?? null)) {
            $sig = trim($row->signature_data);
            if ($sig !== '' && str_starts_with($sig, 'signatures/')) {
                $row->signature_data = 'storage/'.$sig;
            }
        }
        return response()->json(['profile' => $row]);
    }

    public function updatePassword(Request $request)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'current_password' => ['required','string'],
            'password' => ['required','string','min:8','confirmed'],
        ]);

        $row = DB::table('validator')
            ->select('password')
            ->where('validator_id', $validator_id)
            ->where('status', 'approved')
            ->first();
        if (!$row) {
            return response()->json(['message' => 'Account not found'], 404);
        }
        if (!password_verify($request->input('current_password'), $row->password)) {
            return response()->json(['errors' => ['current_password' => ['Current password is incorrect']]], 422);
        }
        DB::table('validator')
            ->where('validator_id', $validator_id)
            ->update(['password' => Hash::make($request->input('password'))]);

        return response()->json(['ok' => true]);
    }

    public function adminTotals(Request $request)
    {
        $total_validated = DB::table('survey')->where('is_submitted', 1)->count();
        $total_approved = DB::table('survey')->where('is_submitted', 2)->count();
        return response()->json(['total_validated' => $total_validated, 'total_approved' => $total_approved]);
    }

    public function adminBarangay(Request $request)
    {
        $rows = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->select('d.barangay', DB::raw('COUNT(*) AS count'))
            ->whereIn('s.is_submitted', [1,2])
            ->groupBy('d.barangay')
            ->get();
        return response()->json(['data' => $rows]);
    }

    public function adminClassification(Request $request)
    {
        $years = (int) $request->get('years', 0);
        $startYear = $request->get('start_year');
        $endYear = $request->get('end_year');
        $rows = DB::table('survey as s')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->select('c.classification','d.barangay', DB::raw('COUNT(*) AS count'))
            ->whereIn('s.is_submitted', [1,2])
            ->when($startYear && $endYear, function($q) use ($startYear, $endYear) {
                $start = Carbon::createMidnightDate((int)$startYear, 1, 1)->toDateString();
                $end = Carbon::createMidnightDate((int)$endYear, 12, 31)->toDateString();
                $q->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed','>=',$start)->whereDate('s.date_interviewed','<=',$end);
            })
            ->when($years > 0, function($q) use ($years) {
                $start = Carbon::now()->subYears($years)->startOfDay()->toDateString();
                $q->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed','>=',$start);
            })
            ->groupBy('c.classification','d.barangay')
            ->get();
        $data = [];
        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
        foreach ($rows as $r) {
            $c = array_key_exists($r->classification, $classLabel) ? $classLabel[$r->classification] : ($r->classification ?: 'Unknown');
            $b = $r->barangay ?: 'Unknown';
            if (!isset($data[$c])) $data[$c] = [];
            $data[$c][$b] = (int) $r->count;
        }
        return response()->json(['classificationData' => $data]);
    }

    public function adminSubclassDisplaced(Request $request)
    {
        $rows = DB::table('survey as s')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->select('d.barangay','c.subclass_displaced', DB::raw('COUNT(*) AS count'))
            ->whereIn('s.is_submitted', [1,2])
            ->whereNotNull('c.subclass_displaced')
            ->groupBy('d.barangay','c.subclass_displaced')
            ->get()
            ->map(function($row){
                $displacedLabel = [
                    1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',
                    6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'
                ];
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? $row->subclass_displaced;
                return $row;
            });
        return response()->json(['data' => $rows]);
    }

    public function adminSubclassDoubleUp(Request $request)
    {
        $rows = DB::table('survey as s')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->select('d.barangay','c.subclass_doubleup', DB::raw('COUNT(*) AS count'))
            ->whereIn('s.is_submitted', [1,2])
            ->whereNotNull('c.subclass_doubleup')
            ->groupBy('d.barangay','c.subclass_doubleup')
            ->get()
            ->map(function($row){
                $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? $row->subclass_doubleup;
                return $row;
            });
        return response()->json(['data' => $rows]);
    }

    public function adminSubclassHomeless(Request $request)
    {
        $rows = DB::table('survey as s')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->select('d.barangay','c.subclass_homeless', DB::raw('COUNT(*) AS count'))
            ->whereIn('s.is_submitted', [1,2])
            ->whereNotNull('c.subclass_homeless')
            ->groupBy('d.barangay','c.subclass_homeless')
            ->get()
            ->map(function($row){
                $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? $row->subclass_homeless;
                return $row;
            });
        return response()->json(['data' => $rows]);
    }

    public function adminBeneficiariesValidated(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $search = trim((string)$request->get('search', ''));
        $aff = trim((string)$request->get('affiliation', ''));
        $class = trim((string)$request->get('classification', ''));
        $offset = ($page - 1) * $perPage;
        $pointsExpr = "(
            CASE WHEN classification = 'Displaced' THEN
                CASE subclass_displaced
                    WHEN 'Coastal Areas' THEN 1
                    WHEN 'Sea Level Rise' THEN 1
                    WHEN 'Drought' THEN 1
                    WHEN 'Earthquake Affected' THEN 3
                    WHEN 'Landslide Affected' THEN 3
                    WHEN 'Flood Affected' THEN 3
                    WHEN 'Threat of Eviction' THEN 1
                    WHEN 'Eviction/Demolition Order' THEN 3
                    WHEN 'Human Induced Disaster' THEN 4
                    WHEN 'Infra Projects' THEN 4
                    WHEN 'Near Waterways' THEN 1
                    ELSE 0
                END
            WHEN classification IN ('Double-up','Double-Up','Doubled-up') THEN
                CASE subclass_doubleup
                    WHEN 'Renter/Tenant' THEN 6
                    WHEN 'Rent-free/Sharer' THEN 7
                    WHEN 'Caretaker' THEN 3
                    ELSE 0
                END
            WHEN classification = 'Homeless' THEN
                CASE subclass_homeless
                    WHEN 'Public - living in tent' THEN 30
                    WHEN 'Private - living in tent' THEN 20
                    ELSE 30
                END
            WHEN classification IN ('Upgrading_of_Land_Tenure','Upgrading of Land Tenure','upgrading') THEN 10
            ELSE 0
            END
        ) + (
            CASE combine_monthly_income
                WHEN '0 - 2,999 PHP' THEN 30
                WHEN '3,000 - 5,999 PHP' THEN 25
                WHEN '6,000 - 8,999 PHP' THEN 20
                WHEN '9,000 - 12,999_PHP' THEN 15
                WHEN '13,000 and above' THEN 10
                ELSE 0
            END
        ) + (
            CASE lot_ownership WHEN 'Yes' THEN 20 WHEN 'No' THEN 0 ELSE 0 END
        ) + (
            CASE house_ownership WHEN 'Yes' THEN 30 WHEN 'No' THEN 0 ELSE 0 END
        ) + (
            CASE temporary_living_area WHEN 'Yes' THEN 50 WHEN 'No' THEN 0 ELSE 0 END
        ) + (
            CASE housing_structure
                WHEN 'Full_Concrete' THEN 3
                WHEN 'Made_of_wood_and_metal_roof' THEN 15
                WHEN 'Made_of_Amakan_and_Nipa' THEN 25
                WHEN 'Combination_of_concrete_and_wood' THEN 10
                WHEN 'Made_of_Amakan_and_metal_roof' THEN 15
                WHEN 'Others' THEN 2
                ELSE 0
            END
        ) + (
            CASE type_of_toilet
                WHEN 'Water_Sealed' THEN 20
                WHEN 'Open_Pit/Antipolo' THEN 30
                WHEN 'No_Toilet' THEN 40
                WHEN 'Others' THEN 10
                ELSE 0
            END
        ) + (
            CASE source_of_water
                WHEN 'NAWASA' THEN 4
                WHEN 'Deep_Well' THEN 15
                WHEN 'Spring' THEN 20
                WHEN 'Rainwater' THEN 25
                WHEN 'Surface_Water' THEN 30
                WHEN 'Others' THEN 6
                ELSE 0
            END
        ) + (
            CASE source_of_electricity
                WHEN 'With_own_meter' THEN 15
                WHEN 'Tapping_to_the_neighbor' THEN 25
                WHEN 'Solar_Panel' THEN 20
                WHEN 'Candle/Lamp' THEN 30
                WHEN 'Others' THEN 10
                ELSE 0
            END
        )";

        $affMap = [
            'none'=>0,'n/a'=>0,
            'sss'=>1,'gsis'=>2,'philhealth'=>3,'pagibig'=>4,
            'pwd'=>5,'senior_citizen'=>6,'solo_parent'=>7,'4ps'=>8,
        ];
        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        $base = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->leftJoin('household as h','h.survey_id','=','s.survey_id')
            ->leftJoin('economic as e','e.survey_id','=','s.survey_id')
            ->where('s.is_submitted', 1);
        if ($aff === '') {
            $base->where(function($q){ $q->whereNull('d.affiliation')->orWhere('d.affiliation',0); });
        } elseif ($aff !== '') {
            $code = $affMap[strtolower(str_replace(' ', '_', $aff))] ?? null;
            if ($code !== null) { $base->where('d.affiliation', $code); }
        }
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) { $base->where('c.classification', $code); }
        }
        if ($search !== '') {
            $base->where(function($q) use ($search) {
                $q->where('d.last_name','like',"%$search%")
                  ->orWhere('d.barangay','like',"%$search%");
            });
        }
        $total = (clone $base)->count();
        $rows = $base->select(
                's.survey_id','s.date_interviewed','d.barangay','d.last_name',
                'c.classification','c.subclass_displaced','c.subclass_doubleup','c.subclass_homeless',
                'e.combine_monthly_income',
                'h.lot_ownership','h.house_ownership','h.temporary_living_area','h.housing_structure','h.type_of_toilet','h.source_of_water','h.source_of_electricity'
            )
            ->get()
            ->map(function($row){
                $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',
                    6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'
                ];
                $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
                $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
                $arr = [
                    'classification' => $row->classification,
                    'subclass_displaced' => $row->subclass_displaced,
                    'subclass_doubleup' => $row->subclass_doubleup,
                    'subclass_homeless' => $row->subclass_homeless,
                    'combine_monthly_income' => $row->combine_monthly_income,
                    'lot_ownership' => $row->lot_ownership,
                    'house_ownership' => $row->house_ownership,
                    'temporary_living_area' => $row->temporary_living_area,
                    'housing_structure' => $row->housing_structure,
                    'type_of_toilet' => $row->type_of_toilet,
                    'source_of_water' => $row->source_of_water,
                    'source_of_electricity' => $row->source_of_electricity,
                ];
                $row->points = $this->computePoints($arr);
                return $row;
            })
            ->all();
        usort($rows, function($a,$b){ if ($a->points === $b->points) return $b->survey_id <=> $a->survey_id; return $b->points <=> $a->points; });
        $paged = array_slice($rows, $offset, $perPage);
        return response()->json(['data' => $paged, 'total' => count($rows), 'page' => $page, 'per_page' => $perPage]);
    }

    public function adminBeneficiariesApproved(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $search = trim((string)$request->get('search', ''));
        $aff = trim((string)$request->get('affiliation', ''));
        $class = trim((string)$request->get('classification', ''));
        $offset = ($page - 1) * $perPage;
        $pointsExpr = "(
            CASE WHEN classification = 'Displaced' THEN
                CASE subclass_displaced
                    WHEN 'Coastal Areas' THEN 1
                    WHEN 'Sea Level Rise' THEN 1
                    WHEN 'Drought' THEN 1
                    WHEN 'Earthquake Affected' THEN 3
                    WHEN 'Landslide Affected' THEN 3
                    WHEN 'Flood Affected' THEN 3
                    WHEN 'Threat of Eviction' THEN 1
                    WHEN 'Eviction/Demolition Order' THEN 3
                    WHEN 'Human Induced Disaster' THEN 4
                    WHEN 'Infra Projects' THEN 4
                    WHEN 'Near Waterways' THEN 1
                    ELSE 0
                END
            WHEN classification IN ('Double-up','Double-Up','Doubled-up') THEN
                CASE subclass_doubleup
                    WHEN 'Renter/Tenant' THEN 6
                    WHEN 'Rent-free/Sharer' THEN 7
                    WHEN 'Caretaker' THEN 3
                    ELSE 0
                END
            WHEN classification = 'Homeless' THEN
                CASE subclass_homeless
                    WHEN 'Public - living in tent' THEN 30
                    WHEN 'Private - living in tent' THEN 20
                    ELSE 30
                END
            WHEN classification IN ('Upgrading_of_Land_Tenure','Upgrading of Land Tenure','upgrading') THEN 10
            ELSE 0
            END
        ) + (
            CASE combine_monthly_income
                WHEN '0 - 2,999 PHP' THEN 30
                WHEN '3,000 - 5,999 PHP' THEN 25
                WHEN '6,000 - 8,999 PHP' THEN 20
                WHEN '9,000 - 12,999_PHP' THEN 15
                WHEN '13,000 and above' THEN 10
                ELSE 0
            END
        ) + (
            CASE lot_ownership WHEN 'Yes' THEN 20 WHEN 'No' THEN 0 ELSE 0 END
        ) + (
            CASE house_ownership WHEN 'Yes' THEN 30 WHEN 'No' THEN 0 ELSE 0 END
        ) + (
            CASE temporary_living_area WHEN 'Yes' THEN 50 WHEN 'No' THEN 0 ELSE 0 END
        ) + (
            CASE housing_structure
                WHEN 'Full_Concrete' THEN 3
                WHEN 'Made_of_wood_and_metal_roof' THEN 15
                WHEN 'Made_of_Amakan_and_Nipa' THEN 25
                WHEN 'Combination_of_concrete_and_wood' THEN 10
                WHEN 'Made_of_Amakan_and_metal_roof' THEN 15
                WHEN 'Others' THEN 2
                ELSE 0
            END
        ) + (
            CASE type_of_toilet
                WHEN 'Water_Sealed' THEN 20
                WHEN 'Open_Pit/Antipolo' THEN 30
                WHEN 'No_Toilet' THEN 40
                WHEN 'Others' THEN 10
                ELSE 0
            END
        ) + (
            CASE source_of_water
                WHEN 'NAWASA' THEN 4
                WHEN 'Deep_Well' THEN 15
                WHEN 'Spring' THEN 20
                WHEN 'Rainwater' THEN 25
                WHEN 'Surface_Water' THEN 30
                WHEN 'Others' THEN 6
                ELSE 0
            END
        ) + (
            CASE source_of_electricity
                WHEN 'With_own_meter' THEN 15
                WHEN 'Tapping_to_the_neighbor' THEN 25
                WHEN 'Solar_Panel' THEN 20
                WHEN 'Candle/Lamp' THEN 30
                WHEN 'Others' THEN 10
                ELSE 0
            END
        )";

        $affMap = [
            'none'=>0,'n/a'=>0,
            'sss'=>1,'gsis'=>2,'philhealth'=>3,'pagibig'=>4,
            'pwd'=>5,'senior_citizen'=>6,'solo_parent'=>7,'4ps'=>8,
        ];
        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        $base = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->leftJoin('household as h','h.survey_id','=','s.survey_id')
            ->leftJoin('economic as e','e.survey_id','=','s.survey_id')
            ->where('s.is_submitted', 2);
        if ($aff !== '') {
            $code = $affMap[strtolower(str_replace(' ', '_', $aff))] ?? null;
            if ($code !== null) { $base->where('d.affiliation', $code); }
        }
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) { $base->where('c.classification', $code); }
        }
        if ($search !== '') {
            $base->where(function($q) use ($search) {
                $q->where('d.last_name','like',"%$search%")
                  ->orWhere('d.barangay','like',"%$search%");
            });
        }
        $total = (clone $base)->count();
        $rows = $base->select(
                's.survey_id','s.date_interviewed','d.barangay','d.last_name',
                'c.classification','c.subclass_displaced','c.subclass_doubleup','c.subclass_homeless',
                'e.combine_monthly_income',
                'h.lot_ownership','h.house_ownership','h.temporary_living_area','h.housing_structure','h.type_of_toilet','h.source_of_water','h.source_of_electricity'
            )
            ->get()
            ->map(function($row){
                $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',
                    6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'
                ];
                $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
                $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
                $arr = [
                    'classification' => $row->classification,
                    'subclass_displaced' => $row->subclass_displaced,
                    'subclass_doubleup' => $row->subclass_doubleup,
                    'subclass_homeless' => $row->subclass_homeless,
                    'combine_monthly_income' => $row->combine_monthly_income,
                    'lot_ownership' => $row->lot_ownership,
                    'house_ownership' => $row->house_ownership,
                    'temporary_living_area' => $row->temporary_living_area,
                    'housing_structure' => $row->housing_structure,
                    'type_of_toilet' => $row->type_of_toilet,
                    'source_of_water' => $row->source_of_water,
                    'source_of_electricity' => $row->source_of_electricity,
                ];
                $row->points = $this->computePoints($arr);
                return $row;
            })
            ->all();
        usort($rows, function($a,$b){ if ($a->points === $b->points) return $b->survey_id <=> $a->survey_id; return $b->points <=> $a->points; });
        $paged = array_slice($rows, $offset, $perPage);
        return response()->json(['data' => $paged, 'total' => count($rows), 'page' => $page, 'per_page' => $perPage]);
    }

    public function adminBeneficiariesAffiliated(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $search = trim((string)$request->get('search', ''));
        $status = strtolower(trim((string)$request->get('status', 'submitted')));
        $aff = trim((string)$request->get('affiliation', ''));
        $class = trim((string)$request->get('classification', ''));
        $offset = ($page - 1) * $perPage;

        $pointsExpr = "(
            CASE WHEN classification = 'Displaced' THEN
                CASE subclass_displaced
                    WHEN 'Coastal Areas' THEN 1
                    WHEN 'Sea Level Rise' THEN 1
                    WHEN 'Drought' THEN 1
                    WHEN 'Earthquake Affected' THEN 3
                    WHEN 'Landslide Affected' THEN 3
                    WHEN 'Flood Affected' THEN 3
                    WHEN 'Threat of Eviction' THEN 1
                    WHEN 'Eviction/Demolition Order' THEN 3
                    WHEN 'Human Induced Disaster' THEN 4
                    WHEN 'Infra Projects' THEN 4
                    WHEN 'Near Waterways' THEN 1
                    ELSE 0
                END
            WHEN classification IN ('Double-up','Double-Up','Doubled-up') THEN
                CASE subclass_doubleup
                    WHEN 'Renter/Tenant' THEN 6
                    WHEN 'Rent-free/Sharer' THEN 7
                    WHEN 'Caretaker' THEN 3
                    ELSE 0
                END
            WHEN classification = 'Homeless' THEN
                CASE subclass_homeless
                    WHEN 'Public - living in tent' THEN 30
                    WHEN 'Private - living in tent' THEN 20
                    ELSE 30
                END
            WHEN classification IN ('Upgrading_of_Land_Tenure','Upgrading of Land Tenure','upgrading') THEN 10
            ELSE 0
            END
        ) + (
            CASE combine_monthly_income
                WHEN '0 - 2,999 PHP' THEN 30
                WHEN '3,000 - 5,999 PHP' THEN 25
                WHEN '6,000 - 8,999 PHP' THEN 20
                WHEN '9,000 - 12,999_PHP' THEN 15
                WHEN '13,000 and above' THEN 10
                ELSE 0
            END
        ) + (
            CASE lot_ownership WHEN 'Yes' THEN 20 WHEN 'No' THEN 0 ELSE 0 END
        ) + (
            CASE house_ownership WHEN 'Yes' THEN 30 WHEN 'No' THEN 0 ELSE 0 END
        ) + (
            CASE temporary_living_area WHEN 'Yes' THEN 50 WHEN 'No' THEN 0 ELSE 0 END
        ) + (
            CASE housing_structure
                WHEN 'Full_Concrete' THEN 3
                WHEN 'Made_of_wood_and_metal_roof' THEN 15
                WHEN 'Made_of_Amakan_and_Nipa' THEN 25
                WHEN 'Combination_of_concrete_and_wood' THEN 10
                WHEN 'Made_of_Amakan_and_metal_roof' THEN 15
                WHEN 'Others' THEN 2
                ELSE 0
            END
        ) + (
            CASE type_of_toilet
                WHEN 'Water_Sealed' THEN 20
                WHEN 'Open_Pit/Antipolo' THEN 30
                WHEN 'No_Toilet' THEN 40
                WHEN 'Others' THEN 10
                ELSE 0
            END
        ) + (
            CASE source_of_water
                WHEN 'NAWASA' THEN 4
                WHEN 'Deep_Well' THEN 15
                WHEN 'Spring' THEN 20
                WHEN 'Rainwater' THEN 25
                WHEN 'Surface_Water' THEN 30
                WHEN 'Others' THEN 6
                ELSE 0
            END
        ) + (
            CASE source_of_electricity
                WHEN 'With_own_meter' THEN 15
                WHEN 'Tapping_to_the_neighbor' THEN 25
                WHEN 'Solar_Panel' THEN 20
                WHEN 'Candle/Lamp' THEN 30
                WHEN 'Others' THEN 10
                ELSE 0
            END
        )";

        $affMap = [
            'none'=>0,'n/a'=>0,
            'sss'=>1,'gsis'=>2,'philhealth'=>3,'pagibig'=>4,
            'pwd'=>5,'senior_citizen'=>6,'solo_parent'=>7,'4ps'=>8,
        ];
        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        $base = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->leftJoin('household as h','h.survey_id','=','s.survey_id')
            ->leftJoin('economic as e','e.survey_id','=','s.survey_id')
            ->whereNotNull('d.affiliation')
            ->where('d.affiliation','>',0);
        if ($status === 'validated') {
            $base->where('s.is_submitted', 1);
        } elseif ($status === 'approved') {
            $base->where('s.is_submitted', 2);
        } elseif ($status === 'submitted') {
            $base->whereIn('s.is_submitted', [1,2]);
        }
        if ($aff !== '') {
            $code = $affMap[strtolower(str_replace(' ', '_', $aff))] ?? null;
            if ($code !== null) { $base->where('d.affiliation', $code); }
        }
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) { $base->where('c.classification', $code); }
        }
        if ($search !== '') {
            $base->where(function($q) use ($search) {
                $q->where('d.last_name','like',"%$search%")
                  ->orWhere('d.barangay','like',"%$search%")
                  ->orWhere('d.affiliation','like',"%$search%");
            });
        }
        $total = (clone $base)->count();
        $rows = $base->select(
                's.survey_id','s.date_interviewed','d.barangay','d.last_name',
                'c.classification','c.subclass_displaced','c.subclass_doubleup','c.subclass_homeless',
                'd.affiliation',
                'e.combine_monthly_income',
                'h.lot_ownership','h.house_ownership','h.temporary_living_area','h.housing_structure','h.type_of_toilet','h.source_of_water','h.source_of_electricity'
            )
            ->get()
            ->map(function($row){
                $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',
                    6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'
                ];
                $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
                $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];
                $affLabel = [0=>'None',1=>'SSS',2=>'GSIS',3=>'PhilHealth',4=>'PagIbig',5=>'PWD',6=>'Senior_Citizen',7=>'Solo_Parent',8=>'4Ps'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
                $row->affiliation = array_key_exists($row->affiliation, $affLabel) ? $affLabel[$row->affiliation] : $row->affiliation;
                $arr = [
                    'classification' => $row->classification,
                    'subclass_displaced' => $row->subclass_displaced,
                    'subclass_doubleup' => $row->subclass_doubleup,
                    'subclass_homeless' => $row->subclass_homeless,
                    'combine_monthly_income' => $row->combine_monthly_income,
                    'lot_ownership' => $row->lot_ownership,
                    'house_ownership' => $row->house_ownership,
                    'temporary_living_area' => $row->temporary_living_area,
                    'housing_structure' => $row->housing_structure,
                    'type_of_toilet' => $row->type_of_toilet,
                    'source_of_water' => $row->source_of_water,
                    'source_of_electricity' => $row->source_of_electricity,
                ];
                $row->points = $this->computePoints($arr);
                return $row;
            })
            ->all();
        usort($rows, function($a,$b){ if ($a->points === $b->points) return $b->survey_id <=> $a->survey_id; return $b->points <=> $a->points; });
        $paged = array_slice($rows, $offset, $perPage);
        return response()->json(['data' => $paged, 'total' => count($rows), 'page' => $page, 'per_page' => $perPage]);
    }

    public function adminSurveyDetails(Request $request, $survey_id)
    {
        $s = DB::table('survey as s')->where('s.survey_id', $survey_id)->first();
        if (!$s) { return response()->json(['message' => 'Not found'], 404); }
        $c = DB::table('classification')->where('survey_id', $survey_id)->first();
        $d = DB::table('demographic')->where('survey_id', $survey_id)->first();
        $h = DB::table('household')->where('survey_id', $survey_id)->first();
        $e = DB::table('economic')->where('survey_id', $survey_id)->first();
        $t = DB::table('training')->where('survey_id', $survey_id)->first();
        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
        $displacedLabel = [
            1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',
            6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'
        ];
        $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
        $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];
        $ynLabel = [0=>'No',1=>'Yes'];
        $genderLabel = [1=>'Male',2=>'Female'];
        $affLabel = [0=>'None',1=>'SSS',2=>'GSIS',3=>'PhilHealth',4=>'PagIbig',5=>'PWD',6=>'Senior_Citizen',7=>'Solo_Parent',8=>'4Ps'];
        $surveyArr = [];
        $surveyArr['survey_id'] = $survey_id;
        $surveyArr['interviewed_by'] = $s->interviewed_by ?? null;
        $surveyArr['date_interviewed'] = $s->date_interviewed ?? null;
        $surveyArr['is_submitted'] = $s->is_submitted ?? null;
        $surveyArr['validator_signature'] = $s->validator_signature ?? null;
        if ($c) {
            $surveyArr['previous_client'] = array_key_exists($c->previous_client, $ynLabel) ? $ynLabel[$c->previous_client] : $c->previous_client;
            $surveyArr['year_inhabited'] = $c->year_inhabited ?? null;
            $surveyArr['classification'] = array_key_exists($c->classification, $classLabel) ? $classLabel[$c->classification] : $c->classification;
            $surveyArr['subclass_displaced'] = array_key_exists($c->subclass_displaced, $displacedLabel) ? $displacedLabel[$c->subclass_displaced] : $c->subclass_displaced;
            $surveyArr['subclass_doubleup'] = array_key_exists($c->subclass_doubleup, $doubleupLabel) ? $doubleupLabel[$c->subclass_doubleup] : $c->subclass_doubleup;
            $surveyArr['subclass_homeless'] = array_key_exists($c->subclass_homeless, $homelessLabel) ? $homelessLabel[$c->subclass_homeless] : $c->subclass_homeless;
        }
        if ($d) {
            $surveyArr['interview_person'] = $d->interview_person ?? null;
            $surveyArr['last_name'] = $d->last_name ?? null;
            $surveyArr['first_name'] = $d->first_name ?? null;
            $surveyArr['middle_name'] = $d->middle_name ?? null;
            $surveyArr['suffix'] = $d->suffix ?? null;
            $surveyArr['barangay'] = $d->barangay ?? null;
            $surveyArr['purok'] = $d->purok ?? null;
            $surveyArr['street'] = $d->street ?? null;
            $surveyArr['gender'] = $d->gender ?? null;
            $surveyArr['religion'] = $d->religion ?? null;
            $surveyArr['birth_place'] = $d->birth_place ?? null;
            $surveyArr['birth_date'] = $d->birth_date ?? null;
            $surveyArr['person_age'] = $d->person_age ?? null;
            $surveyArr['marital_status'] = $d->marital_status ?? null;
            $surveyArr['contact_number'] = $d->contact_number ?? null;
            $surveyArr['language_spoken'] = $d->language_spoken ?? null;
            $surveyArr['tribe'] = $d->tribe ?? null;
            $surveyArr['highest_education'] = $d->highest_education ?? null;
            $surveyArr['last_school_name'] = $d->last_school_name ?? null;
            $surveyArr['year_graduated'] = $d->year_graduated ?? null;
            $surveyArr['spouse_name'] = $d->spouse_name ?? null;
            $surveyArr['spouse_religion'] = $d->spouse_religion ?? null;
            $surveyArr['spouse_tribe'] = $d->spouse_tribe ?? null;
            $surveyArr['spouse_age'] = $d->spouse_age ?? null;
            $surveyArr['spouse_gender'] = array_key_exists($d->spouse_gender, $genderLabel) ? $genderLabel[$d->spouse_gender] : $d->spouse_gender;
            $surveyArr['affiliation'] = array_key_exists($d->affiliation, $affLabel) ? $affLabel[$d->affiliation] : $d->affiliation;
        }
        if ($h) {
            $surveyArr['lot_ownership'] = $h->lot_ownership ?? null;
            $surveyArr['house_ownership'] = $h->house_ownership ?? null;
            $surveyArr['avail_socialized_housing'] = $h->avail_socialized_housing ?? null;
            $surveyArr['temporary_living_area'] = $h->temporary_living_area ?? null;
            $surveyArr['housing_structure'] = $h->housing_structure ?? null;
            $surveyArr['type_of_toilet'] = $h->type_of_toilet ?? null;
            $surveyArr['source_of_water'] = $h->source_of_water ?? null;
            $surveyArr['source_of_electricity'] = $h->source_of_electricity ?? null;
        }
        if ($e) {
            $surveyArr['main_income_source'] = $e->main_income_source ?? null;
            $surveyArr['work_status'] = $e->work_status ?? null;
            $surveyArr['work_location_head'] = $e->work_location_head ?? null;
            $surveyArr['monthly_salary'] = $e->monthly_salary ?? null;
            $surveyArr['combine_monthly_income'] = $e->combine_monthly_income ?? null;
        }
        if ($t) {
            $surveyArr['skills_for_living'] = $t->skills_for_living ?? null;
            $surveyArr['specific_skill'] = $t->specific_skill ?? null;
            $surveyArr['organization_member'] = $t->organization_member ?? null;
            $surveyArr['specific_organization'] = $t->specific_organization ?? null;
            $surveyArr['wanttolearn'] = $t->wanttolearn ?? null;
            $surveyArr['remarks'] = $t->remarks ?? null;
            $surveyArr['house_photo'] = $t->house_photo ?? null;
            $surveyArr['latitude'] = $t->latitude ?? null;
            $surveyArr['longitude'] = $t->longitude ?? null;
            $surveyArr['respondent_signature'] = $t->respondent_signature ?? null;
        }
        $members = DB::table('household_mem')->where('survey_id', $survey_id)->get();
        return response()->json(['survey' => $surveyArr, 'members' => $members]);
    }

    public function adminSurveyPhoto(Request $request, $survey_id)
    {
        $row = DB::table('training as t')
            ->join('survey as s','s.survey_id','=','t.survey_id')
            ->select('t.house_photo')
            ->where('t.survey_id', $survey_id)
            ->first();
        if (!$row || empty($row->house_photo)) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $p = ltrim(trim((string)$row->house_photo), '/');
        if (str_starts_with($p, 'storage/')) {
            $rel = substr($p, 8);
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($rel)) {
                $abs = \Illuminate\Support\Facades\Storage::disk('public')->path($rel);
                $mime = \Illuminate\Support\Facades\Storage::disk('public')->mimeType($rel) ?: 'image/jpeg';
                return response()->file($abs, ['Content-Type' => $mime]);
            }
        }
        $absPublic = public_path($p);
        if (file_exists($absPublic)) {
            $mime = function_exists('mime_content_type') ? mime_content_type($absPublic) : 'image/jpeg';
            return response()->file($absPublic, ['Content-Type' => $mime]);
        }
        return response()->json(['message' => 'Not found'], 404);
    }

    public function adminMapPoints(Request $request)
    {
        $scope = strtolower(trim((string)$request->get('scope', 'submitted')));
        $mode = strtolower(trim((string)$request->get('mode', 'barangay')));

        if ($mode === 'survey') {
            $rows = DB::table('survey as s')
                ->join('demographic as d','d.survey_id','=','s.survey_id')
                ->join('classification as c','c.survey_id','=','s.survey_id')
                ->leftJoin('training as t','t.survey_id','=','s.survey_id')
                ->select('s.survey_id','d.barangay','c.classification','d.first_name','d.last_name','d.middle_name','d.suffix','t.latitude','t.longitude','t.house_photo');
            if ($scope !== 'all') {
                $rows->whereIn('s.is_submitted', [1,2]);
            }
            $rows->whereNotNull('t.latitude')->whereNotNull('t.longitude');
            $rows = $rows->get();

            $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
            $points = [];
            foreach ($rows as $r) {
                $lat = is_numeric($r->latitude ?? null) ? (float)$r->latitude : null;
                $lng = is_numeric($r->longitude ?? null) ? (float)$r->longitude : null;
                if ($lat === null || $lng === null) continue;
                $nameParts = [];
                if (!empty($r->first_name)) $nameParts[] = $r->first_name;
                if (!empty($r->middle_name)) $nameParts[] = substr($r->middle_name, 0, 1) . '.';
                if (!empty($r->last_name)) $nameParts[] = $r->last_name;
                if (!empty($r->suffix)) $nameParts[] = $r->suffix;
                $name = implode(' ', $nameParts);
                $hasPhoto = !empty($r->house_photo);
                $points[] = [
                    'survey_id' => $r->survey_id,
                    'barangay' => $r->barangay ?: 'Unknown',
                    'classification' => $classLabel[$r->classification] ?? ($r->classification ?: 'Unknown'),
                    'lat' => $lat,
                    'lng' => $lng,
                    'name' => $name,
                    'has_photo' => $hasPhoto,
                    'photo_url' => $hasPhoto ? '/admin/api/survey/'.$r->survey_id.'/photo' : null,
                ];
            }
            return response()->json(['points' => $points]);
        }

        $countsQuery = DB::table('survey as s')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->select('d.barangay','c.classification', DB::raw('COUNT(*) AS count'));
        $coordsQuery = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->leftJoin('training as t','t.survey_id','=','s.survey_id')
            ->select(
                'd.barangay',
                DB::raw('MAX(t.latitude) AS latitude'),
                DB::raw('MAX(t.longitude) AS longitude')
            );

        if ($scope !== 'all') {
            $countsQuery->whereIn('s.is_submitted', [1,2]);
            $coordsQuery->whereIn('s.is_submitted', [1,2]);
        }

        $counts = $countsQuery->groupBy('d.barangay','c.classification')->get();
        $coords = $coordsQuery->groupBy('d.barangay')->get();

        $coordMap = [];
        foreach ($coords as $c) {
            $coordMap[$c->barangay ?: 'Unknown'] = [
                'lat' => is_numeric($c->latitude ?? null) ? (float)$c->latitude : null,
                'lng' => is_numeric($c->longitude ?? null) ? (float)$c->longitude : null,
            ];
        }
        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];

        $points = [];
        foreach ($counts as $row) {
            $b = $row->barangay ?: 'Unknown';
            $cls = $classLabel[$row->classification] ?? ($row->classification ?: 'Unknown');
            if (!isset($points[$b])) {
                $points[$b] = [
                    'barangay' => $b,
                    'lat' => $coordMap[$b]['lat'] ?? null,
                    'lng' => $coordMap[$b]['lng'] ?? null,
                    'counts' => [
                        'Homeless' => 0,
                        'Displaced' => 0,
                        'Double-up' => 0,
                        'Upgrading of Land Tenure' => 0,
                    ],
                    'total' => 0,
                ];
            }
            if (isset($points[$b]['counts'][$cls])) {
                $points[$b]['counts'][$cls] += (int)$row->count;
            }
            $points[$b]['total'] += (int)$row->count;
        }

        return response()->json(['points' => array_values($points)]);
    }

    protected function computePoints(array $row): int
    {
        $points = 0;
        $classification = $row['classification'] ?? '';
        $subclass_displaced = $row['subclass_displaced'] ?? '';
        $subclass_doubleup = $row['subclass_doubleup'] ?? '';
        $subclass_homeless = $row['subclass_homeless'] ?? '';

        switch ($classification) {
            case 'Displaced':
                switch ($subclass_displaced) {
                    case 'Coastal Areas':
                    case 'Sea Level Rise':
                    case 'Drought':
                    case 'Threat of Eviction':
                    case 'Near Waterways':
                        $points += 1; break;
                    case 'Earthquake Affected':
                    case 'Landslide Affected':
                    case 'Flood Affected':
                    case 'Eviction/Demolition Order':
                        $points += 3; break;
                    case 'Human Induced Disaster':
                    case 'Infra Projects':
                        $points += 4; break;
                    default: $points += 0;
                }
                break;
            case 'Double-up':
            case 'Double-Up':
            case 'Doubled-up':
                switch ($subclass_doubleup) {
                    case 'Renter/Tenant': $points += 6; break;
                    case 'Rent-free/Sharer': $points += 7; break;
                    case 'Caretaker': $points += 3; break;
                    default: $points += 0;
                }
                break;
            case 'Homeless':
                switch ($subclass_homeless) {
                    case 'Public - living in tent': $points += 30; break;
                    case 'Private - living in tent': $points += 20; break;
                    default: $points += 30;
                }
                break;
            case 'Upgrading_of_Land_Tenure':
            case 'Upgrading of Land Tenure':
            case 'upgrading':
                $points += 10; break;
            default:
                $points += 0;
        }

        switch ($row['combine_monthly_income'] ?? '') {
            case '0 - 2,999 PHP': $points += 30; break;
            case '3,000 - 5,999 PHP': $points += 25; break;
            case '6,000 - 8,999 PHP': $points += 20; break;
            case '9,000 - 12,999_PHP': $points += 15; break;
            case '13,000 and above': $points += 10; break;
            default: $points += 0;
        }

        $points += (($row['lot_ownership'] ?? '') === 'Yes') ? 20 : 0;
        $points += (($row['house_ownership'] ?? '') === 'Yes') ? 30 : 0;
        $points += (($row['temporary_living_area'] ?? '') === 'Yes') ? 50 : 0;

        switch ($row['housing_structure'] ?? '') {
            case 'Full_Concrete': $points += 3; break;
            case 'Made_of_wood_and_metal_roof': $points += 15; break;
            case 'Made_of_Amakan_and_Nipa': $points += 25; break;
            case 'Combination_of_concrete_and_wood': $points += 10; break;
            case 'Made_of_Amakan_and_metal_roof': $points += 15; break;
            case 'Others': $points += 2; break;
            default: $points += 0;
        }

        switch ($row['type_of_toilet'] ?? '') {
            case 'Water_Sealed': $points += 20; break;
            case 'Open_Pit/Antipolo': $points += 30; break;
            case 'No_Toilet': $points += 40; break;
            case 'Others': $points += 10; break;
            default: $points += 0;
        }

        switch ($row['source_of_water'] ?? '') {
            case 'NAWASA': $points += 4; break;
            case 'Deep_Well': $points += 15; break;
            case 'Spring': $points += 20; break;
            case 'Rainwater': $points += 25; break;
            case 'Surface_Water': $points += 30; break;
            case 'Others': $points += 6; break;
            default: $points += 0;
        }

        switch ($row['source_of_electricity'] ?? '') {
            case 'With_own_meter': $points += 15; break;
            case 'Tapping_to_the_neighbor': $points += 25; break;
            case 'Solar_Panel': $points += 20; break;
            case 'Candle/Lamp': $points += 30; break;
            case 'Others': $points += 10; break;
            default: $points += 0;
        }

        return (int) $points;
    }

    public function adminProfile(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $username = session('username');
        $row = DB::table('admin')
            ->select('username','email')
            ->where('username', $username)
            ->first();
        return response()->json(['profile' => $row]);
    }

    public function adminProfileUpdate(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $username = session('username');
        $email = $request->input('email');
        $password = $request->input('password');
        if (!$email && !$password) {
            return response()->json(['message' => 'No changes'], 400);
        }
        $row = DB::table('admin')->select('password')->where('username', $username)->first();
        if ($password) {
            $current = $request->input('current_password');
            $valid = $row && (password_verify($current, $row->password) || $current === $row->password);
            if (!$valid) {
                return response()->json(['errors' => ['current_password' => ['Current password is incorrect']]], 422);
            }
        }
        $update = [];
        if ($email) $update['email'] = $email;
        if ($password) $update['password'] = \Illuminate\Support\Facades\Hash::make($password);
        DB::table('admin')->where('username', $username)->update($update);
        return response()->json(['ok' => true]);
    }

    public function adminProjectSitesList(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string)$request->get('search', ''));
        $base = DB::table('siteproj');
        if ($search !== '') {
            $base->where(function($q) use ($search) {
                $q->where('project_name','like',"%$search%")
                  ->orWhere('barangay','like',"%$search%")
                  ->orWhere('year_started','like',"%$search%")
                  ->orWhere('description','like',"%$search%");
            });
        }
        $rows = $base->orderBy('project_id','desc')->get();
        $data = [];
        foreach ($rows as $r) {
            $img = is_string($r->proj_image ?? null) ? $r->proj_image : '';
            $url = null;
            if ($img !== '') {
                $rel = ltrim($img, '/');
                if (str_starts_with($rel, 'storage/')) {
                    $rel2 = substr($rel, 8);
                    $url = Storage::disk('public')->exists($rel2) ? Storage::url($rel2) : "/storage/$rel2";
                } else {
                    $url = Storage::disk('public')->exists($rel) ? Storage::url($rel) : (str_starts_with($img, '/') ? $img : "/storage/$rel");
                }
            }
            $data[] = [
                'project_id' => (int)$r->project_id,
                'project_name' => $r->project_name,
                'land_area' => $r->land_area,
                'total_blocks' => (int)($r->total_blocks ?? 0),
                'total_lots' => (int)($r->total_lots ?? 0),
                'barangay' => $r->barangay,
                'year_started' => $r->year_started,
                'description' => $r->description,
                'proj_image' => $img,
                'image_url' => $url,
            ];
        }
        return response()->json(['data' => $data]);
    }

    public function adminProjectSitesCreate(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (!Schema::hasTable('siteproj')) {
            return response()->json(['message' => 'Project sites table missing'], 422);
        }
        $validated = $request->validate([
            'project_name' => ['required','string','max:255'],
            'land_area' => ['nullable','numeric'],
            'total_blocks' => ['nullable','integer','min:0'],
            'total_lots' => ['nullable','integer','min:0'],
            'barangay' => ['nullable','string','max:100'],
            'year_started' => ['nullable','digits:4'],
            'description' => ['nullable','string'],
            'proj_image' => ['nullable','file','image','max:5120'],
        ]);

        $path = null;
        if ($request->hasFile('proj_image')) {
            $file = $request->file('proj_image');
            $filename = uniqid('proj_').'.'.$file->getClientOriginalExtension();
            $stored = $file->storeAs('projects', $filename, 'public');
            $srcAbs = Storage::disk('public')->path('projects/'.$filename);
            $pubDir = public_path('storage/projects');
            if (!is_dir($pubDir)) { @mkdir($pubDir, 0775, true); }
            $dstAbs = $pubDir.'/'.$filename;
            @copy($srcAbs, $dstAbs);
            $path = 'storage/projects/'.$filename;
        }
        $columns = Schema::getColumnListing('siteproj');
        $payload = [
            'project_name' => $validated['project_name'],
            'land_area' => $validated['land_area'] ?? 0,
            'total_blocks' => $validated['total_blocks'] ?? 0,
            'total_lots' => $validated['total_lots'] ?? 0,
            'barangay' => $validated['barangay'] ?? '',
            'year_started' => $validated['year_started'] ?? date('Y'),
            'description' => $validated['description'] ?? '',
            'proj_image' => $path ?? '',
        ];
        $filtered = array_intersect_key($payload, array_flip($columns));
        try {
            $newId = DB::table('siteproj')->insertGetId($filtered, 'project_id');
            return response()->json(['ok' => true, 'project_id' => $newId]);
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'project_id') && str_contains($msg, 'default')) {
                $maxId = DB::table('siteproj')->max('project_id');
                $nextId = is_numeric($maxId) ? ((int)$maxId + 1) : 1;
                $filtered['project_id'] = $nextId;
                DB::table('siteproj')->insert($filtered);
                return response()->json(['ok' => true, 'project_id' => $nextId]);
            }
            return response()->json(['message' => 'Failed to save project', 'error' => $msg], 500);
        }
    }

    public function adminAssignmentsPending(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string)$request->get('search',''));
        if (!Schema::hasTable('assignments')) {
            $base = DB::table('survey as s')
                ->join('demographic as d','d.survey_id','=','s.survey_id')
                ->join('classification as c','c.survey_id','=','s.survey_id')
                ->where('s.is_submitted', 2);
        } else {
            $base = DB::table('survey as s')
                ->leftJoin('assignments as a','a.survey_id','=','s.survey_id')
                ->join('demographic as d','d.survey_id','=','s.survey_id')
                ->join('classification as c','c.survey_id','=','s.survey_id')
                ->where('s.is_submitted', 2)
                ->whereNull('a.assignment_id');
        }
        if ($search !== '') {
            $base->where(function($q) use ($search) {
                $q->where('d.last_name','like',"%$search%")
                  ->orWhere('d.barangay','like',"%$search%");
            });
        }
        $rows = $base->select('s.survey_id','s.date_interviewed','d.barangay','d.last_name','c.classification','c.subclass_displaced','c.subclass_doubleup','c.subclass_homeless')
            ->orderBy('s.survey_id','desc')
            ->get()
            ->map(function($row){
                $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',
                    6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'
                ];
                $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
                $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
                return $row;
            });
        return response()->json(['data'=>$rows]);
    }

    public function adminAssignmentsList(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string)$request->get('search',''));
        if (!Schema::hasTable('assignments')) {
            return response()->json(['data' => []]);
        }
        $base = DB::table('assignments as a')
            ->join('survey as s','s.survey_id','=','a.survey_id')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->join('siteproj as p','p.project_id','=','a.project_id');
        if ($search !== '') {
            $base->where(function($q) use ($search) {
                $q->where('d.last_name','like',"%$search%")
                  ->orWhere('p.project_name','like',"%$search%")
                  ->orWhere('d.barangay','like',"%$search%")
                  ->orWhere('a.block_no','like',"%$search%")
                  ->orWhere('a.lot_no','like',"%$search%");
            });
        }
        $rows = $base->select('a.assignment_id','a.block_no','a.lot_no','a.date_assigned','p.project_id','p.project_name','s.survey_id','d.last_name','d.barangay','c.classification')
            ->orderBy('a.assignment_id','desc')
            ->get()
            ->map(function($row){
                $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                return $row;
            });
        return response()->json(['data'=>$rows]);
    }

    public function adminAssignmentsCreate(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (!Schema::hasTable('assignments')) {
            return response()->json(['message' => 'Assignments table missing'], 422);
        }
        $validated = $request->validate([
            'survey_id' => ['required','integer'],
            'project_id' => ['required','integer'],
            'block_no' => ['nullable'],
            'lot_no' => ['nullable'],
        ]);
        $exists = DB::table('assignments')->where('survey_id', $validated['survey_id'])->first();
        if ($exists) {
            return response()->json(['message' => 'Already assigned'], 422);
        }
        DB::table('assignments')->insert([
            'survey_id' => $validated['survey_id'],
            'project_id' => $validated['project_id'],
            'block_no' => $validated['block_no'] ?? null,
            'lot_no' => $validated['lot_no'] ?? null,
            'date_assigned' => now(),
        ]);
        return response()->json(['ok'=>true]);
    }

    public function adminApproveSurvey(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $survey_id = (int) $request->input('survey_id');
        if (!$survey_id) {
            return response()->json(['message' => 'Missing survey_id'], 400);
        }
        $exists = DB::table('survey')->where('survey_id', $survey_id)->first();
        if (!$exists) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $updated = DB::table('survey')->where('survey_id', $survey_id)->update(['is_submitted' => 2]);
        return response()->json(['ok' => true, 'updated' => (bool)$updated]);
    }

    public function adminDbInfo(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $dbNameRow = DB::select('SELECT DATABASE() AS db');
        $dbName = isset($dbNameRow[0]) ? ($dbNameRow[0]->db ?? null) : null;
        $versionRow = DB::select('SELECT @@version AS v');
        $version = isset($versionRow[0]) ? ($versionRow[0]->v ?? null) : null;
        $validatorCount = Schema::hasTable('validator') ? DB::table('validator')->count() : null;
        $sample = Schema::hasTable('validator') ? DB::table('validator')->select('validator_id','username','name','status')->limit(5)->get() : [];
        return response()->json([
            'db' => $dbName,
            'version' => $version,
            'host' => env('DB_HOST'),
            'port' => env('DB_PORT'),
            'user' => env('DB_USERNAME'),
            'validator_count' => $validatorCount,
            'validator_sample' => $sample,
        ]);
    }

    public function adminNotifications(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $limit = (int)($request->get('limit') ?? 10);
        $rows = DB::table('notifications')
            ->whereIn('type', ['validator_password_reset'])
            ->orderBy('id','desc')
            ->limit(max(1, $limit))
            ->get()
            ->map(function($r){
                $p = is_string($r->payload ?? null) ? json_decode($r->payload, true) : [];
                return [
                    'id' => $r->id,
                    'type' => $r->type,
                    'title' => $r->title,
                    'name' => $p['name'] ?? null,
                    'email' => $p['email'] ?? null,
                    'created_at' => $r->created_at,
                    'read' => !is_null($r->read_at),
                ];
            });
        return response()->json(['data' => $rows]);
    }

    public function adminNotificationRead(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $id = (int)$request->input('id');
        if (!$id) { return response()->json(['message' => 'Missing id'], 400); }
        DB::table('notifications')->where('id',$id)->update(['read_at' => now()]);
        return response()->json(['ok' => true]);
    }

    public function adminValidators(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string)$request->get('search', ''));
        $base = DB::table('validator');
        if ($search !== '') {
            $base->where(function($q) use ($search) {
                $q->where('name','like',"%$search%")
                  ->orWhere('username','like',"%$search%")
                  ->orWhere('email','like',"%$search%");
            });
        }
        $rows = $base->select('validator_id','name','username','email','status')->orderBy('name','asc')->get();
        return response()->json(['data' => $rows]);
    }

    public function adminValidatorUpdateStatus(Request $request, $validator_id)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $status = $request->input('status');
        if (!in_array($status, ['approved','deactivated','pending'])) {
            return response()->json(['message' => 'Invalid status'], 422);
        }
        DB::table('validator')->where('validator_id', $validator_id)->update(['status' => $status]);
        return response()->json(['ok' => true]);
    }

    public function adminValidatorCreate(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $request->validate([
            'username' => ['required','string'],
            'name' => ['required','string'],
            'email' => ['required','email'],
            'password' => ['required','string','min:8'],
            'signature_data' => ['nullable','string'],
        ]);
        $username = $request->input('username');
        $exists = DB::table('validator')->where('username', $username)->exists();
        if ($exists) {
            return response()->json(['errors' => ['username' => ['Username already taken']]], 422);
        }
        $signature_path = null;
        $sig = $request->input('signature_data');
        if ($sig) {
            $parts = explode(',', $sig);
            if (count($parts) === 2) {
                $data = base64_decode($parts[1]);
                $relative = 'signatures/'.uniqid().'.png';
                Storage::disk('public')->put($relative, $data);
                $signature_path = 'storage/'.$relative;
            } else {
                $signature_path = $sig;
            }
        }
        DB::table('validator')->insert([
            'username' => $username,
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => \Illuminate\Support\Facades\Hash::make($request->input('password')),
            'status' => 'approved',
            'signature_data' => $signature_path,
        ]);
        return response()->json(['ok' => true]);
    }

    // Mobile: sync approved validators (include password for offline login)
    public function mobileSyncValidators(Request $request)
    {
        $rows = DB::table('validator')
            ->select(
                DB::raw('CAST(validator_id AS UNSIGNED) AS id'),
                'name','email','username','password','status',
                DB::raw('created_at AS createdAt'),
                DB::raw('updated_at AS updatedAt'),
                'signature_data'
            )
            ->where('status', 'approved')
            ->get()
            ->map(function($row) {
                if (is_string($row->signature_data ?? null)) {
                    $sig = trim($row->signature_data);
                    if ($sig !== '' && str_starts_with($sig, 'signatures/')) {
                        $row->signature_data = 'storage/'.$sig;
                    }
                }
                return $row;
            })->all();
        return response()->json([
            'success' => true,
            'validators' => $rows,
            'count' => count($rows),
            'message' => 'Validators synced successfully for offline use'
        ]);
    }

    // Mobile: validate validator credentials (online login)
    public function mobileValidateValidator(Request $request)
    {
        $payload = $request->json()->all();
        $username = strtolower(trim((string)($payload['username'] ?? $request->input('username'))));
        $password = (string)($payload['password'] ?? $request->input('password'));

        $row = DB::table('validator')
            ->select(
                DB::raw('CAST(validator_id AS UNSIGNED) AS id'),
                'name','email','username','password','status',
                DB::raw('created_at AS createdAt'),
                DB::raw('updated_at AS updatedAt'),
                'signature_data'
            )
            ->whereRaw('LOWER(username) = ?', [$username])
            ->where('status','approved')
            ->first();

        if (!$row) {
            return response()->json(['success' => false, 'message' => 'Validator not found or not approved'], 404);
        }
        $stored = is_string($row->password ?? null) ? $row->password : '';
        $valid = ($stored !== '' && password_verify($password, $stored)) || $password === $stored;
        if (!$valid) {
            return response()->json(['success' => false, 'message' => 'Invalid password', 'debug' => ['username' => $username]], 401);
        }

        if (is_string($row->signature_data ?? null)) {
            $sig = trim($row->signature_data);
            if ($sig !== '' && str_starts_with($sig, 'signatures/')) {
                $row->signature_data = 'storage/'.$sig;
            }
        }
        return response()->json(['success' => true, 'validator' => $row]);
    }

    // Mobile: submit survey from app (JSON payload, base64 photo)
    public function mobileSubmitSurvey(Request $request)
    {
        $data = $request->json()->all();
        if (empty($data)) {
            $data = $request->all();
        }

        $norm = function($v) { return is_string($v) ? trim($v) : $v; };
        $val = function($key) use ($data, $norm) { return $norm($data[$key] ?? null); };

        $house_photo_blob = null;
        $house_photo_filename = null;
        $house_photo_type = null;
        $house_photo_path = null;
        $hp = $data['house_photo'] ?? $request->input('house_photo');
        if ($hp) {
            $s = is_string($hp) ? $hp : '';
            $typeFromDataUri = null;
            if (strpos($s, 'base64,') !== false) {
                $pos = strpos($s, ',');
                $head = substr($s, 0, $pos);
                $s = substr($s, $pos + 1);
                $p1 = strpos($head, ':');
                $p2 = strpos($head, ';');
                if ($p1 !== false && $p2 !== false) {
                    $typeFromDataUri = substr($head, $p1 + 1, $p2 - $p1 - 1);
                }
            }
            $decoded = base64_decode($s);
            if ($decoded !== false) {
                if (strlen($decoded) > 5 * 1024 * 1024) {
                    return response()->json(['message' => 'File too large'], 422);
                }
                $t = $val('house_photo_type') ?: $request->input('house_photo_type') ?: ($typeFromDataUri ?: 'image/jpeg');
                $allowed = ['image/jpeg','image/png','image/gif','image/jpg'];
                if (!in_array($t, $allowed)) {
                    return response()->json(['message' => 'Invalid file type'], 422);
                }
                $house_photo_blob = $decoded;
                $house_photo_filename = $val('house_photo_filename') ?: $request->input('house_photo_filename');
                $house_photo_type = $t;
            }
        }
        if (!$house_photo_blob) {
            $file = $request->file('house_photo');
            if ($file) {
                if ($file->getSize() > 5 * 1024 * 1024) {
                    return response()->json(['message' => 'File too large'], 422);
                }
                $allowed = ['image/jpeg','image/png','image/gif','image/jpg'];
                if (!in_array($file->getMimeType(), $allowed)) {
                    return response()->json(['message' => 'Invalid file type'], 422);
                }
                $house_photo_blob = file_get_contents($file->getRealPath());
                $house_photo_filename = $file->getClientOriginalName();
                $house_photo_type = $file->getMimeType();
            }
        }

        if ($house_photo_blob) {
            $ext = 'jpg';
            if ($house_photo_type === 'image/png') $ext = 'png';
            elseif ($house_photo_type === 'image/gif') $ext = 'gif';
            elseif ($house_photo_type === 'image/jpg' || $house_photo_type === 'image/jpeg') $ext = 'jpg';
            if (!$house_photo_filename || strpos($house_photo_filename, '.') === false) {
                $house_photo_filename = 'survey_' . time() . '_' . uniqid() . '.' . $ext;
            }
            Storage::disk('public')->put('survey_photos/' . $house_photo_filename, $house_photo_blob);
            $house_photo_path = 'storage/survey_photos/' . $house_photo_filename;
        }

        // Prepare variables and handle 'Others' logic
        $classification = $val('classification');
        $subclass_displaced = $val('subclass_displaced') ?: $val('sub_class_displaced');
        $subclass_doubleup = $val('subclass_doubleup') ?: $val('sub_class_double_up');
        $subclass_homeless = $val('subclass_homeless') ?: $val('sub_class_homeless');

        $housing_structure = $val('housing_structure');
        if ($housing_structure === 'Others') $housing_structure = $val('other_housing_structure');

        $type_of_toilet = $val('type_of_toilet');
        if ($type_of_toilet === 'Others') $type_of_toilet = $val('other_type_of_toilet');

        $source_of_water = $val('source_of_water');
        if ($source_of_water === 'Others') $source_of_water = $val('other_source_of_water');

        $source_of_electricity = $val('source_of_electricity');
        if ($source_of_electricity === 'Others') $source_of_electricity = $val('other_source_of_electricity');

        $main_income_source = $val('main_income_source');
        if (strtolower((string)$main_income_source) === 'others') $main_income_source = $val('other_main_income_source');

        $work_status = $val('work_status');
        if (strtolower((string)$work_status) === 'others') $work_status = $val('other_work_status');

        $skills_for_living = $val('skills_for_living');
        $specific_skill = null;
        if ($skills_for_living === 'Yes') {
            $specific_skill = $val('specific_skill');
            if (strtolower((string)$specific_skill) === 'others') $specific_skill = $val('other_skill');
        }

        $organization_member = $val('organization_member');
        $specific_organization = null;
        if ($organization_member === 'Yes') {
            $specific_organization = $val('specific_organization');
            if (strtolower((string)$specific_organization) === 'others') $specific_organization = $val('other_organization');
        }

        $marital_status = $val('marital_status');
        $allowSpouse = in_array($marital_status, ['Married','Live-in','Widow/Widower','Separated','Annulled']);
        $spouse_name = $allowSpouse ? $val('spouse_name') : null;
        $spouse_religion = $allowSpouse ? $val('spouse_religion') : null;
        $spouse_tribe = $allowSpouse ? $val('spouse_tribe') : null;
        $spouse_age = $allowSpouse ? $val('spouse_age') : null;
        $spouse_gender = $allowSpouse ? $val('spouse_gender') : null;

        $survey_id = DB::transaction(function() use ($data, $val, $classification, $subclass_displaced, $subclass_doubleup, $subclass_homeless, $housing_structure, $type_of_toilet, $source_of_water, $source_of_electricity, $main_income_source, $work_status, $skills_for_living, $specific_skill, $organization_member, $specific_organization, $house_photo_path, $marital_status, $spouse_name, $spouse_religion, $spouse_tribe, $spouse_age, $spouse_gender) {
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

            $classificationCode = $classMap[strtolower((string)$classification)] ?? null;
            $subDisplacedCode = $subclass_displaced ? ($displacedMap[strtolower((string)$subclass_displaced)] ?? null) : null;
            $subDoubleupCode = $subclass_doubleup ? ($doubleupMap[strtolower((string)$subclass_doubleup)] ?? null) : null;
            $subHomelessCode = $subclass_homeless ? ($homelessMap[strtolower((string)$subclass_homeless)] ?? null) : null;
            $prevClientCode = $yn($val('previous_client'));
            $spouseGenderCode = $genderMap[strtolower((string)$spouse_gender)] ?? null;
            $affRaw = strtolower(str_replace(' ', '_', (string)$val('affiliation')));
            $affCode = $affMap[$affRaw] ?? 0;

            $sid = DB::table('survey')->insertGetId([
                'validator_id' => (int)($data['validator_id'] ?? 1),
                'interviewed_by' => $val('interviewed_by'),
                'date_interviewed' => $val('date_interviewed'),
                'is_submitted' => (int)($data['is_submitted'] ?? 0),
                'validator_signature' => $val('validator_signature'),
            ]);

            DB::table('classification')->insert([
                'survey_id' => $sid,
                'previous_client' => $prevClientCode,
                'year_inhabited' => $toInt($val('year_inhabited')),
                'classification' => $classificationCode,
                'subclass_displaced' => $subDisplacedCode,
                'subclass_doubleup' => $subDoubleupCode,
                'subclass_homeless' => $subHomelessCode,
            ]);

            DB::table('demographic')->insert([
                'survey_id' => $sid,
                'interview_person' => $val('interview_person'),
                'last_name' => $val('last_name'),
                'first_name' => $val('first_name'),
                'middle_name' => $val('middle_name'),
                'suffix' => $val('suffix'),
                'barangay' => $val('barangay'),
                'purok' => $val('purok'),
                'street' => $val('street'),
                'gender' => $val('gender'),
                'religion' => $val('religion'),
                'birth_place' => $val('birth_place'),
                'birth_date' => $val('birth_date'),
                'person_age' => $toInt($val('person_age')),
                'marital_status' => $marital_status,
                'contact_number' => $val('contact_number'),
                'language_spoken' => $val('language_spoken'),
                'tribe' => $val('tribe'),
                'highest_education' => $val('highest_education'),
                'last_school_name' => $val('last_school_name'),
                'year_graduated' => $toInt($val('year_graduated')),
                'spouse_name' => $spouse_name,
                'spouse_religion' => $spouse_religion,
                'spouse_tribe' => $spouse_tribe,
                'spouse_age' => $toInt($spouse_age),
                'spouse_gender' => $spouseGenderCode,
                'affiliation' => $affCode,
            ]);

            DB::table('household')->insert([
                'survey_id' => $sid,
                'lot_ownership' => $val('lot_ownership'),
                'house_ownership' => $val('house_ownership'),
                'avail_socialized_housing' => $val('avail_socialized_housing'),
                'temporary_living_area' => $val('temporary_living_area'),
                'housing_structure' => $housing_structure,
                'type_of_toilet' => $type_of_toilet,
                'source_of_water' => $source_of_water,
                'source_of_electricity' => $source_of_electricity,
            ]);

            DB::table('economic')->insert([
                'survey_id' => $sid,
                'main_income_source' => $main_income_source,
                'work_status' => $work_status,
                'work_location_head' => $val('work_location_head'),
                'monthly_salary' => $val('monthly_salary'),
                'combine_monthly_income' => $val('combine_monthly_income'),
            ]);

            DB::table('training')->insert([
                'survey_id' => $sid,
                'skills_for_living' => $skills_for_living,
                'specific_skill' => $specific_skill,
                'organization_member' => $organization_member,
                'specific_organization' => $specific_organization,
                'house_photo' => $house_photo_path ?: '',
                'wanttolearn' => $val('wanttolearn'),
                'remarks' => $val('remarks'),
                'latitude' => $val('latitude'),
                'longitude' => $val('longitude'),
                'respondent_signature' => $val('respondent_signature'),
            ]);

            return $sid;
        });

        // Household members
        $members = $data['household_members'] ?? $data['members'] ?? [];
        if (is_array($members)) {
            foreach ($members as $m) {
                DB::table('household_mem')->insert([
                    'survey_id' => $survey_id,
                    'name' => $m['name'] ?? null,
                    'age' => isset($m['age']) ? (int)$m['age'] : null,
                    'sex' => $m['sex'] ?? null,
                    'relationship' => $m['relationship'] ?? null,
                    'civil_status' => $m['civilStatus'] ?? ($m['civil_status'] ?? null),
                    'educational_attainment' => $m['educationalAttainment'] ?? ($m['educational_attainment'] ?? null),
                    'occupation' => $m['occupation'] ?? null,
                    'monthly_income' => $m['monthlyIncome'] ?? ($m['monthly_income'] ?? null),
                ]);
            }
        }

        if ($allowSpouse && $spouse_name) {
            $exists = DB::table('household_mem')
                ->where('survey_id', $survey_id)
                ->where('name', $spouse_name)
                ->count();
            if ($exists === 0) {
                DB::table('household_mem')->insert([
                    'survey_id' => $survey_id,
                    'name' => $spouse_name,
                    'age' => isset($spouse_age) && is_numeric($spouse_age) ? (int)$spouse_age : null,
                    'sex' => $spouse_gender,
                    'relationship' => 'Spouse',
                    'civil_status' => $marital_status,
                    'educational_attainment' => null,
                    'occupation' => null,
                    'monthly_income' => null,
                ]);
            }
        }

        return response()->json(['success' => true, 'survey_id' => $survey_id, 'message' => 'Survey submitted successfully']);
    }

    // Mobile: simple connectivity test
    public function mobilePing(Request $request)
    {
        return response()->json(['success' => true, 'message' => 'Server is reachable', 'timestamp' => date('Y-m-d H:i:s')]);
    }
}
