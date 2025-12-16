<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
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

        $total_surveyed = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->where('s.validator_id', $validator_id)
            ->distinct('s.survey_id')
            ->count('s.survey_id');

        $total_submitted = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->where('s.validator_id', $validator_id)
            ->whereIn('s.is_submitted', [1,2])
            ->distinct('s.survey_id')
            ->count('s.survey_id');

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
            ->orderBy('d.barangay','asc')
            ->orderBy('c.classification','asc')
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
            ->orderBy('d.barangay','asc')
            ->orderBy('c.classification','asc')
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
            $surveyArr['affiliations'] = $d->affiliations ?? null;
            $surveyArr['tag_number'] = $d->tag_number ?? null;
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
            $surveyArr['person_photo'] = $t->person_photo ?? null;
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
            if (Str::startsWith($p, 'storage/')) {
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

    public function surveyPersonPhoto(Request $request, $survey_id)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $row = DB::table('training as t')
            ->join('survey as s', 's.survey_id', '=', 't.survey_id')
            ->select('t.person_photo')
            ->where('t.survey_id', $survey_id)
            ->where('s.validator_id', $validator_id)
            ->first();

        if (!$row || empty($row->person_photo)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $pathStr = trim((string)$row->person_photo);
        $ctype = 'image/jpeg';
        if ($pathStr !== '') {
            $p = ltrim($pathStr, '/');
            if (Str::startsWith($p, 'storage/')) {
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

        $person_photo_path = null;
        $personFile = $request->file('person_photo');
        if ($personFile) {
            if ($personFile->getSize() > 5 * 1024 * 1024) {
                return response()->json(['message' => 'File too large'], 422);
            }
            $allowed = ['image/jpeg','image/png','image/gif','image/jpg'];
            if (!in_array($personFile->getMimeType(), $allowed)) {
                return response()->json(['message' => 'Invalid file type'], 422);
            }
            $ext = $personFile->getClientOriginalExtension() ?: 'jpg';
            $filename = uniqid('person_').'.'.$ext;
            \Illuminate\Support\Facades\Storage::disk('public')->putFileAs('person_photos', $personFile, $filename);
            $person_photo_path = 'storage/person_photos/'.$filename;
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

        $survey_id = DB::transaction(function() use ($validator_id, $interviewed_by, $request, $classification, $subclass_displaced, $subclass_doubleup, $subclass_homeless, $housing_structure, $type_of_toilet, $source_of_water, $source_of_electricity, $main_income_source, $work_status, $skills_for_living, $specific_skill, $organization_member, $specific_organization, $house_photo_path, $person_photo_path, $validator_signature, $respondent_signature, $marital_status, $spouse_name, $spouse_religion, $spouse_tribe, $spouse_age, $spouse_gender, $normalize) {
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

            $classificationCode = $classMap[strtolower((string)$classification)] ?? null;
            $subDisplacedCode = $subclass_displaced ? ($displacedMap[strtolower((string)$subclass_displaced)] ?? null) : null;
            $subDoubleupCode = $subclass_doubleup ? ($doubleupMap[strtolower((string)$subclass_doubleup)] ?? null) : null;
            $subHomelessCode = $subclass_homeless ? ($homelessMap[strtolower((string)$subclass_homeless)] ?? null) : null;
            $prevClientCode = $yn($request->input('previous_client'));
            $spouseGenderStr = is_string($spouse_gender) ? $spouse_gender : null;
            $affPrimary = $normalize($request->input('affiliation'));
            $barangayVal = trim((string)$request->input('barangay'));
            $tagNumber = $this->generateTagNumber($barangayVal);
            $affiliations = trim((string)$request->input('affiliations'));
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
                'barangay' => $barangayVal,
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
                'spouse_gender' => $spouseGenderStr,
                'affiliation' => $affPrimary,
                'affiliations' => $affiliations,
                'endorsed_by_mayor' => $yn($request->input('endorsed_by_mayor')),
                'tag_number' => $tagNumber,
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
                'person_photo' => $person_photo_path,
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
                    'occupation' => 'N/A',
                ];
                $payload[$colCivil] = $marital_status;
                $payload[$colEdu] = 'N/A';
                $payload[$colIncome] = 'N/A';
                DB::table('household_mem')->insert($payload);
            }
        }

        return response()->json(['survey_id' => $survey_id, 'tag_number' => DB::table('demographic')->where('survey_id', $survey_id)->value('tag_number')]);
        }

    public function profile(Request $request)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $row = DB::table('validator')
            ->select('validator_id','username','name','email')
            ->where('validator_id', $validator_id)
            ->first();
        return response()->json(['profile' => $row]);
    }

    public function updatePassword(Request $request)
    {
        return response()->json(['message' => 'Password changes require a reset token. Use the reset link sent to your email.'], 403);
    }

    public function previewTagNumber(Request $request)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string)$request->get('barangay', ''));
        if ($barangay === '') {
            return response()->json(['message' => 'Missing barangay'], 400);
        }
        $code = $this->getBarangayCode($barangay);
        $maxTag = DB::table('demographic')
            ->where('barangay', $barangay)
            ->where('tag_number', 'like', $code . '%')
            ->max('tag_number');
        $nextSeq = 1;
        if ($maxTag) {
            $numericPart = substr($maxTag, 1);
            $parsed = (int)$numericPart;
            if ($parsed > 0) {
                $nextSeq = $parsed + 1;
            }
        }
        $seqStr = str_pad((string)$nextSeq, 3, '0', STR_PAD_LEFT);
        $tagNumber = $code . $seqStr;
        return response()->json(['tag_number' => $tagNumber]);
    }

    public function adminTotals(Request $request)
    {
        $total_validated = DB::table('survey')->where('is_submitted', 1)->count();
        $total_approved = DB::table('survey')->where('is_submitted', 2)->count();
        $total_overall = DB::table('survey')->whereIn('is_submitted', [1,2])->count();
        return response()->json(['total_validated' => $total_validated, 'total_approved' => $total_approved, 'total_overall' => $total_overall]);
    }

    public function adminBarangay(Request $request)
    {
        $years = (int) $request->get('years', 0);
        $startYear = $request->get('start_year');
        $endYear = $request->get('end_year');
        $rows = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->select('d.barangay', DB::raw('COUNT(*) AS count'))
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
        $barangay = trim((string)$request->get('barangay', ''));
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
            ->whereIn('s.is_submitted', [1,2])
            ->where(function($q){
                $q->whereNull('d.endorsed_by_mayor')
                  ->orWhere('d.endorsed_by_mayor', 0);
            });
        if ($aff === '') {
            $base->where(function($q){
                $q->whereNull('d.affiliation')
                  ->orWhere('d.affiliation','')
                  ->orWhere('d.affiliation','None')
                  ->orWhere('d.affiliation','N/A');
            });
        } elseif ($aff !== '') {
            $affStr = str_replace('_',' ', $aff);
            $base->where('d.affiliation', $affStr);
        }
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) { $base->where('c.classification', $code); }
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
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
        usort($rows, function($a,$b){
            $bg = strcmp((string)$a->barangay, (string)$b->barangay);
            if ($bg !== 0) return $bg;
            $cl = strcmp((string)$a->classification, (string)$b->classification);
            if ($cl !== 0) return $cl;
            if ($a->points === $b->points) return $b->survey_id <=> $a->survey_id;
            return $b->points <=> $a->points;
        });
        $paged = array_slice($rows, $offset, $perPage);
        return response()->json(['data' => $paged, 'total' => count($rows), 'page' => $page, 'per_page' => $perPage]);
    }

    public function adminBeneficiariesApproved(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $search = trim((string)$request->get('search', ''));
        $barangay = trim((string)$request->get('barangay', ''));
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
            ->whereIn('s.is_submitted', [1,2]);
        if ($aff !== '') {
            $affStr = str_replace('_',' ', $aff);
            $base->where('d.affiliation', $affStr);
        }
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) { $base->where('c.classification', $code); }
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
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
        usort($rows, function($a,$b){
            $bg = strcmp((string)$a->barangay, (string)$b->barangay);
            if ($bg !== 0) return $bg;
            $cl = strcmp((string)$a->classification, (string)$b->classification);
            if ($cl !== 0) return $cl;
            if ($a->points === $b->points) return $b->survey_id <=> $a->survey_id;
            return $b->points <=> $a->points;
        });
        $paged = array_slice($rows, $offset, $perPage);
        return response()->json(['data' => $paged, 'total' => count($rows), 'page' => $page, 'per_page' => $perPage]);
    }

    public function adminBeneficiariesAffiliated(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $search = trim((string)$request->get('search', ''));
        $status = strtolower(trim((string)$request->get('status', 'validated')));
        $barangay = trim((string)$request->get('barangay', ''));
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
            ->where('d.affiliation','<>','')
            ->whereNotIn('d.affiliation', ['None','N/A'])
            ->where(function($q){
                $q->whereNull('d.endorsed_by_mayor')
                  ->orWhere('d.endorsed_by_mayor', 0);
            });
        if ($status === 'validated') {
            $base->where('s.is_submitted', 1);
        } elseif ($status === 'approved') {
            $base->where('s.is_submitted', 2);
        } elseif ($status === 'submitted') {
            $base->whereIn('s.is_submitted', [1,2]);
        }
        if ($aff !== '') {
            $affStr = str_replace('_',' ', $aff);
            $base->where('d.affiliation', $affStr);
        }
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) { $base->where('c.classification', $code); }
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
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
            $row->affiliation = is_string($row->affiliation) ? $row->affiliation : ($affLabel[$row->affiliation] ?? $row->affiliation);
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
        usort($rows, function($a,$b){
            $bg = strcmp((string)$a->barangay, (string)$b->barangay);
            if ($bg !== 0) return $bg;
            $cl = strcmp((string)$a->classification, (string)$b->classification);
            if ($cl !== 0) return $cl;
            if ($a->points === $b->points) return $b->survey_id <=> $a->survey_id;
            return $b->points <=> $a->points;
        });
        $paged = array_slice($rows, $offset, $perPage);
        return response()->json(['data' => $paged, 'total' => count($rows), 'page' => $page, 'per_page' => $perPage]);
    }

    public function adminBeneficiariesMayorEndorsed(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $search = trim((string)$request->get('search', ''));
        $class = trim((string)$request->get('classification', ''));
        $barangay = trim((string)$request->get('barangay', ''));
        $offset = ($page - 1) * $perPage;

        $base = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->leftJoin('household as h','h.survey_id','=','s.survey_id')
            ->leftJoin('economic as e','e.survey_id','=','s.survey_id')
            ->where('d.endorsed_by_mayor', 1)
            ->whereIn('s.is_submitted', [1,2]);

        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) { $base->where('c.classification', $code); }
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
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
        usort($rows, function($a,$b){
            $bg = strcmp((string)$a->barangay, (string)$b->barangay);
            if ($bg !== 0) return $bg;
            $cl = strcmp((string)$a->classification, (string)$b->classification);
            if ($cl !== 0) return $cl;
            if ($a->points === $b->points) return $b->survey_id <=> $a->survey_id;
            return $b->points <=> $a->points;
        });
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
            $surveyArr['affiliations'] = $d->affiliations ?? null;
            $surveyArr['tag_number'] = $d->tag_number ?? null;
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
            $surveyArr['person_photo'] = $t->person_photo ?? null;
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
        if (Str::startsWith($p, 'storage/')) {
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

    public function adminSurveyPersonPhoto(Request $request, $survey_id)
    {
        $row = DB::table('training as t')
            ->join('survey as s','s.survey_id','=','t.survey_id')
            ->select('t.person_photo')
            ->where('t.survey_id', $survey_id)
            ->first();
        if (!$row || empty($row->person_photo)) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $p = ltrim(trim((string)$row->person_photo), '/');
        if (Str::startsWith($p, 'storage/')) {
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

    public function exportSurveyCsv(Request $request, $survey_id)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $s = DB::table('survey as s')
            ->where('s.survey_id', $survey_id)
            ->where('s.validator_id', $validator_id)
            ->first();
        if (!$s) { return response()->json(['message' => 'Not found'], 404); }

        $c = DB::table('classification')->where('survey_id', $survey_id)->first();
        $d = DB::table('demographic')->where('survey_id', $survey_id)->first();
        $h = DB::table('household')->where('survey_id', $survey_id)->first();
        $e = DB::table('economic')->where('survey_id', $survey_id)->first();
        $t = DB::table('training')->where('survey_id', $survey_id)->first();
        $members = DB::table('household_mem')->where('survey_id', $survey_id)->get();

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

        $csv = fopen('php://temp','w+');
        fputcsv($csv, ['Section','Field','Value']);

        // Survey meta
        fputcsv($csv, ['Survey','survey_id',$survey_id]);
        fputcsv($csv, ['Survey','interviewed_by',$s->interviewed_by ?? '']);
        fputcsv($csv, ['Survey','date_interviewed',$s->date_interviewed ?? '']);
        fputcsv($csv, ['Survey','is_submitted',$s->is_submitted ?? '']);

        if ($c) {
            fputcsv($csv, ['Classification','previous_client', array_key_exists($c->previous_client, $ynLabel) ? $ynLabel[$c->previous_client] : ($c->previous_client ?? '')]);
            fputcsv($csv, ['Classification','year_inhabited',$c->year_inhabited ?? '']);
            fputcsv($csv, ['Classification','classification', array_key_exists($c->classification, $classLabel) ? $classLabel[$c->classification] : ($c->classification ?? '')]);
            fputcsv($csv, ['Classification','subclass_displaced', array_key_exists($c->subclass_displaced, $displacedLabel) ? $displacedLabel[$c->subclass_displaced] : ($c->subclass_displaced ?? '')]);
            fputcsv($csv, ['Classification','subclass_doubleup', array_key_exists($c->subclass_doubleup, $doubleupLabel) ? $doubleupLabel[$c->subclass_doubleup] : ($c->subclass_doubleup ?? '')]);
            fputcsv($csv, ['Classification','subclass_homeless', array_key_exists($c->subclass_homeless, $homelessLabel) ? $homelessLabel[$c->subclass_homeless] : ($c->subclass_homeless ?? '')]);
        }

        if ($d) {
            fputcsv($csv, ['Demographic','interview_person',$d->interview_person ?? '']);
            fputcsv($csv, ['Demographic','last_name',$d->last_name ?? '']);
            fputcsv($csv, ['Demographic','first_name',$d->first_name ?? '']);
            fputcsv($csv, ['Demographic','middle_name',$d->middle_name ?? '']);
            fputcsv($csv, ['Demographic','suffix',$d->suffix ?? '']);
            fputcsv($csv, ['Demographic','barangay',$d->barangay ?? '']);
            fputcsv($csv, ['Demographic','purok',$d->purok ?? '']);
            fputcsv($csv, ['Demographic','street',$d->street ?? '']);
            fputcsv($csv, ['Demographic','gender',$d->gender ?? '']);
            fputcsv($csv, ['Demographic','religion',$d->religion ?? '']);
            fputcsv($csv, ['Demographic','birth_place',$d->birth_place ?? '']);
            fputcsv($csv, ['Demographic','birth_date',$d->birth_date ?? '']);
            fputcsv($csv, ['Demographic','person_age',$d->person_age ?? '']);
            fputcsv($csv, ['Demographic','marital_status',$d->marital_status ?? '']);
            fputcsv($csv, ['Demographic','contact_number',$d->contact_number ?? '']);
            fputcsv($csv, ['Demographic','language_spoken',$d->language_spoken ?? '']);
            fputcsv($csv, ['Demographic','tribe',$d->tribe ?? '']);
            fputcsv($csv, ['Demographic','highest_education',$d->highest_education ?? '']);
            fputcsv($csv, ['Demographic','last_school_name',$d->last_school_name ?? '']);
            fputcsv($csv, ['Demographic','year_graduated',$d->year_graduated ?? '']);
            fputcsv($csv, ['Demographic','spouse_name',$d->spouse_name ?? '']);
            fputcsv($csv, ['Demographic','spouse_religion',$d->spouse_religion ?? '']);
            fputcsv($csv, ['Demographic','spouse_tribe',$d->spouse_tribe ?? '']);
            fputcsv($csv, ['Demographic','spouse_age',$d->spouse_age ?? '']);
            fputcsv($csv, ['Demographic','spouse_gender', array_key_exists($d->spouse_gender, $genderLabel) ? $genderLabel[$d->spouse_gender] : ($d->spouse_gender ?? '')]);
            fputcsv($csv, ['Demographic','affiliation', array_key_exists($d->affiliation, $affLabel) ? $affLabel[$d->affiliation] : ($d->affiliation ?? '')]);
        }

        if ($h) {
            fputcsv($csv, ['Household','lot_ownership',$h->lot_ownership ?? '']);
            fputcsv($csv, ['Household','house_ownership',$h->house_ownership ?? '']);
            fputcsv($csv, ['Household','avail_socialized_housing',$h->avail_socialized_housing ?? '']);
            fputcsv($csv, ['Household','temporary_living_area',$h->temporary_living_area ?? '']);
            fputcsv($csv, ['Household','housing_structure',$h->housing_structure ?? '']);
            fputcsv($csv, ['Household','type_of_toilet',$h->type_of_toilet ?? '']);
            fputcsv($csv, ['Household','source_of_water',$h->source_of_water ?? '']);
            fputcsv($csv, ['Household','source_of_electricity',$h->source_of_electricity ?? '']);
        }

        if ($e) {
            fputcsv($csv, ['Economic','main_income_source',$e->main_income_source ?? '']);
            fputcsv($csv, ['Economic','work_status',$e->work_status ?? '']);
            fputcsv($csv, ['Economic','work_location_head',$e->work_location_head ?? '']);
            fputcsv($csv, ['Economic','monthly_salary',$e->monthly_salary ?? '']);
            fputcsv($csv, ['Economic','combine_monthly_income',$e->combine_monthly_income ?? '']);
        }

        if ($t) {
            fputcsv($csv, ['Training','skills_for_living',$t->skills_for_living ?? '']);
            fputcsv($csv, ['Training','specific_skill',$t->specific_skill ?? '']);
            fputcsv($csv, ['Training','organization_member',$t->organization_member ?? '']);
            fputcsv($csv, ['Training','specific_organization',$t->specific_organization ?? '']);
            fputcsv($csv, ['Training','wanttolearn',$t->wanttolearn ?? '']);
            fputcsv($csv, ['Training','remarks',$t->remarks ?? '']);
            fputcsv($csv, ['Training','latitude',$t->latitude ?? '']);
            fputcsv($csv, ['Training','longitude',$t->longitude ?? '']);
        }

        foreach ($members as $i => $m) {
            $idx = $i + 1;
            fputcsv($csv, ['Member '.$idx,'name',$m->name ?? '']);
            fputcsv($csv, ['Member '.$idx,'relationship',$m->relationship ?? '']);
            fputcsv($csv, ['Member '.$idx,'age', isset($m->age) ? $m->age : '']);
            fputcsv($csv, ['Member '.$idx,'occupation',$m->occupation ?? '']);
            $cs = property_exists($m,'civilStatus') ? $m->civilStatus : (property_exists($m,'civil_status') ? $m->civil_status : null);
            $edu = property_exists($m,'educationalAttainment') ? $m->educationalAttainment : (property_exists($m,'educational_attainment') ? $m->educational_attainment : null);
            $inc = property_exists($m,'monthlyIncome') ? $m->monthlyIncome : (property_exists($m,'monthly_income') ? $m->monthly_income : null);
            fputcsv($csv, ['Member '.$idx,'civil_status',$cs ?? '']);
            fputcsv($csv, ['Member '.$idx,'educational_attainment',$edu ?? '']);
            fputcsv($csv, ['Member '.$idx,'monthly_income',$inc ?? '']);
        }

        rewind($csv);
        $out = stream_get_contents($csv);
        fclose($csv);
        $filename = 'survey-'.$survey_id.'.csv';
        return response($out, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"'
        ]);
    }

    public function adminExportSurveyCsv(Request $request, $survey_id)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $s = DB::table('survey as s')->where('s.survey_id', $survey_id)->first();
        if (!$s) { return response()->json(['message' => 'Not found'], 404); }

        $c = DB::table('classification')->where('survey_id', $survey_id)->first();
        $d = DB::table('demographic')->where('survey_id', $survey_id)->first();
        $h = DB::table('household')->where('survey_id', $survey_id)->first();
        $e = DB::table('economic')->where('survey_id', $survey_id)->first();
        $t = DB::table('training')->where('survey_id', $survey_id)->first();
        $members = DB::table('household_mem')->where('survey_id', $survey_id)->get();

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

        $csv = fopen('php://temp','w+');
        fputcsv($csv, ['Section','Field','Value']);

        // Survey meta
        fputcsv($csv, ['Survey','survey_id',$survey_id]);
        fputcsv($csv, ['Survey','interviewed_by',$s->interviewed_by ?? '']);
        fputcsv($csv, ['Survey','date_interviewed',$s->date_interviewed ?? '']);
        fputcsv($csv, ['Survey','is_submitted',$s->is_submitted ?? '']);

        if ($c) {
            fputcsv($csv, ['Classification','previous_client', array_key_exists($c->previous_client, $ynLabel) ? $ynLabel[$c->previous_client] : ($c->previous_client ?? '')]);
            fputcsv($csv, ['Classification','year_inhabited',$c->year_inhabited ?? '']);
            fputcsv($csv, ['Classification','classification', array_key_exists($c->classification, $classLabel) ? $classLabel[$c->classification] : ($c->classification ?? '')]);
            fputcsv($csv, ['Classification','subclass_displaced', array_key_exists($c->subclass_displaced, $displacedLabel) ? $displacedLabel[$c->subclass_displaced] : ($c->subclass_displaced ?? '')]);
            fputcsv($csv, ['Classification','subclass_doubleup', array_key_exists($c->subclass_doubleup, $doubleupLabel) ? $doubleupLabel[$c->subclass_doubleup] : ($c->subclass_doubleup ?? '')]);
            fputcsv($csv, ['Classification','subclass_homeless', array_key_exists($c->subclass_homeless, $homelessLabel) ? $homelessLabel[$c->subclass_homeless] : ($c->subclass_homeless ?? '')]);
        }

        if ($d) {
            fputcsv($csv, ['Demographic','interview_person',$d->interview_person ?? '']);
            fputcsv($csv, ['Demographic','last_name',$d->last_name ?? '']);
            fputcsv($csv, ['Demographic','first_name',$d->first_name ?? '']);
            fputcsv($csv, ['Demographic','middle_name',$d->middle_name ?? '']);
            fputcsv($csv, ['Demographic','suffix',$d->suffix ?? '']);
            fputcsv($csv, ['Demographic','barangay',$d->barangay ?? '']);
            fputcsv($csv, ['Demographic','purok',$d->purok ?? '']);
            fputcsv($csv, ['Demographic','street',$d->street ?? '']);
            fputcsv($csv, ['Demographic','gender',$d->gender ?? '']);
            fputcsv($csv, ['Demographic','religion',$d->religion ?? '']);
            fputcsv($csv, ['Demographic','birth_place',$d->birth_place ?? '']);
            fputcsv($csv, ['Demographic','birth_date',$d->birth_date ?? '']);
            fputcsv($csv, ['Demographic','person_age',$d->person_age ?? '']);
            fputcsv($csv, ['Demographic','marital_status',$d->marital_status ?? '']);
            fputcsv($csv, ['Demographic','contact_number',$d->contact_number ?? '']);
            fputcsv($csv, ['Demographic','language_spoken',$d->language_spoken ?? '']);
            fputcsv($csv, ['Demographic','tribe',$d->tribe ?? '']);
            fputcsv($csv, ['Demographic','highest_education',$d->highest_education ?? '']);
            fputcsv($csv, ['Demographic','last_school_name',$d->last_school_name ?? '']);
            fputcsv($csv, ['Demographic','year_graduated',$d->year_graduated ?? '']);
            fputcsv($csv, ['Demographic','spouse_name',$d->spouse_name ?? '']);
            fputcsv($csv, ['Demographic','spouse_religion',$d->spouse_religion ?? '']);
            fputcsv($csv, ['Demographic','spouse_tribe',$d->spouse_tribe ?? '']);
            fputcsv($csv, ['Demographic','spouse_age',$d->spouse_age ?? '']);
            fputcsv($csv, ['Demographic','spouse_gender', array_key_exists($d->spouse_gender, $genderLabel) ? $genderLabel[$d->spouse_gender] : ($d->spouse_gender ?? '')]);
            fputcsv($csv, ['Demographic','affiliation', array_key_exists($d->affiliation, $affLabel) ? $affLabel[$d->affiliation] : ($d->affiliation ?? '')]);
        }

        if ($h) {
            fputcsv($csv, ['Household','lot_ownership',$h->lot_ownership ?? '']);
            fputcsv($csv, ['Household','house_ownership',$h->house_ownership ?? '']);
            fputcsv($csv, ['Household','avail_socialized_housing',$h->avail_socialized_housing ?? '']);
            fputcsv($csv, ['Household','temporary_living_area',$h->temporary_living_area ?? '']);
            fputcsv($csv, ['Household','housing_structure',$h->housing_structure ?? '']);
            fputcsv($csv, ['Household','type_of_toilet',$h->type_of_toilet ?? '']);
            fputcsv($csv, ['Household','source_of_water',$h->source_of_water ?? '']);
            fputcsv($csv, ['Household','source_of_electricity',$h->source_of_electricity ?? '']);
        }

        if ($e) {
            fputcsv($csv, ['Economic','main_income_source',$e->main_income_source ?? '']);
            fputcsv($csv, ['Economic','work_status',$e->work_status ?? '']);
            fputcsv($csv, ['Economic','work_location_head',$e->work_location_head ?? '']);
            fputcsv($csv, ['Economic','monthly_salary',$e->monthly_salary ?? '']);
            fputcsv($csv, ['Economic','combine_monthly_income',$e->combine_monthly_income ?? '']);
        }

        if ($t) {
            fputcsv($csv, ['Training','skills_for_living',$t->skills_for_living ?? '']);
            fputcsv($csv, ['Training','specific_skill',$t->specific_skill ?? '']);
            fputcsv($csv, ['Training','organization_member',$t->organization_member ?? '']);
            fputcsv($csv, ['Training','specific_organization',$t->specific_organization ?? '']);
            fputcsv($csv, ['Training','wanttolearn',$t->wanttolearn ?? '']);
            fputcsv($csv, ['Training','remarks',$t->remarks ?? '']);
            fputcsv($csv, ['Training','latitude',$t->latitude ?? '']);
            fputcsv($csv, ['Training','longitude',$t->longitude ?? '']);
        }

        foreach ($members as $i => $m) {
            $idx = $i + 1;
            fputcsv($csv, ['Member '.$idx,'name',$m->name ?? '']);
            fputcsv($csv, ['Member '.$idx,'relationship',$m->relationship ?? '']);
            fputcsv($csv, ['Member '.$idx,'age', isset($m->age) ? $m->age : '']);
            fputcsv($csv, ['Member '.$idx,'occupation',$m->occupation ?? '']);
            $cs = property_exists($m,'civilStatus') ? $m->civilStatus : (property_exists($m,'civil_status') ? $m->civil_status : null);
            $edu = property_exists($m,'educationalAttainment') ? $m->educationalAttainment : (property_exists($m,'educational_attainment') ? $m->educational_attainment : null);
            $inc = property_exists($m,'monthlyIncome') ? $m->monthlyIncome : (property_exists($m,'monthly_income') ? $m->monthly_income : null);
            fputcsv($csv, ['Member '.$idx,'civil_status',$cs ?? '']);
            fputcsv($csv, ['Member '.$idx,'educational_attainment',$edu ?? '']);
            fputcsv($csv, ['Member '.$idx,'monthly_income',$inc ?? '']);
        }

        rewind($csv);
        $out = stream_get_contents($csv);
        fclose($csv);
        $filename = 'survey-'.$survey_id.'.csv';
        return response($out, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"'
        ]);
    }

    public function adminExportBarangayCsv(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string)$request->get('barangay',''));
        if ($barangay === '') {
            return response()->json(['message' => 'Barangay required'], 422);
        }
        $status = strtolower(trim((string)$request->get('status','submitted')));
        $class = trim((string)$request->get('classification',''));
        $affLabel = [0=>'None',1=>'SSS',2=>'GSIS',3=>'PhilHealth',4=>'PagIbig',5=>'PWD',6=>'Senior_Citizen',7=>'Solo_Parent',8=>'4Ps'];
        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
        $displacedLabel = [1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'];
        $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
        $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];
        $ynLabel = [0=>'No',1=>'Yes'];
        $classMap = ['displaced'=>1,'double-up'=>2,'homeless'=>3,'upgrading of land tenure'=>4];
        $base = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->leftJoin('classification as c','c.survey_id','=','s.survey_id')
            ->leftJoin('household as h','h.survey_id','=','s.survey_id')
            ->leftJoin('economic as e','e.survey_id','=','s.survey_id')
            ->leftJoin('training as t','t.survey_id','=','s.survey_id')
            ->where('d.barangay',$barangay);
        if ($status === 'validated') {
            $base->where('s.is_submitted',1);
        } elseif ($status === 'approved') {
            $base->where('s.is_submitted',2);
        } elseif ($status === 'submitted') {
            $base->whereIn('s.is_submitted',[1,2]);
        }
        if ($class !== '') {
            $code = $classMap[strtolower($class)] ?? null;
            if ($code !== null) { $base->where('c.classification',$code); }
        }
        $rows = $base->select(
                'c.previous_client','c.year_inhabited','c.classification','c.subclass_displaced','c.subclass_doubleup','c.subclass_homeless',
                'd.last_name','d.first_name','d.middle_name','d.suffix','d.barangay','d.purok','d.street','d.gender','d.religion','d.birth_place','d.birth_date','d.person_age','d.marital_status','d.contact_number','d.language_spoken','d.tribe','d.highest_education','d.last_school_name','d.year_graduated','d.spouse_name','d.spouse_religion','d.spouse_tribe','d.spouse_age','d.spouse_gender','d.affiliation',
                'h.lot_ownership','h.house_ownership','h.avail_socialized_housing','h.temporary_living_area','h.housing_structure','h.type_of_toilet','h.source_of_water','h.source_of_electricity',
                'e.main_income_source','e.work_status','e.work_location_head','e.monthly_salary','e.combine_monthly_income',
                't.skills_for_living','t.specific_skill','t.organization_member','t.specific_organization','t.wanttolearn','t.remarks'
            )
            ->orderBy('d.barangay','asc')
            ->orderBy('c.classification','asc')
            ->orderBy('s.survey_id','desc')
            ->get();
        $csv = fopen('php://temp','w+');
        $title = ucfirst(str_replace('_',' ',$barangay)).' beneficiary list';
        fputcsv($csv, [$title]);
        $header = [
            'previous_client','year_inhabited','classification','subclass_displaced','subclass_doubleup','subclass_homeless',
            'last_name','first_name','middle_name','suffix','barangay','purok','street','gender','religion','birth_place','birth_date','person_age','marital_status','contact_number','language_spoken','tribe','highest_education','last_school_name','year_graduated','spouse_name','spouse_religion','spouse_tribe','spouse_age','spouse_gender','affiliation',
            'lot_ownership','house_ownership','avail_socialized_housing','temporary_living_area','housing_structure','type_of_toilet','source_of_water','source_of_electricity',
            'main_income_source','work_status','work_location_head','monthly_salary','combine_monthly_income',
            'skills_for_living','specific_skill','organization_member','specific_organization','wanttolearn','remarks'
        ];
        fputcsv($csv, $header);
        foreach ($rows as $r) {
            $row = [
                array_key_exists($r->previous_client, $ynLabel) ? $ynLabel[$r->previous_client] : ($r->previous_client ?? ''),
                $r->year_inhabited ?? '',
                array_key_exists($r->classification, $classLabel) ? $classLabel[$r->classification] : ($r->classification ?? ''),
                array_key_exists($r->subclass_displaced, $displacedLabel) ? $displacedLabel[$r->subclass_displaced] : ($r->subclass_displaced ?? ''),
                array_key_exists($r->subclass_doubleup, $doubleupLabel) ? $doubleupLabel[$r->subclass_doubleup] : ($r->subclass_doubleup ?? ''),
                array_key_exists($r->subclass_homeless, $homelessLabel) ? $homelessLabel[$r->subclass_homeless] : ($r->subclass_homeless ?? ''),
                $r->last_name ?? '',
                $r->first_name ?? '',
                $r->middle_name ?? '',
                $r->suffix ?? '',
                $r->barangay ?? '',
                $r->purok ?? '',
                $r->street ?? '',
                $r->gender ?? '',
                $r->religion ?? '',
                $r->birth_place ?? '',
                $r->birth_date ?? '',
                $r->person_age ?? '',
                $r->marital_status ?? '',
                $r->contact_number ?? '',
                $r->language_spoken ?? '',
                $r->tribe ?? '',
                $r->highest_education ?? '',
                $r->last_school_name ?? '',
                $r->year_graduated ?? '',
                $r->spouse_name ?? '',
                $r->spouse_religion ?? '',
                $r->spouse_tribe ?? '',
                $r->spouse_age ?? '',
                $r->spouse_gender ?? '',
                array_key_exists($r->affiliation, $affLabel) ? $affLabel[$r->affiliation] : ($r->affiliation ?? ''),
                $r->lot_ownership ?? '',
                $r->house_ownership ?? '',
                $r->avail_socialized_housing ?? '',
                $r->temporary_living_area ?? '',
                $r->housing_structure ?? '',
                $r->type_of_toilet ?? '',
                $r->source_of_water ?? '',
                $r->source_of_electricity ?? '',
                $r->main_income_source ?? '',
                $r->work_status ?? '',
                $r->work_location_head ?? '',
                $r->monthly_salary ?? '',
                $r->combine_monthly_income ?? '',
                $r->skills_for_living ?? '',
                $r->specific_skill ?? '',
                $r->organization_member ?? '',
                $r->specific_organization ?? '',
                $r->wanttolearn ?? '',
                $r->remarks ?? ''
            ];
            fputcsv($csv, $row);
        }
        rewind($csv);
        $out = stream_get_contents($csv);
        fclose($csv);
        $filename = 'barangay-'.strtolower(str_replace(' ','_', $barangay)).'.csv';
        return response($out, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"'
        ]);
    }

    public function adminExportAffiliatedCsv(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string)$request->get('search', ''));
        $barangay = trim((string)$request->get('barangay', ''));
        $aff = trim((string)$request->get('affiliation', ''));
        $class = trim((string)$request->get('classification', ''));
        $status = strtolower(trim((string)$request->get('status', 'submitted')));

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
        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
        $displacedLabel = [1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'];
        $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
        $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];
        $affLabel = [0=>'None',1=>'SSS',2=>'GSIS',3=>'PhilHealth',4=>'PagIbig',5=>'PWD',6=>'Senior_Citizen',7=>'Solo_Parent',8=>'4Ps'];

        $base = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->leftJoin('household as h','h.survey_id','=','s.survey_id')
            ->leftJoin('economic as e','e.survey_id','=','s.survey_id')
            ->whereNotNull('d.affiliation')
            ->where('d.affiliation','<>','')
            ->whereNotIn('d.affiliation',['None','N/A'])
            ->where(function($q){
                $q->whereNull('d.endorsed_by_mayor')
                  ->orWhere('d.endorsed_by_mayor', 0);
            });
        if ($status === 'validated') {
            $base->where('s.is_submitted', 1);
        } elseif ($status === 'approved') {
            $base->where('s.is_submitted', 2);
        } elseif ($status === 'submitted') {
            $base->whereIn('s.is_submitted', [1,2]);
        }
        if ($aff !== '') {
            $affStr = str_replace('_',' ', $aff);
            $base->where('d.affiliation', $affStr);
        }
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) { $base->where('c.classification', $code); }
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
        }
        if ($search !== '') {
            $base->where(function($q) use ($search) {
                $q->where('d.last_name','like',"%$search%")
                  ->orWhere('d.barangay','like',"%$search%");
            });
        }

        $rows = $base->leftJoin('training as t','t.survey_id','=','s.survey_id')
            ->select(
                's.interviewed_by','s.date_interviewed','d.tag_number','s.is_submitted',
                'c.previous_client','c.year_inhabited','c.classification','c.subclass_displaced','c.subclass_doubleup','c.subclass_homeless',
                'd.last_name','d.first_name','d.middle_name','d.suffix','d.barangay','d.purok','d.street','d.gender','d.religion','d.birth_place','d.birth_date','d.person_age','d.marital_status','d.contact_number','d.language_spoken','d.tribe','d.highest_education','d.last_school_name','d.year_graduated','d.spouse_name','d.spouse_religion','d.spouse_tribe','d.spouse_age','d.spouse_gender','d.affiliation',
                'h.lot_ownership','h.house_ownership','h.avail_socialized_housing','h.temporary_living_area','h.housing_structure','h.type_of_toilet','h.source_of_water','h.source_of_electricity',
                'e.main_income_source','e.work_status','e.work_location_head','e.monthly_salary','e.combine_monthly_income',
                't.skills_for_living','t.specific_skill','t.organization_member','t.specific_organization','t.wanttolearn','t.remarks'
            )
            ->orderBy('d.barangay','asc')
            ->orderBy('c.classification','asc')
            ->orderBy('s.survey_id','desc')
            ->get();

        $csv = fopen('php://temp','w+');
        fputcsv($csv, [
            'interviewed_by','date_interviewed','tag_number','identifier','status',
            'previous_client','year_inhabited','classification','subclass_displaced','subclass_doubleup','subclass_homeless',
            'last_name','first_name','middle_name','suffix','barangay','purok','street','gender','religion','birth_place','birth_date','person_age','marital_status','contact_number','language_spoken','tribe','highest_education','last_school_name','year_graduated','spouse_name','spouse_religion','spouse_tribe','spouse_age','spouse_gender','affiliation',
            'lot_ownership','house_ownership','avail_socialized_housing','temporary_living_area','housing_structure','type_of_toilet','source_of_water','source_of_electricity',
            'main_income_source','work_status','work_location_head','monthly_salary','combine_monthly_income',
            'skills_for_living','specific_skill','organization_member','specific_organization','wanttolearn','remarks'
        ]);

        foreach ($rows as $row) {
            $row->classification = $classLabel[$row->classification] ?? $row->classification;
            $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
            $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
            $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
            $row->affiliation = is_string($row->affiliation) ? $row->affiliation : ($affLabel[$row->affiliation] ?? $row->affiliation);
            fputcsv($csv, [
                $row->interviewed_by ?? '',
                $row->date_interviewed ?? '',
                $row->tag_number ?? '',
                'affiliated',
                (($row->is_submitted ?? null) === 2 ? 'assigned' : 'validated'),
                $ynLabel[$row->previous_client] ?? ($row->previous_client ?? ''),
                $row->year_inhabited ?? '',
                $row->classification,
                $row->subclass_displaced,
                $row->subclass_doubleup,
                $row->subclass_homeless,
                $row->last_name ?? '',
                $row->first_name ?? '',
                $row->middle_name ?? '',
                $row->suffix ?? '',
                $row->barangay ?? '',
                $row->purok ?? '',
                $row->street ?? '',
                $row->gender ?? '',
                $row->religion ?? '',
                $row->birth_place ?? '',
                $row->birth_date ?? '',
                $row->person_age ?? '',
                $row->marital_status ?? '',
                $row->contact_number ?? '',
                $row->language_spoken ?? '',
                $row->tribe ?? '',
                $row->highest_education ?? '',
                $row->last_school_name ?? '',
                $row->year_graduated ?? '',
                $row->spouse_name ?? '',
                $row->spouse_religion ?? '',
                $row->spouse_tribe ?? '',
                $row->spouse_age ?? '',
                $row->spouse_gender ?? '',
                $row->affiliation ?? '',
                $row->lot_ownership ?? '',
                $row->house_ownership ?? '',
                $row->temporary_living_area ?? '',
                $row->housing_structure ?? '',
                $row->type_of_toilet ?? '',
                $row->source_of_water ?? '',
                $row->source_of_electricity ?? '',
                $row->main_income_source ?? '',
                $row->work_status ?? '',
                $row->work_location_head ?? '',
                $row->monthly_salary ?? '',
                $row->combine_monthly_income ?? '',
                $row->skills_for_living ?? '',
                $row->specific_skill ?? '',
                $row->organization_member ?? '',
                $row->specific_organization ?? '',
                $row->wanttolearn ?? '',
                $row->remarks ?? '',
            ]);
        }

        rewind($csv);
        $out = stream_get_contents($csv);
        fclose($csv);
        return response($out, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="affiliated_beneficiaries.csv"'
        ]);
    }

    public function adminExportValidatedCsv(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string)$request->get('search', ''));
        $barangay = trim((string)$request->get('barangay', ''));
        $class = trim((string)$request->get('classification', ''));

        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
        $displacedLabel = [1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'];
        $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
        $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];

        $base = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->leftJoin('household as h','h.survey_id','=','s.survey_id')
            ->leftJoin('economic as e','e.survey_id','=','s.survey_id')
            ->leftJoin('training as t','t.survey_id','=','s.survey_id')
            ->whereIn('s.is_submitted', [1,2])
            ->where(function($q){
                $q->whereNull('d.affiliation')
                  ->orWhere('d.affiliation','')
                  ->orWhere('d.affiliation','None')
                  ->orWhere('d.affiliation','N/A');
            })
            ->where(function($q){
                $q->whereNull('d.endorsed_by_mayor')
                  ->orWhere('d.endorsed_by_mayor', 0);
            });
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) { $base->where('c.classification', $code); }
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
        }
        if ($search !== '') {
            $base->where(function($q) use ($search) {
                $q->where('d.last_name','like',"%$search%")
                  ->orWhere('d.barangay','like',"%$search%");
            });
        }

        $rows = $base->select(
                's.interviewed_by','s.date_interviewed','d.tag_number','s.is_submitted',
                'c.previous_client','c.year_inhabited','c.classification','c.subclass_displaced','c.subclass_doubleup','c.subclass_homeless',
                'd.last_name','d.first_name','d.middle_name','d.suffix','d.barangay','d.purok','d.street','d.gender','d.religion','d.birth_place','d.birth_date','d.person_age','d.marital_status','d.contact_number','d.language_spoken','d.tribe','d.highest_education','d.last_school_name','d.year_graduated','d.spouse_name','d.spouse_religion','d.spouse_tribe','d.spouse_age','d.spouse_gender','d.affiliation',
                'h.lot_ownership','h.house_ownership','h.avail_socialized_housing','h.temporary_living_area','h.housing_structure','h.type_of_toilet','h.source_of_water','h.source_of_electricity',
                'e.main_income_source','e.work_status','e.work_location_head','e.monthly_salary','e.combine_monthly_income',
                't.skills_for_living','t.specific_skill','t.organization_member','t.specific_organization','t.wanttolearn','t.remarks'
            )
            ->orderBy('d.barangay','asc')
            ->orderBy('c.classification','asc')
            ->orderBy('s.survey_id','desc')
            ->get();

        $csv = fopen('php://temp','w+');
        fputcsv($csv, [
            'interviewed_by','date_interviewed','tag_number','identifier','status',
            'previous_client','year_inhabited','classification','subclass_displaced','subclass_doubleup','subclass_homeless',
            'last_name','first_name','middle_name','suffix','barangay','purok','street','gender','religion','birth_place','birth_date','person_age','marital_status','contact_number','language_spoken','tribe','highest_education','last_school_name','year_graduated','spouse_name','spouse_religion','spouse_tribe','spouse_age','spouse_gender','affiliation',
            'lot_ownership','house_ownership','avail_socialized_housing','temporary_living_area','housing_structure','type_of_toilet','source_of_water','source_of_electricity',
            'main_income_source','work_status','work_location_head','monthly_salary','combine_monthly_income',
            'skills_for_living','specific_skill','organization_member','specific_organization','wanttolearn','remarks'
        ]);
        foreach ($rows as $row) {
            $row->classification = $classLabel[$row->classification] ?? $row->classification;
            $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
            $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
            $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
            fputcsv($csv, [
                $row->interviewed_by ?? '',
                $row->date_interviewed ?? '',
                $row->tag_number ?? '',
                'none-affiliated',
                (($row->is_submitted ?? null) === 2 ? 'assigned' : 'validated'),
                $ynLabel[$row->previous_client] ?? ($row->previous_client ?? ''),
                $row->year_inhabited ?? '',
                $row->classification,
                $row->subclass_displaced,
                $row->subclass_doubleup,
                $row->subclass_homeless,
                $row->last_name ?? '',
                $row->first_name ?? '',
                $row->middle_name ?? '',
                $row->suffix ?? '',
                $row->barangay ?? '',
                $row->purok ?? '',
                $row->street ?? '',
                $row->gender ?? '',
                $row->religion ?? '',
                $row->birth_place ?? '',
                $row->birth_date ?? '',
                $row->person_age ?? '',
                $row->marital_status ?? '',
                $row->contact_number ?? '',
                $row->language_spoken ?? '',
                $row->tribe ?? '',
                $row->highest_education ?? '',
                $row->last_school_name ?? '',
                $row->year_graduated ?? '',
                $row->spouse_name ?? '',
                $row->spouse_religion ?? '',
                $row->spouse_tribe ?? '',
                $row->spouse_age ?? '',
                $row->spouse_gender ?? '',
                $row->affiliation ?? '',
                $row->lot_ownership ?? '',
                $row->house_ownership ?? '',
                $row->temporary_living_area ?? '',
                $row->housing_structure ?? '',
                $row->type_of_toilet ?? '',
                $row->source_of_water ?? '',
                $row->source_of_electricity ?? '',
                $row->main_income_source ?? '',
                $row->work_status ?? '',
                $row->work_location_head ?? '',
                $row->monthly_salary ?? '',
                $row->combine_monthly_income ?? '',
                $row->skills_for_living ?? '',
                $row->specific_skill ?? '',
                $row->organization_member ?? '',
                $row->specific_organization ?? '',
                $row->wanttolearn ?? '',
                $row->remarks ?? '',
            ]);
        }
        rewind($csv);
        $out = stream_get_contents($csv);
        fclose($csv);
        return response($out, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="validated_beneficiaries.csv"'
        ]);
    }

    public function adminExportMayorCsv(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string)$request->get('search', ''));
        $barangay = trim((string)$request->get('barangay', ''));
        $class = trim((string)$request->get('classification', ''));

        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
        $displacedLabel = [1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'];
        $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
        $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];

        $base = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->join('classification as c','c.survey_id','=','s.survey_id')
            ->leftJoin('household as h','h.survey_id','=','s.survey_id')
            ->leftJoin('economic as e','e.survey_id','=','s.survey_id')
            ->leftJoin('training as t','t.survey_id','=','s.survey_id')
            ->where('d.endorsed_by_mayor', 1)
            ->whereIn('s.is_submitted', [1,2]);
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) { $base->where('c.classification', $code); }
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
        }
        if ($search !== '') {
            $base->where(function($q) use ($search) {
                $q->where('d.last_name','like',"%$search%")
                  ->orWhere('d.barangay','like',"%$search%");
            });
        }

        $rows = $base->select(
                's.interviewed_by','s.date_interviewed','d.tag_number','s.is_submitted',
                'c.previous_client','c.year_inhabited','c.classification','c.subclass_displaced','c.subclass_doubleup','c.subclass_homeless',
                'd.last_name','d.first_name','d.middle_name','d.suffix','d.barangay','d.purok','d.street','d.gender','d.religion','d.birth_place','d.birth_date','d.person_age','d.marital_status','d.contact_number','d.language_spoken','d.tribe','d.highest_education','d.last_school_name','d.year_graduated','d.spouse_name','d.spouse_religion','d.spouse_tribe','d.spouse_age','d.spouse_gender','d.affiliation',
                'h.lot_ownership','h.house_ownership','h.avail_socialized_housing','h.temporary_living_area','h.housing_structure','h.type_of_toilet','h.source_of_water','h.source_of_electricity',
                'e.main_income_source','e.work_status','e.work_location_head','e.monthly_salary','e.combine_monthly_income',
                't.skills_for_living','t.specific_skill','t.organization_member','t.specific_organization','t.wanttolearn','t.remarks'
            )
            ->orderBy('d.barangay','asc')
            ->orderBy('c.classification','asc')
            ->orderBy('s.survey_id','desc')
            ->get();

        $csv = fopen('php://temp','w+');
        fputcsv($csv, [
            'interviewed_by','date_interviewed','tag_number','identifier','status',
            'previous_client','year_inhabited','classification','subclass_displaced','subclass_doubleup','subclass_homeless',
            'last_name','first_name','middle_name','suffix','barangay','purok','street','gender','religion','birth_place','birth_date','person_age','marital_status','contact_number','language_spoken','tribe','highest_education','last_school_name','year_graduated','spouse_name','spouse_religion','spouse_tribe','spouse_age','spouse_gender','affiliation',
            'lot_ownership','house_ownership','avail_socialized_housing','temporary_living_area','housing_structure','type_of_toilet','source_of_water','source_of_electricity',
            'main_income_source','work_status','work_location_head','monthly_salary','combine_monthly_income',
            'skills_for_living','specific_skill','organization_member','specific_organization','wanttolearn','remarks'
        ]);
        foreach ($rows as $row) {
            $row->classification = $classLabel[$row->classification] ?? $row->classification;
            $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
            $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
            $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
            fputcsv($csv, [
                $row->interviewed_by ?? '',
                $row->date_interviewed ?? '',
                $row->tag_number ?? '',
                'mayor-endorsed',
                (($row->is_submitted ?? null) === 2 ? 'assigned' : 'validated'),
                $ynLabel[$row->previous_client] ?? ($row->previous_client ?? ''),
                $row->year_inhabited ?? '',
                $row->classification,
                $row->subclass_displaced,
                $row->subclass_doubleup,
                $row->subclass_homeless,
                $row->last_name ?? '',
                $row->first_name ?? '',
                $row->middle_name ?? '',
                $row->suffix ?? '',
                $row->barangay ?? '',
                $row->purok ?? '',
                $row->street ?? '',
                $row->gender ?? '',
                $row->religion ?? '',
                $row->birth_place ?? '',
                $row->birth_date ?? '',
                $row->person_age ?? '',
                $row->marital_status ?? '',
                $row->contact_number ?? '',
                $row->language_spoken ?? '',
                $row->tribe ?? '',
                $row->highest_education ?? '',
                $row->last_school_name ?? '',
                $row->year_graduated ?? '',
                $row->spouse_name ?? '',
                $row->spouse_religion ?? '',
                $row->spouse_tribe ?? '',
                $row->spouse_age ?? '',
                $row->spouse_gender ?? '',
                $row->affiliation ?? '',
                $row->lot_ownership ?? '',
                $row->house_ownership ?? '',
                $row->temporary_living_area ?? '',
                $row->housing_structure ?? '',
                $row->type_of_toilet ?? '',
                $row->source_of_water ?? '',
                $row->source_of_electricity ?? '',
                $row->main_income_source ?? '',
                $row->work_status ?? '',
                $row->work_location_head ?? '',
                $row->monthly_salary ?? '',
                $row->combine_monthly_income ?? '',
                $row->skills_for_living ?? '',
                $row->specific_skill ?? '',
                $row->organization_member ?? '',
                $row->specific_organization ?? '',
                $row->wanttolearn ?? '',
                $row->remarks ?? '',
            ]);
        }
        rewind($csv);
        $out = stream_get_contents($csv);
        fclose($csv);
        return response($out, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="mayor_endorsed_beneficiaries.csv"'
        ]);
    }

    public function validatorExportBarangayCsv(Request $request)
    {
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string)$request->get('barangay',''));
        if ($barangay === '') {
            return response()->json(['message' => 'Barangay required'], 422);
        }
        $scope = strtolower(trim((string)$request->get('scope','all')));
        $class = trim((string)$request->get('classification',''));
        $affLabel = [0=>'None',1=>'SSS',2=>'GSIS',3=>'PhilHealth',4=>'PagIbig',5=>'PWD',6=>'Senior_Citizen',7=>'Solo_Parent',8=>'4Ps'];
        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
        $displacedLabel = [1=>'Coastal Areas',2=>'Drought',3=>'Earthquake Affected',4=>'Flood Affected',5=>'Sea Level Rise',6=>'Threat of Eviction',7=>'Eviction/Demolition Order',8=>'Human Induced Disaster',9=>'Infra Projects',10=>'Landslide Affected',11=>'Near Waterways'];
        $doubleupLabel = [1=>'Renter/Tenant',2=>'Rent-free/Sharer',3=>'Caretaker'];
        $homelessLabel = [1=>'Public - living in tent',2=>'Private - living in tent'];
        $ynLabel = [0=>'No',1=>'Yes'];
        $classMap = ['displaced'=>1,'double-up'=>2,'homeless'=>3,'upgrading of land tenure'=>4];
        $base = DB::table('survey as s')
            ->join('demographic as d','d.survey_id','=','s.survey_id')
            ->leftJoin('classification as c','c.survey_id','=','s.survey_id')
            ->leftJoin('household as h','h.survey_id','=','s.survey_id')
            ->leftJoin('economic as e','e.survey_id','=','s.survey_id')
            ->leftJoin('training as t','t.survey_id','=','s.survey_id')
            ->where('d.barangay',$barangay);
        if ($scope === 'submitted') {
            $base->whereIn('s.is_submitted',[1,2]);
        } elseif ($scope === 'survey') {
            $base->where(function($q){
                $q->whereNull('s.is_submitted')->orWhere('s.is_submitted',0);
            });
        }
        if ($class !== '') {
            $code = $classMap[strtolower($class)] ?? null;
            if ($code !== null) { $base->where('c.classification',$code); }
        }
        $rows = $base->select(
                's.interviewed_by','s.date_interviewed','d.tag_number','s.is_submitted',
                'c.previous_client','c.year_inhabited','c.classification','c.subclass_displaced','c.subclass_doubleup','c.subclass_homeless',
                'd.last_name','d.first_name','d.middle_name','d.suffix','d.barangay','d.purok','d.street','d.gender','d.religion','d.birth_place','d.birth_date','d.person_age','d.marital_status','d.contact_number','d.language_spoken','d.tribe','d.highest_education','d.last_school_name','d.year_graduated','d.spouse_name','d.spouse_religion','d.spouse_tribe','d.spouse_age','d.spouse_gender','d.affiliation',
                'h.lot_ownership','h.house_ownership','h.avail_socialized_housing','h.temporary_living_area','h.housing_structure','h.type_of_toilet','h.source_of_water','h.source_of_electricity',
                'e.main_income_source','e.work_status','e.work_location_head','e.monthly_salary','e.combine_monthly_income',
                't.skills_for_living','t.specific_skill','t.organization_member','t.specific_organization','t.wanttolearn','t.remarks'
            )
            ->orderBy('d.barangay','asc')
            ->orderBy('c.classification','asc')
            ->orderBy('s.survey_id','desc')
            ->get();
        $csv = fopen('php://temp','w+');
        $title = ucfirst(str_replace('_',' ',$barangay)).' beneficiaries list';
        fputcsv($csv, [$title]);
        $header = [
            'interviewed_by','date_interviewed','tag_number','status',
            'previous_client','year_inhabited','classification','subclass_displaced','subclass_doubleup','subclass_homeless',
            'last_name','first_name','middle_name','suffix','barangay','purok','street','gender','religion','birth_place','birth_date','person_age','marital_status','contact_number','language_spoken','tribe','highest_education','last_school_name','year_graduated','spouse_name','spouse_religion','spouse_tribe','spouse_age','spouse_gender','affiliation',
            'lot_ownership','house_ownership','avail_socialized_housing','temporary_living_area','housing_structure','type_of_toilet','source_of_water','source_of_electricity',
            'main_income_source','work_status','work_location_head','monthly_salary','combine_monthly_income',
            'skills_for_living','specific_skill','organization_member','specific_organization','wanttolearn','remarks'
        ];
        fputcsv($csv, $header);
        foreach ($rows as $r) {
            $row = [
                $r->interviewed_by ?? '',
                $r->date_interviewed ?? '',
                $r->tag_number ?? '',
                (function($s){
                    if ($s === 1) return 'validated';
                    if ($s === 2) return 'assigned';
                    return 'surveyed';
                })($r->is_submitted ?? null),
                array_key_exists($r->previous_client, $ynLabel) ? $ynLabel[$r->previous_client] : ($r->previous_client ?? ''),
                $r->year_inhabited ?? '',
                array_key_exists($r->classification, $classLabel) ? $classLabel[$r->classification] : ($r->classification ?? ''),
                array_key_exists($r->subclass_displaced, $displacedLabel) ? $displacedLabel[$r->subclass_displaced] : ($r->subclass_displaced ?? ''),
                array_key_exists($r->subclass_doubleup, $doubleupLabel) ? $doubleupLabel[$r->subclass_doubleup] : ($r->subclass_doubleup ?? ''),
                array_key_exists($r->subclass_homeless, $homelessLabel) ? $homelessLabel[$r->subclass_homeless] : ($r->subclass_homeless ?? ''),
                $r->last_name ?? '',
                $r->first_name ?? '',
                $r->middle_name ?? '',
                $r->suffix ?? '',
                $r->barangay ?? '',
                $r->purok ?? '',
                $r->street ?? '',
                $r->gender ?? '',
                $r->religion ?? '',
                $r->birth_place ?? '',
                $r->birth_date ?? '',
                $r->person_age ?? '',
                $r->marital_status ?? '',
                $r->contact_number ?? '',
                $r->language_spoken ?? '',
                $r->tribe ?? '',
                $r->highest_education ?? '',
                $r->last_school_name ?? '',
                $r->year_graduated ?? '',
                $r->spouse_name ?? '',
                $r->spouse_religion ?? '',
                $r->spouse_tribe ?? '',
                $r->spouse_age ?? '',
                $r->spouse_gender ?? '',
                array_key_exists($r->affiliation, $affLabel) ? $affLabel[$r->affiliation] : ($r->affiliation ?? ''),
                $r->lot_ownership ?? '',
                $r->house_ownership ?? '',
                $r->avail_socialized_housing ?? '',
                $r->temporary_living_area ?? '',
                $r->housing_structure ?? '',
                $r->type_of_toilet ?? '',
                $r->source_of_water ?? '',
                $r->source_of_electricity ?? '',
                $r->main_income_source ?? '',
                $r->work_status ?? '',
                $r->work_location_head ?? '',
                $r->monthly_salary ?? '',
                $r->combine_monthly_income ?? '',
                $r->skills_for_living ?? '',
                $r->specific_skill ?? '',
                $r->organization_member ?? '',
                $r->specific_organization ?? '',
                $r->wanttolearn ?? '',
                $r->remarks ?? ''
            ];
            fputcsv($csv, $row);
        }
        rewind($csv);
        $out = stream_get_contents($csv);
        fclose($csv);
        $filename = 'barangay-'.strtolower(str_replace(' ','_', $barangay)).'.csv';
        return response($out, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"'
        ]);
    }

    public function adminMapPoints(Request $request)
    {
        $scope = strtolower(trim((string)$request->get('scope', 'submitted')));
        $mode = strtolower(trim((string)$request->get('mode', 'barangay')));
        $startYear = $request->get('start_year');
        $endYear = $request->get('end_year');

        if ($mode === 'survey') {
            $rows = DB::table('survey as s')
                ->join('demographic as d','d.survey_id','=','s.survey_id')
                ->join('classification as c','c.survey_id','=','s.survey_id')
                ->leftJoin('training as t','t.survey_id','=','s.survey_id')
                ->select('s.survey_id','s.is_submitted','d.barangay','c.classification','d.first_name','d.last_name','d.middle_name','d.suffix','d.tag_number','t.latitude','t.longitude','t.house_photo','t.person_photo');
            if ($scope === 'validated') {
                $rows->where('s.is_submitted', 1);
            } elseif ($scope === 'assigned' || $scope === 'approved') {
                $rows->where('s.is_submitted', 2);
            } else {
                $rows->whereIn('s.is_submitted', [1,2]);
            }
            if ($startYear && $endYear) {
                $start = Carbon::createMidnightDate((int)$startYear, 1, 1)->toDateString();
                $end = Carbon::createMidnightDate((int)$endYear, 12, 31)->toDateString();
                $rows->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed','>=',$start)->whereDate('s.date_interviewed','<=',$end);
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
                $hasPersonPhoto = !empty($r->person_photo);
                $points[] = [
                    'survey_id' => $r->survey_id,
                    'is_submitted' => (int)($r->is_submitted ?? 0),
                    'barangay' => $r->barangay ?: 'Unknown',
                    'classification' => $classLabel[$r->classification] ?? ($r->classification ?: 'Unknown'),
                    'lat' => $lat,
                    'lng' => $lng,
                    'name' => $name,
                    'tag_number' => $r->tag_number ?: null,
                    'has_photo' => $hasPhoto,
                    'photo_url' => $hasPhoto ? '/admin/api/survey/'.$r->survey_id.'/photo' : null,
                    'person_photo_url' => $hasPersonPhoto ? '/admin/api/survey/'.$r->survey_id.'/person-photo' : null,
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

        if ($scope === 'validated') {
            $countsQuery->where('s.is_submitted', 1);
            $coordsQuery->where('s.is_submitted', 1);
        } elseif ($scope === 'assigned' || $scope === 'approved') {
            $countsQuery->where('s.is_submitted', 2);
            $coordsQuery->where('s.is_submitted', 2);
        } else {
            $countsQuery->whereIn('s.is_submitted', [1,2]);
            $coordsQuery->whereIn('s.is_submitted', [1,2]);
        }
        if ($startYear && $endYear) {
            $start = Carbon::createMidnightDate((int)$startYear, 1, 1)->toDateString();
            $end = Carbon::createMidnightDate((int)$endYear, 12, 31)->toDateString();
            $countsQuery->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed','>=',$start)->whereDate('s.date_interviewed','<=',$end);
            $coordsQuery->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed','>=',$start)->whereDate('s.date_interviewed','<=',$end);
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
                if (Str::startsWith($rel, 'storage/')) {
                    $rel2 = substr($rel, 8);
                    $url = Storage::disk('public')->exists($rel2) ? Storage::url($rel2) : "/storage/$rel2";
                } else {
                    $url = Storage::disk('public')->exists($rel) ? Storage::url($rel) : (Str::startsWith($img, '/') ? $img : "/storage/$rel");
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
                'geojson' => property_exists($r,'geojson') ? $r->geojson : null,
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

    public function adminProjectSitesUpdate(Request $request, $project_id)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (!Schema::hasTable('siteproj')) {
            return response()->json(['message' => 'Project sites table missing'], 422);
        }
        $project = DB::table('siteproj')->where('project_id', (int)$project_id)->first();
        if (!$project) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $validated = $request->validate([
            'project_name' => ['nullable','string','max:255'],
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
        $payload = [];
        foreach (['project_name','land_area','total_blocks','total_lots','barangay','year_started','description'] as $k) {
            if (array_key_exists($k, $validated)) {
                $payload[$k] = $validated[$k];
            }
        }
        if ($path !== null) { $payload['proj_image'] = $path; }
        $filtered = array_intersect_key($payload, array_flip($columns));
        if (empty($filtered)) {
            return response()->json(['ok' => true]);
        }
        DB::table('siteproj')->where('project_id', (int)$project_id)->update($filtered);
        return response()->json(['ok' => true]);
    }

    public function adminProjectSitesDelete(Request $request, $project_id)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (!Schema::hasTable('siteproj')) {
            return response()->json(['message' => 'Project sites table missing'], 422);
        }
        $project = DB::table('siteproj')->where('project_id', (int)$project_id)->first();
        if (!$project) {
            return response()->json(['message' => 'Not found'], 404);
        }
        try {
            $img = is_string($project->proj_image ?? null) ? $project->proj_image : '';
            if ($img !== '') {
                $rel = ltrim($img, '/');
                if (str_starts_with($rel, 'storage/')) {
                    $rel2 = substr($rel, 8);
                    @unlink(public_path('storage/'.$rel2));
                    Storage::disk('public')->delete($rel2);
                } else {
                    @unlink(public_path($rel));
                    Storage::disk('public')->delete($rel);
                }
            }
        } catch (\Throwable $e) {}
        try {
            DB::table('siteproj')->where('project_id', (int)$project_id)->delete();
            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to delete project', 'error' => $e->getMessage()], 500);
        }
    }
    public function adminProjectBoundarySave(Request $request, $project_id)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (!Schema::hasTable('siteproj')) {
            return response()->json(['message' => 'Project sites table missing'], 422);
        }
        $project = DB::table('siteproj')->where('project_id', (int)$project_id)->first();
        if (!$project) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $raw = trim((string)$request->input('geojson',''));
        if ($raw === '') {
            return response()->json(['message' => 'GeoJSON required'], 422);
        }
        try {
            $parsed = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Invalid GeoJSON'], 422);
        }
        $columns = Schema::getColumnListing('siteproj');
        if (!in_array('geojson', $columns)) {
            try {
                Schema::table('siteproj', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->longText('geojson')->nullable();
                });
                $columns = Schema::getColumnListing('siteproj');
            } catch (\Throwable $e) {
                return response()->json(['message' => 'Column geojson missing in siteproj'], 422);
            }
            if (!in_array('geojson', $columns)) {
                return response()->json(['message' => 'Column geojson missing in siteproj'], 422);
            }
        }
        DB::table('siteproj')->where('project_id', (int)$project_id)->update(['geojson' => json_encode($parsed)]);
        return response()->json(['ok' => true]);
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

    public function adminIndicators(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string)$request->get('barangay',''));
        $classParam = strtolower(trim((string)$request->get('classification','')));
        $incomeBand = strtolower(trim((string)$request->get('income_band','')));
        $water = strtolower(trim((string)$request->get('water','')));
        $electricity = strtolower(trim((string)$request->get('electricity','')));

        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];

        $baseFilter = DB::table('survey as s')
            ->leftJoin('demographic as d','d.survey_id','=','s.survey_id')
            ->leftJoin('classification as c','c.survey_id','=','s.survey_id')
            ->leftJoin('economic as e','e.survey_id','=','s.survey_id')
            ->leftJoin('household as h','h.survey_id','=','s.survey_id')
            ->whereIn('s.is_submitted', [1,2]);
        if ($barangay !== '') {
            $baseFilter->where('d.barangay', $barangay);
        }
        if ($classParam !== '' && array_key_exists($classParam, $classMap)) {
            $baseFilter->where('c.classification', $classMap[$classParam]);
        }
        if ($incomeBand !== '') {
            switch ($incomeBand) {
                case 'lt5k':
                    $baseFilter->whereRaw('(e.combine_monthly_income+0) < 5000');
                    break;
                case '5to10k':
                    $baseFilter->whereRaw('(e.combine_monthly_income+0) >= 5000 AND (e.combine_monthly_income+0) < 10000');
                    break;
                case 'gt10k':
                    $baseFilter->whereRaw('(e.combine_monthly_income+0) >= 10000');
                    break;
            }
        }
        if ($water === 'has') {
            $baseFilter->whereRaw("LOWER(IFNULL(h.source_of_water,'')) <> '' AND LOWER(IFNULL(h.source_of_water,'none')) <> 'none'");
        } elseif ($water === 'none') {
            $baseFilter->whereRaw("LOWER(IFNULL(h.source_of_water,'')) = '' OR LOWER(IFNULL(h.source_of_water,'')) = 'none'");
        }
        if ($electricity === 'has') {
            $baseFilter->whereRaw("LOWER(IFNULL(h.source_of_electricity,'')) <> '' AND LOWER(IFNULL(h.source_of_electricity,'none')) <> 'none'");
        } elseif ($electricity === 'none') {
            $baseFilter->whereRaw("LOWER(IFNULL(h.source_of_electricity,'')) = '' OR LOWER(IFNULL(h.source_of_electricity,'')) = 'none'");
        }

        $surveyIds = $baseFilter->select('s.survey_id')->pluck('s.survey_id')->all();
        $baseTotal = count($surveyIds);
        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
        $classRows = DB::table('classification as c')
            ->join('survey as s','s.survey_id','=','c.survey_id')
            ->whereIn('c.survey_id', $surveyIds)
            ->select('c.classification', DB::raw('COUNT(*) AS count'))
            ->groupBy('c.classification')
            ->get();
        $classificationPct = [];
        foreach ($classRows as $r) {
            $k = $classLabel[$r->classification] ?? ($r->classification ?: 'Unknown');
            $classificationPct[$k] = $baseTotal ? round(((int)$r->count / $baseTotal) * 100) : 0;
        }
        $houseCount = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->count();
        $noLot = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.lot_ownership,'')) <> 'yes'")->count();
        $noHouse = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.house_ownership,'')) <> 'yes'")->count();
        $temporaryLiving = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.temporary_living_area,'')) = 'yes'")->count();
        $hasWater = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.source_of_water,'')) <> '' AND LOWER(IFNULL(h.source_of_water,'none')) <> 'none'")->count();
        $noWater = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.source_of_water,'')) = '' OR LOWER(IFNULL(h.source_of_water,'')) = 'none'")->count();
        $hasElectricity = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.source_of_electricity,'')) <> '' AND LOWER(IFNULL(h.source_of_electricity,'none')) <> 'none'")->count();
        $noElectricity = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.source_of_electricity,'')) = '' OR LOWER(IFNULL(h.source_of_electricity,'')) = 'none'")->count();

        $incomeRow = DB::table('economic as e')
            ->whereIn('e.survey_id', $surveyIds)
            ->selectRaw("SUM(CASE WHEN (e.combine_monthly_income+0) < 5000 THEN 1 ELSE 0 END) AS lt5k,
                         SUM(CASE WHEN (e.combine_monthly_income+0) >= 5000 AND (e.combine_monthly_income+0) < 10000 THEN 1 ELSE 0 END) AS btw5to10k,
                         SUM(CASE WHEN (e.combine_monthly_income+0) >= 10000 THEN 1 ELSE 0 END) AS gt10k,
                         COUNT(*) AS total")
            ->first();

        $sizes = DB::table('demographic as d')
            ->leftJoin(DB::raw('(SELECT survey_id, COUNT(*) AS cnt FROM household_mem GROUP BY survey_id) hm'), function($join){ $join->on('hm.survey_id','=','d.survey_id'); })
            ->whereIn('d.survey_id', $surveyIds)
            ->select('d.barangay', DB::raw('AVG(IFNULL(hm.cnt,0)) AS avg_size'))
            ->groupBy('d.barangay')
            ->get()
            ->map(function($r){ $r->avg_size = round((float)$r->avg_size, 1); return $r; })
            ->sortByDesc('avg_size')
            ->values()
            ->take(10);

        $eduRows = DB::table('demographic as d')
            ->whereIn('d.survey_id', $surveyIds)
            ->select('d.highest_education', DB::raw('COUNT(*) AS count'))
            ->groupBy('d.highest_education')
            ->get();
        $education = [];
        foreach ($eduRows as $r) { $key = $r->highest_education ?: 'Unknown'; $education[$key] = (int)$r->count; }

        $skillsTotal = DB::table('training as t')->whereIn('t.survey_id', $surveyIds)->count();
        $skillsYes = DB::table('training as t')->whereIn('t.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(t.skills_for_living,'')) = 'yes'")->count();
        $skillsPct = $skillsTotal ? round(($skillsYes / $skillsTotal) * 100) : 0;
        $topSkills = DB::table('training as t')
            ->whereIn('t.survey_id', $surveyIds)
            ->whereNotNull('t.specific_skill')
            ->whereRaw("TRIM(IFNULL(t.specific_skill,'')) <> ''")
            ->select('t.specific_skill', DB::raw('COUNT(*) AS count'))
            ->groupBy('t.specific_skill')
            ->orderBy('count','desc')
            ->limit(5)
            ->get();
        $wantRows = DB::table('training as t')
            ->whereIn('t.survey_id', $surveyIds)
            ->whereNotNull('t.wanttolearn')
            ->whereRaw("TRIM(IFNULL(t.wanttolearn,'')) <> ''")
            ->select('t.wanttolearn', DB::raw('COUNT(*) AS count'))
            ->groupBy('t.wanttolearn')
            ->orderBy('count','desc')
            ->limit(5)
            ->get();

        return response()->json([
            'base_total' => $baseTotal,
            'vulnerability' => [
                'classification_pct' => $classificationPct,
                'no_lot_pct' => $houseCount ? round(($noLot / $houseCount) * 100) : 0,
                'no_house_pct' => $houseCount ? round(($noHouse / $houseCount) * 100) : 0,
                'temporary_living_pct' => $houseCount ? round(($temporaryLiving / $houseCount) * 100) : 0,
            ],
            'service' => [
                'has_water_pct' => $houseCount ? round(($hasWater / $houseCount) * 100) : 0,
                'no_water_pct' => $houseCount ? round(($noWater / $houseCount) * 100) : 0,
                'has_electricity_pct' => $houseCount ? round(($hasElectricity / $houseCount) * 100) : 0,
                'no_electricity_pct' => $houseCount ? round(($noElectricity / $houseCount) * 100) : 0,
            ],
            'economic' => [
                'bands' => [
                    'lt5k' => (int)($incomeRow->lt5k ?? 0),
                    'btw5to10k' => (int)($incomeRow->btw5to10k ?? 0),
                    'gt10k' => (int)($incomeRow->gt10k ?? 0),
                    'total' => (int)($incomeRow->total ?? 0)
                ],
                'avg_household_size_by_barangay' => $sizes,
            ],
            'education_skills' => [
                'education_breakdown' => $education,
                'skills_for_living_pct' => $skillsPct,
                'top_skills' => $topSkills,
                'top_wanttolearn' => $wantRows,
            ],
        ]);
    }

    public function adminCrosstabIncomeClassification(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string)$request->get('barangay',''));
        $classParam = strtolower(trim((string)$request->get('classification','')));
        $water = strtolower(trim((string)$request->get('water','')));
        $electricity = strtolower(trim((string)$request->get('electricity','')));
        $classMap = [ 'displaced'=>1,'double-up'=>2,'homeless'=>3,'upgrading of land tenure'=>4 ];

        $baseFilter = DB::table('survey as s')
            ->leftJoin('demographic as d','d.survey_id','=','s.survey_id')
            ->leftJoin('classification as c','c.survey_id','=','s.survey_id')
            ->leftJoin('household as h','h.survey_id','=','s.survey_id')
            ->whereIn('s.is_submitted',[1,2]);
        if ($barangay !== '') { $baseFilter->where('d.barangay', $barangay); }
        if ($classParam !== '' && array_key_exists($classParam,$classMap)) { $baseFilter->where('c.classification',$classMap[$classParam]); }
        if ($water === 'has') { $baseFilter->whereRaw("LOWER(IFNULL(h.source_of_water,'')) <> '' AND LOWER(IFNULL(h.source_of_water,'none')) <> 'none'"); }
        elseif ($water === 'none') { $baseFilter->whereRaw("LOWER(IFNULL(h.source_of_water,'')) = '' OR LOWER(IFNULL(h.source_of_water,'')) = 'none'"); }
        if ($electricity === 'has') { $baseFilter->whereRaw("LOWER(IFNULL(h.source_of_electricity,'')) <> '' AND LOWER(IFNULL(h.source_of_electricity,'none')) <> 'none'"); }
        elseif ($electricity === 'none') { $baseFilter->whereRaw("LOWER(IFNULL(h.source_of_electricity,'')) = '' OR LOWER(IFNULL(h.source_of_electricity,'')) = 'none'"); }
        $surveyIds = $baseFilter->select('s.survey_id')->pluck('s.survey_id')->all();

        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
        $rows = DB::table('classification as c')
            ->leftJoin('economic as e','e.survey_id','=','c.survey_id')
            ->whereIn('c.survey_id', $surveyIds)
            ->select(
                'c.classification',
                DB::raw("SUM(CASE WHEN (e.combine_monthly_income+0) < 5000 THEN 1 ELSE 0 END) AS lt5k"),
                DB::raw("SUM(CASE WHEN (e.combine_monthly_income+0) >= 5000 AND (e.combine_monthly_income+0) < 10000 THEN 1 ELSE 0 END) AS btw5to10k"),
                DB::raw("SUM(CASE WHEN (e.combine_monthly_income+0) >= 10000 THEN 1 ELSE 0 END) AS gt10k"),
                DB::raw('COUNT(*) AS total')
            )
            ->groupBy('c.classification')
            ->get()
            ->map(function($r) use ($classLabel){
                $r->classification = $classLabel[$r->classification] ?? $r->classification;
                return $r;
            });
        return response()->json(['data' => $rows]);
    }

    public function adminCrosstabClassificationBarangay(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string)$request->get('barangay',''));
        $classParam = strtolower(trim((string)$request->get('classification','')));
        $classMap = [ 'displaced'=>1,'double-up'=>2,'homeless'=>3,'upgrading of land tenure'=>4 ];

        $baseFilter = DB::table('survey as s')
            ->leftJoin('demographic as d','d.survey_id','=','s.survey_id')
            ->leftJoin('classification as c','c.survey_id','=','s.survey_id')
            ->whereIn('s.is_submitted',[1,2]);
        if ($barangay !== '') { $baseFilter->where('d.barangay', $barangay); }
        if ($classParam !== '' && array_key_exists($classParam,$classMap)) { $baseFilter->where('c.classification',$classMap[$classParam]); }
        $surveyIds = $baseFilter->select('s.survey_id')->pluck('s.survey_id')->all();

        $classLabel = [1=>'Displaced',2=>'Double-up',3=>'Homeless',4=>'Upgrading of Land Tenure'];
        $rows = DB::table('classification as c')
            ->join('demographic as d','d.survey_id','=','c.survey_id')
            ->whereIn('c.survey_id', $surveyIds)
            ->select('d.barangay','c.classification', DB::raw('COUNT(*) AS count'))
            ->groupBy('d.barangay','c.classification')
            ->get()
            ->map(function($r) use ($classLabel){
                $r->classification = $classLabel[$r->classification] ?? $r->classification;
                return $r;
            });
        return response()->json(['data' => $rows]);
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
            'signature' => ['required','file','image','max:2048'],
        ]);
        $username = $request->input('username');
        $exists = DB::table('validator')->where('username', $username)->exists();
        if ($exists) {
            return response()->json(['errors' => ['username' => ['Username already taken']]], 422);
        }
        $encryptedSignature = null;
        if ($request->hasFile('signature')) {
            $file = $request->file('signature');
            $bytes = file_get_contents($file->getRealPath());
            $b64 = base64_encode($bytes);
            $encryptedSignature = Crypt::encryptString($b64);
        }
        DB::table('validator')->insert([
            'username' => $username,
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => \Illuminate\Support\Facades\Hash::make($request->input('password')),
            'status' => 'approved',
            'signature_data' => $encryptedSignature,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        Log::info('Validator created with signature upload', [
            'username' => $username,
            'ip' => $request->ip(),
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
                DB::raw('updated_at AS updatedAt')
            )
            ->where('status', 'approved')
            ->get()
            ->map(function($row) {
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
                DB::raw('updated_at AS updatedAt')
            )
            ->whereRaw('LOWER(username) = ?', [$username])
            ->where('status','approved')
            ->first();

        if (!$row) {
            return response()->json(['success' => false, 'message' => 'Validator not found or not approved'], 404);
        }
        $stored = is_string($row->password ?? null) ? $row->password : '';
        $valid = ($stored !== '' && password_verify($password, $stored)) || $password === $stored || (md5($password) === $stored);
        if (!$valid) {
            return response()->json(['success' => false, 'message' => 'Invalid password', 'debug' => ['username' => $username]], 401);
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

        $saveSignature = function ($input) {
            if (!$input) return null;
            $s = is_string($input) ? trim($input) : '';
            if ($s === '') return null;
            if (strpos($s, 'signatures/') === 0 || strpos($s, 'storage/signatures/') === 0) {
                return $s;
            }
            $base64 = $s;
            if (strpos($s, 'base64,') !== false) {
                $parts = explode(',', $s, 2);
                $base64 = $parts[1] ?? '';
            }
            if ($base64 === '') return null;
            $dataBin = base64_decode($base64);
            if ($dataBin === false) return null;
            $path = 'signatures/' . uniqid() . '.png';
            Storage::disk('public')->put($path, $dataBin);
            return $path;
        };

        $validator_signature = $saveSignature($val('validator_signature') ?: $request->input('validator_signature'));
        $respondent_signature = $saveSignature($val('respondent_signature') ?: $request->input('respondent_signature'));

        $house_photo_blob = null;
        $house_photo_filename = null;
        $house_photo_type = null;
        $house_photo_path = null;
        $person_photo_blob = null;
        $person_photo_filename = null;
        $person_photo_type = null;
        $person_photo_path = null;
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

        // Person photo handling (base64 or file)
        $pp = $data['person_photo'] ?? $request->input('person_photo');
        if ($pp) {
            $s = is_string($pp) ? $pp : '';
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
                $t = $val('person_photo_type') ?: $request->input('person_photo_type') ?: ($typeFromDataUri ?: 'image/jpeg');
                $allowed = ['image/jpeg','image/png','image/gif','image/jpg'];
                if (!in_array($t, $allowed)) {
                    return response()->json(['message' => 'Invalid file type'], 422);
                }
                $person_photo_blob = $decoded;
                $person_photo_filename = $val('person_photo_filename') ?: $request->input('person_photo_filename');
                $person_photo_type = $t;
            }
        }
        if (!$person_photo_blob) {
            $file = $request->file('person_photo');
            if ($file) {
                if ($file->getSize() > 5 * 1024 * 1024) {
                    return response()->json(['message' => 'File too large'], 422);
                }
                $allowed = ['image/jpeg','image/png','image/gif','image/jpg'];
                if (!in_array($file->getMimeType(), $allowed)) {
                    return response()->json(['message' => 'Invalid file type'], 422);
                }
                $person_photo_blob = file_get_contents($file->getRealPath());
                $person_photo_filename = $file->getClientOriginalName();
                $person_photo_type = $file->getMimeType();
            }
        }
        if ($person_photo_blob) {
            $ext = 'jpg';
            if ($person_photo_type === 'image/png') $ext = 'png';
            elseif ($person_photo_type === 'image/gif') $ext = 'gif';
            elseif ($person_photo_type === 'image/jpg' || $person_photo_type === 'image/jpeg') $ext = 'jpg';
            if (!$person_photo_filename || strpos($person_photo_filename, '.') === false) {
                $person_photo_filename = 'survey_person_' . time() . '_' . uniqid() . '.' . $ext;
            }
            Storage::disk('public')->put('survey_photos/' . $person_photo_filename, $person_photo_blob);
            $person_photo_path = 'storage/survey_photos/' . $person_photo_filename;
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
        $specific_skill = '';
        if ($skills_for_living === 'Yes') {
            $specific_skill = $val('specific_skill');
            if (strtolower((string)$specific_skill) === 'others') $specific_skill = $val('other_skill');
            if ($specific_skill === null) $specific_skill = '';
        }

        $organization_member = $val('organization_member');
        $specific_organization = '';
        if ($organization_member === 'Yes') {
            $specific_organization = $val('specific_organization');
            if (strtolower((string)$specific_organization) === 'others') $specific_organization = $val('other_organization');
            if ($specific_organization === null) $specific_organization = '';
        }

        $marital_status = $val('marital_status');
        $allowSpouse = in_array($marital_status, ['Married','Live-in','Widow/Widower','Separated','Annulled']);
        $spouse_name = $allowSpouse ? $val('spouse_name') : null;
        $spouse_religion = $allowSpouse ? $val('spouse_religion') : null;
        $spouse_tribe = $allowSpouse ? $val('spouse_tribe') : null;
        $spouse_age = $allowSpouse ? $val('spouse_age') : null;
        $spouse_gender = $allowSpouse ? $val('spouse_gender') : null;

        $result = DB::transaction(function() use ($data, $val, $classification, $subclass_displaced, $subclass_doubleup, $subclass_homeless, $housing_structure, $type_of_toilet, $source_of_water, $source_of_electricity, $main_income_source, $work_status, $skills_for_living, $specific_skill, $organization_member, $specific_organization, $house_photo_path, $person_photo_path, $marital_status, $spouse_name, $spouse_religion, $spouse_tribe, $spouse_age, $spouse_gender, $validator_signature, $respondent_signature) {
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
                'validator_signature' => $validator_signature,
            ]);

            $barangayValue = (string)$val('barangay');
            $tagNumber = $this->generateTagNumber($barangayValue);

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
                'barangay' => $barangayValue,
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
                'tag_number' => $tagNumber,
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
                'person_photo' => $person_photo_path ?? '',
                'wanttolearn' => $val('wanttolearn'),
                'remarks' => $val('remarks'),
                'latitude' => $val('latitude'),
                'longitude' => $val('longitude'),
                'respondent_signature' => $respondent_signature,
            ]);

            return [
                'survey_id' => $sid,
                'tag_number' => $tagNumber,
            ];
        });

        $survey_id = $result['survey_id'];
        $tagNumber = $result['tag_number'];

        // Household members
        $members = $data['household_members'] ?? $data['members'] ?? [];
        if (is_array($members)) {
            $hmCols = Schema::getColumnListing('household_mem');
            $colCivil = in_array('civilStatus', $hmCols) ? 'civilStatus' : 'civil_status';
            $colEdu = in_array('educationalAttainment', $hmCols) ? 'educationalAttainment' : 'educational_attainment';
            $colIncome = in_array('monthlyIncome', $hmCols) ? 'monthlyIncome' : 'monthly_income';
            $colSex = null;
            if (in_array('sex', $hmCols)) {
                $colSex = 'sex';
            } elseif (in_array('gender', $hmCols)) {
                $colSex = 'gender';
            }
            $colCode = in_array('code', $hmCols) ? 'code' : null;

            foreach ($members as $m) {
                $payload = [
                    'survey_id' => $survey_id,
                    'name' => $m['name'] ?? null,
                    'age' => isset($m['age']) ? (int)$m['age'] : null,
                    'relationship' => $m['relationship'] ?? null,
                    'occupation' => ($m['occupation'] ?? '') === '' ? 'N/A' : $m['occupation'],
                ];

                if ($colSex !== null) {
                    $payload[$colSex] = $m['sex'] ?? ($m['gender'] ?? null);
                }

                $payload[$colCivil] = $m['civilStatus'] ?? ($m['civil_status'] ?? null);
                $eduVal = $m['educationalAttainment'] ?? ($m['educational_attainment'] ?? '');
                $payload[$colEdu] = $eduVal === '' ? 'N/A' : $eduVal;
                $payload[$colIncome] = ($m['monthlyIncome'] ?? ($m['monthly_income'] ?? '')) == ''
                    ? 'N/A'
                    : ($m['monthlyIncome'] ?? $m['monthly_income']);

                if ($colCode !== null) {
                    $codeVal = isset($m['code']) && $m['code'] !== '' ? $m['code'] : 'N/A';
                    $payload[$colCode] = $codeVal;
                }

                DB::table('household_mem')->insert($payload);
            }
        }

        if ($allowSpouse && $spouse_name) {
            $exists = DB::table('household_mem')
                ->where('survey_id', $survey_id)
                ->where('name', $spouse_name)
                ->count();
            if ($exists === 0) {
                $hmCols = Schema::getColumnListing('household_mem');
                $colCivil = in_array('civilStatus', $hmCols) ? 'civilStatus' : 'civil_status';
                $colEdu = in_array('educationalAttainment', $hmCols) ? 'educationalAttainment' : 'educational_attainment';
                $colIncome = in_array('monthlyIncome', $hmCols) ? 'monthlyIncome' : 'monthly_income';
                $colSex = null;
                if (in_array('sex', $hmCols)) {
                    $colSex = 'sex';
                } elseif (in_array('gender', $hmCols)) {
                    $colSex = 'gender';
                }
                $colCode = in_array('code', $hmCols) ? 'code' : null;

                $payload = [
                    'survey_id' => $survey_id,
                    'name' => $spouse_name,
                    'age' => isset($spouse_age) && is_numeric($spouse_age) ? (int)$spouse_age : null,
                    'relationship' => 'Spouse',
                    'occupation' => 'N/A',
                ];

                if ($colSex !== null) {
                    $payload[$colSex] = $spouse_gender;
                }

                $payload[$colCivil] = $marital_status;
                $payload[$colEdu] = 'N/A';
                $payload[$colIncome] = 'N/A';

                if ($colCode !== null) {
                    $payload[$colCode] = 'N/A';
                }

                DB::table('household_mem')->insert($payload);
            }
        }

        return response()->json(['success' => true, 'survey_id' => $survey_id, 'tag_number' => $tagNumber, 'message' => 'Survey submitted successfully']);
    }

    protected function getBarangayCode(string $barangay): string
    {
        $map = [
            'Aplaya' => 'A',
            'Balabag' => 'B',
            'Binaton' => 'C',
            'Cogon' => 'D',
            'Colorado' => 'E',
            'Dawis' => 'F',
            'Dulangan' => 'G',
            'Goma' => 'H',
            'Igpit' => 'I',
            'Kapatagan' => 'J',
            'Kiagot' => 'K',
            'Lungag' => 'L',
            'Mahatahay' => 'M',
            'Matti' => 'N',
            'Ruparan' => 'O',
            'San Agustin' => 'P',
            'San Jose' => 'Q',
            'San Miguel' => 'R',
            'San Roque' => 'S',
            'Sinawilan' => 'T',
            'Soong' => 'U',
            'Tiguman' => 'V',
            'Tres De Mayo' => 'W',
            'Zone I' => 'X',
            'Zone II' => 'Y',
            'Zone III' => 'Z',
        ];

        return $map[$barangay] ?? 'Z';
    }

    protected function generateTagNumber(string $barangay): string
    {
        $code = $this->getBarangayCode($barangay);

        $maxTag = DB::table('demographic')
            ->where('barangay', $barangay)
            ->where('tag_number', 'like', $code . '%')
            ->lockForUpdate()
            ->max('tag_number');

        $nextSeq = 1;
        if ($maxTag) {
            $numericPart = substr($maxTag, 1);
            $parsed = (int)$numericPart;
            if ($parsed > 0) {
                $nextSeq = $parsed + 1;
            }
        }

        $seqStr = str_pad((string)$nextSeq, 3, '0', STR_PAD_LEFT);
        $tagNumber = $code . $seqStr;

        Log::info('Generated tag number', [
            'barangay' => $barangay,
            'tag_number' => $tagNumber,
        ]);

        return $tagNumber;
    }

    // Mobile: simple connectivity test
    public function mobilePing(Request $request)
    {
        return response()->json(['success' => true, 'message' => 'Server is reachable', 'timestamp' => date('Y-m-d H:i:s')]);
    }
}
