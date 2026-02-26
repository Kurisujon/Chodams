<?php

namespace App\Http\Controllers;

use App\Services\FileStorageService;
use App\Services\FileValidator;
use App\Services\FileStorage;
use App\Services\BeneficiaryScoreService;
use App\Exceptions\ScoreCalculationException;
use App\Models\Survey;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ValidatorDashboardController extends Controller
{
    /**
     * Get validation rules for survey creation
     * 
     * @return array<string, string|array>
     */
    protected function getSurveyValidationRules(): array
    {
        return [
            // Classification fields
            'classification' => 'required|string|in:Displaced,Double-up,Homeless,Upgrading of Land Tenure',
            'previous_client' => 'required|string|in:Yes,No',
            'year_inhabited' => 'nullable|integer|min:1900|max:' . date('Y'),
            'sub_class_displaced' => 'nullable|string',
            'sub_class_double_up' => 'nullable|string',
            'sub_class_homeless' => 'nullable|string',
            
            // Personal information (required fields)
            'interview_person' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'first_name' => 'required|string|max:255',
            'barangay' => 'required|string|max:255',
            'gender' => 'required|string|in:Male,Female',
            'birth_date' => 'required|date|before:today',
            'marital_status' => 'required|string|in:Single,Married,Live-in,Widow/Widower,Annulled,Separated,Unknown',
            
            // Personal information (optional fields)
            'middle_name' => 'nullable|string|max:255',
            'suffix' => 'nullable|string|max:50',
            'purok' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'religion' => 'nullable|string|max:255',
            'other_religion' => 'nullable|string|max:255',
            'birth_place' => 'nullable|string|max:255',
            'person_age' => 'nullable|integer|min:0|max:150',
            'contact_number' => 'nullable|string|max:20',
            'language_spoken' => 'nullable|string|max:255',
            'tribe' => 'nullable|string|max:255',
            'other_tribe' => 'nullable|string|max:255',
            
            // Education fields
            'highest_education' => 'nullable|string|max:255',
            'last_school_attended' => 'nullable|string|max:255',
            'year_graduated' => 'nullable|integer|min:1900|max:' . date('Y'),
            
            // Spouse information (conditional on marital status)
            'spouse_name' => 'nullable|string|max:255',
            'spouse_religion' => 'nullable|string|max:255',
            'other_spouse_religion' => 'nullable|string|max:255',
            'spouse_tribe' => 'nullable|string|max:255',
            'other_spouse_tribe' => 'nullable|string|max:255',
            'spouse_age' => 'nullable|integer|min:0|max:150',
            'spouse_gender' => 'nullable|string|in:Male,Female',
            
            // Affiliations
            'affiliations' => 'nullable|string|max:500',
            'endorsed_by_mayor' => 'nullable|string|in:Yes,No',
            
            // Household fields
            'lot_ownership' => 'nullable|string|max:255',
            'house_ownership' => 'nullable|string|max:255',
            'avail_socialized_housing' => 'nullable|string|in:Yes,No',
            'temporary_living_area' => 'nullable|string|max:255',
            'housing_structure' => 'nullable|string|max:255',
            'other_housing_structure' => 'nullable|string|max:255',
            'type_of_toilet' => 'nullable|string|max:255',
            'other_type_of_toilet' => 'nullable|string|max:255',
            'source_of_water' => 'nullable|string|max:255',
            'other_source_of_water' => 'nullable|string|max:255',
            'source_of_electricity' => 'nullable|string|max:255',
            'other_source_of_electricity' => 'nullable|string|max:255',
            
            // Economic fields
            'main_income_source' => 'nullable|string|max:255',
            'other_main_income_source' => 'nullable|string|max:255',
            'work_status' => 'nullable|string|max:255',
            'other_work_status' => 'nullable|string|max:255',
            'work_location_head' => 'nullable|string|max:255',
            'monthly_salary' => 'required|string|max:255',
            'combine_monthly_income' => 'nullable|string|max:255',
            
            // Training fields
            'skills_for_living' => 'nullable|string|in:Yes,No',
            'specific_skill' => 'nullable|string|max:255',
            'other_skill' => 'nullable|string|max:255',
            'organization_member' => 'nullable|string|in:Yes,No',
            'specific_organization' => 'nullable|string|max:255',
            'other_organization' => 'nullable|string|max:255',
            'wanttolearn' => 'nullable|string|max:500',
            'remarks' => 'nullable|string|max:1000',
            
            // Location and signatures
            'latitude' => 'nullable|string|max:50',
            'longitude' => 'nullable|string|max:50',
            'respondent_signature' => 'nullable|string',
            'validator_signature' => 'nullable|string',
            
            // Files
            'house_photo' => 'nullable|file|image|max:5120',
            'person_photo' => 'nullable|file|image|max:5120',
            
            // Interview metadata
            'date_interviewed' => 'nullable|date',
            
            // Household members (arrays)
            'name' => 'nullable|array',
            'name.*' => 'nullable|string|max:255',
            'age' => 'nullable|array',
            'age.*' => 'nullable|integer|min:0|max:150',
            'sex' => 'nullable|array',
            'sex.*' => 'nullable|string|in:Male,Female',
            'relationship' => 'nullable|array',
            'relationship.*' => 'nullable|string|max:255',
            'civil_status' => 'nullable|array',
            'civil_status.*' => 'nullable|string|max:255',
            'educational_attainment' => 'nullable|array',
            'educational_attainment.*' => 'nullable|string|max:255',
            'occupation' => 'nullable|array',
            'occupation.*' => 'nullable|string|max:255',
            'monthly_income' => 'nullable|array',
            'monthly_income.*' => 'nullable|string|max:255',
            'code' => 'nullable|array',
            'code.*' => 'nullable|string|max:50',
        ];
    }

    /**
     * Get custom validation messages for survey creation
     * 
     * @return array<string, string>
     */
    protected function getSurveyValidationMessages(): array
    {
        return [
            // Classification field messages
            'classification.required' => 'The classification field is required.',
            'classification.in' => 'The classification field is invalid.',
            'previous_client.required' => 'The previous client field is required.',
            'previous_client.in' => 'The previous client field is invalid.',
            'year_inhabited.integer' => 'The year inhabited field must be an integer.',
            'year_inhabited.min' => 'The year inhabited field must be at least 1900.',
            'year_inhabited.max' => 'The year inhabited field must not exceed ' . date('Y') . '.',
            
            // Personal information (required fields) messages
            'interview_person.required' => 'The interview person field is required.',
            'interview_person.max' => 'The interview person field must not exceed 255 characters.',
            'last_name.required' => 'The last name field is required.',
            'last_name.max' => 'The last name field must not exceed 255 characters.',
            'first_name.required' => 'The first name field is required.',
            'first_name.max' => 'The first name field must not exceed 255 characters.',
            'barangay.required' => 'The barangay field is required.',
            'barangay.max' => 'The barangay field must not exceed 255 characters.',
            'gender.required' => 'The gender field is required.',
            'gender.in' => 'The gender field is invalid.',
            'birth_date.required' => 'The birth date field is required.',
            'birth_date.date' => 'The birth date field must be a valid date.',
            'birth_date.before' => 'The birth date field must be before today.',
            'marital_status.required' => 'The marital status field is required.',
            'marital_status.in' => 'The marital status field is invalid.',
            
            // Personal information (optional fields) messages
            'middle_name.max' => 'The middle name field must not exceed 255 characters.',
            'suffix.max' => 'The suffix field must not exceed 50 characters.',
            'purok.max' => 'The purok field must not exceed 255 characters.',
            'street.max' => 'The street field must not exceed 255 characters.',
            'religion.max' => 'The religion field must not exceed 255 characters.',
            'other_religion.max' => 'The other religion field must not exceed 255 characters.',
            'birth_place.max' => 'The birth place field must not exceed 255 characters.',
            'person_age.integer' => 'The person age field must be an integer.',
            'person_age.min' => 'The person age field must be at least 0.',
            'person_age.max' => 'The person age field must not exceed 150.',
            'contact_number.max' => 'The contact number field must not exceed 20 characters.',
            'language_spoken.max' => 'The language spoken field must not exceed 255 characters.',
            'tribe.max' => 'The tribe field must not exceed 255 characters.',
            'other_tribe.max' => 'The other tribe field must not exceed 255 characters.',
            
            // Education field messages
            'highest_education.max' => 'The highest education field must not exceed 255 characters.',
            'last_school_attended.max' => 'The last school attended field must not exceed 255 characters.',
            'year_graduated.integer' => 'The year graduated field must be an integer.',
            'year_graduated.min' => 'The year graduated field must be at least 1900.',
            'year_graduated.max' => 'The year graduated field must not exceed ' . date('Y') . '.',
            
            // Spouse information messages
            'spouse_name.max' => 'The spouse name field must not exceed 255 characters.',
            'spouse_religion.max' => 'The spouse religion field must not exceed 255 characters.',
            'other_spouse_religion.max' => 'The other spouse religion field must not exceed 255 characters.',
            'spouse_tribe.max' => 'The spouse tribe field must not exceed 255 characters.',
            'other_spouse_tribe.max' => 'The other spouse tribe field must not exceed 255 characters.',
            'spouse_age.integer' => 'The spouse age field must be an integer.',
            'spouse_age.min' => 'The spouse age field must be at least 0.',
            'spouse_age.max' => 'The spouse age field must not exceed 150.',
            'spouse_gender.in' => 'The spouse gender field is invalid.',
            
            // Affiliation messages
            'affiliations.max' => 'The affiliations field must not exceed 500 characters.',
            'endorsed_by_mayor.in' => 'The endorsed by mayor field is invalid.',
            
            // Household field messages
            'lot_ownership.max' => 'The lot ownership field must not exceed 255 characters.',
            'house_ownership.max' => 'The house ownership field must not exceed 255 characters.',
            'avail_socialized_housing.in' => 'The avail socialized housing field is invalid.',
            'temporary_living_area.max' => 'The temporary living area field must not exceed 255 characters.',
            'housing_structure.max' => 'The housing structure field must not exceed 255 characters.',
            'other_housing_structure.max' => 'The other housing structure field must not exceed 255 characters.',
            'type_of_toilet.max' => 'The type of toilet field must not exceed 255 characters.',
            'other_type_of_toilet.max' => 'The other type of toilet field must not exceed 255 characters.',
            'source_of_water.max' => 'The source of water field must not exceed 255 characters.',
            'other_source_of_water.max' => 'The other source of water field must not exceed 255 characters.',
            'source_of_electricity.max' => 'The source of electricity field must not exceed 255 characters.',
            'other_source_of_electricity.max' => 'The other source of electricity field must not exceed 255 characters.',
            
            // Economic field messages
            'main_income_source.max' => 'The main income source field must not exceed 255 characters.',
            'other_main_income_source.max' => 'The other main income source field must not exceed 255 characters.',
            'work_status.max' => 'The work status field must not exceed 255 characters.',
            'other_work_status.max' => 'The other work status field must not exceed 255 characters.',
            'work_location_head.max' => 'The work location head field must not exceed 255 characters.',
            'monthly_salary.required' => 'The monthly salary field is required.',
            'monthly_salary.max' => 'The monthly salary field must not exceed 255 characters.',
            'combine_monthly_income.max' => 'The combine monthly income field must not exceed 255 characters.',
            
            // Training field messages
            'skills_for_living.in' => 'The skills for living field is invalid.',
            'specific_skill.max' => 'The specific skill field must not exceed 255 characters.',
            'other_skill.max' => 'The other skill field must not exceed 255 characters.',
            'organization_member.in' => 'The organization member field is invalid.',
            'specific_organization.max' => 'The specific organization field must not exceed 255 characters.',
            'other_organization.max' => 'The other organization field must not exceed 255 characters.',
            'wanttolearn.max' => 'The wanttolearn field must not exceed 500 characters.',
            'remarks.max' => 'The remarks field must not exceed 1000 characters.',
            
            // Location and signature messages
            'latitude.max' => 'The latitude field must not exceed 50 characters.',
            'longitude.max' => 'The longitude field must not exceed 50 characters.',
            
            // File upload messages
            'house_photo.file' => 'The house photo field must be a file.',
            'house_photo.image' => 'The house photo field must be an image file.',
            'house_photo.max' => 'The house photo field must not exceed 5MB.',
            'person_photo.file' => 'The person photo field must be a file.',
            'person_photo.image' => 'The person photo field must be an image file.',
            'person_photo.max' => 'The person photo field must not exceed 5MB.',
            
            // Interview metadata messages
            'date_interviewed.date' => 'The date interviewed field must be a valid date.',
            
            // Household member array messages
            'name.array' => 'The name field must be an array.',
            'name.*.max' => 'Each name field must not exceed 255 characters.',
            'age.array' => 'The age field must be an array.',
            'age.*.integer' => 'Each age field must be an integer.',
            'age.*.min' => 'Each age field must be at least 0.',
            'age.*.max' => 'Each age field must not exceed 150.',
            'sex.array' => 'The sex field must be an array.',
            'sex.*.in' => 'Each sex field is invalid.',
            'relationship.array' => 'The relationship field must be an array.',
            'relationship.*.max' => 'Each relationship field must not exceed 255 characters.',
            'civil_status.array' => 'The civil status field must be an array.',
            'civil_status.*.max' => 'Each civil status field must not exceed 255 characters.',
            'educational_attainment.array' => 'The educational attainment field must be an array.',
            'educational_attainment.*.max' => 'Each educational attainment field must not exceed 255 characters.',
            'occupation.array' => 'The occupation field must be an array.',
            'occupation.*.max' => 'Each occupation field must not exceed 255 characters.',
            'monthly_income.array' => 'The monthly income field must be an array.',
            'monthly_income.*.max' => 'Each monthly income field must not exceed 255 characters.',
            'code.array' => 'The code field must be an array.',
            'code.*.max' => 'Each code field must not exceed 50 characters.',
        ];
    }

    protected function normalizeBarangay(string $barangay): string
    {
        $b = str_replace('_', ' ', $barangay);
        $b = preg_replace('/\s+/', ' ', trim($b));

        return $b;
    }

    protected function primaryAffiliationFromString(?string $affiliations): ?string
    {
        if (! is_string($affiliations)) {
            return null;
        }

        $str = trim($affiliations);
        if ($str === '') {
            return null;
        }

        $parts = array_values(array_filter(array_map('trim', explode(',', $str)), function ($v) {
            return $v !== '';
        }));

        if (empty($parts)) {
            return null;
        }

        $primary = $parts[0];
        if (strcasecmp($primary, 'None') === 0 && count($parts) > 1) {
            $primary = $parts[1];
        }

        return $primary;
    }

    // Return totals
    public function totals(Request $request)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $cacheKey = 'validator_totals_'.$validator_id;
        $data = Cache::remember($cacheKey, 30, function () use ($validator_id) {
            $hasDeletedAt = Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at');

            $surveyedQuery = DB::table('survey as s')
                ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->where('s.validator_id', $validator_id);
            if ($hasDeletedAt) {
                $surveyedQuery->whereNull('s.deleted_at');
            }

            $submittedQuery = DB::table('survey as s')
                ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->where('s.validator_id', $validator_id)
                ->whereIn('s.is_submitted', [1, 2, 3]);
            if ($hasDeletedAt) {
                $submittedQuery->whereNull('s.deleted_at');
            }

            $total_surveyed = $surveyedQuery
                ->distinct('s.survey_id')
                ->count('s.survey_id');

            $total_submitted = $submittedQuery
                ->distinct('s.survey_id')
                ->count('s.survey_id');

            return [
                'total_surveyed' => $total_surveyed,
                'total_submitted' => $total_submitted,
            ];
        });

        return response()->json($data);
    }

    // Paginated surveyed
    public function surveys(Request $request)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $offset = ($page - 1) * $perPage;
        $search = $request->get('search', '');
        $barangayFilter = $request->get('barangay', '');
        $classFilter = $request->get('classification', '');

        $hasDeletedAt = Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at');

        $totalQuery = DB::table('survey AS s')
            ->join('demographic AS d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification AS c', 'c.survey_id', '=', 's.survey_id')
            ->where('s.validator_id', $validator_id)
            ->where('s.is_submitted', 0);
        
        if ($hasDeletedAt) {
            $totalQuery->whereNull('s.deleted_at');
        }
        
        // Apply barangay filter
        if ($barangayFilter) {
            $totalQuery->where('d.barangay', $barangayFilter);
        }
        
        // Apply classification filter
        if ($classFilter) {
            $classMap = [
                'Displaced' => 1,
                'Double-up' => 2,
                'Homeless' => 3,
                'Upgrading of Land Tenure' => 4,
            ];
            if (isset($classMap[$classFilter])) {
                $totalQuery->where('c.classification', $classMap[$classFilter]);
            }
        }
        
        // Apply search filter
        if ($search) {
            $totalQuery->where(function($q) use ($search) {
                $q->where('d.last_name', 'like', "%{$search}%")
                  ->orWhere('d.first_name', 'like', "%{$search}%")
                  ->orWhere('d.barangay', 'like', "%{$search}%")
                  ->orWhere('d.purok', 'like', "%{$search}%");
            });
        }
        
        $total = $totalQuery->count();

        $rowsQuery = DB::table('survey AS s')
            ->join('demographic AS d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification AS c', 'c.survey_id', '=', 's.survey_id')
            ->select('s.survey_id', 's.date_interviewed', 'd.barangay', 'd.purok', 'd.last_name', 'c.classification', 'c.subclass_displaced', 'c.subclass_doubleup', 'c.subclass_homeless')
            ->where('s.validator_id', $validator_id)
            ->where('s.is_submitted', 0);
        
        if ($hasDeletedAt) {
            $rowsQuery->whereNull('s.deleted_at');
        }
        
        // Apply barangay filter
        if ($barangayFilter) {
            $rowsQuery->where('d.barangay', $barangayFilter);
        }
        
        // Apply classification filter
        if ($classFilter) {
            $classMap = [
                'Displaced' => 1,
                'Double-up' => 2,
                'Homeless' => 3,
                'Upgrading of Land Tenure' => 4,
            ];
            if (isset($classMap[$classFilter])) {
                $rowsQuery->where('c.classification', $classMap[$classFilter]);
            }
        }
        
        // Apply search filter
        if ($search) {
            $rowsQuery->where(function($q) use ($search) {
                $q->where('d.last_name', 'like', "%{$search}%")
                  ->orWhere('d.first_name', 'like', "%{$search}%")
                  ->orWhere('d.barangay', 'like', "%{$search}%")
                  ->orWhere('d.purok', 'like', "%{$search}%");
            });
        }
        
        $rows = $rowsQuery
            ->orderBy('d.barangay', 'asc')
            ->orderBy('c.classification', 'asc')
            ->orderBy('s.survey_id', 'desc')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->map(function ($row) {
                $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
                    6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
                ];
                $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
                $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?: '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?: '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?: '');

                return $row;
            });

        return response()->json([
            'data' => $rows,
            'total' => $total,
            'per_page' => $perPage,
            'page' => $page,
        ]);
    }

    // Paginated submitted
    public function submitted(Request $request)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $offset = ($page - 1) * $perPage;
        $search = $request->get('search', '');
        $barangayFilter = $request->get('barangay', '');
        $classFilter = $request->get('classification', '');

        $hasDeletedAt = Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at');

        $totalQuery = DB::table('survey AS s')
            ->join('demographic AS d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification AS c', 'c.survey_id', '=', 's.survey_id')
            ->where('s.validator_id', $validator_id)
            ->whereIn('s.is_submitted', [1, 2, 3]);
        
        if ($hasDeletedAt) {
            $totalQuery->whereNull('s.deleted_at');
        }
        
        // Apply barangay filter
        if ($barangayFilter) {
            $totalQuery->where('d.barangay', $barangayFilter);
        }
        
        // Apply classification filter
        if ($classFilter) {
            $classMap = [
                'Displaced' => 1,
                'Double-up' => 2,
                'Homeless' => 3,
                'Upgrading of Land Tenure' => 4,
            ];
            if (isset($classMap[$classFilter])) {
                $totalQuery->where('c.classification', $classMap[$classFilter]);
            }
        }
        
        // Apply search filter
        if ($search) {
            $totalQuery->where(function($q) use ($search) {
                $q->where('d.last_name', 'like', "%{$search}%")
                  ->orWhere('d.first_name', 'like', "%{$search}%")
                  ->orWhere('d.barangay', 'like', "%{$search}%")
                  ->orWhere('d.purok', 'like', "%{$search}%");
            });
        }
        
        $total = $totalQuery->count();

        $rowsQuery = DB::table('survey AS s')
            ->join('demographic AS d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification AS c', 'c.survey_id', '=', 's.survey_id')
            ->select('s.survey_id', 's.date_interviewed', 'd.barangay', 'd.purok', 'd.last_name', 'c.classification', 'c.subclass_displaced', 'c.subclass_doubleup', 'c.subclass_homeless')
            ->where('s.validator_id', $validator_id)
            ->whereIn('s.is_submitted', [1, 2, 3]);
        
        if ($hasDeletedAt) {
            $rowsQuery->whereNull('s.deleted_at');
        }
        
        // Apply barangay filter
        if ($barangayFilter) {
            $rowsQuery->where('d.barangay', $barangayFilter);
        }
        
        // Apply classification filter
        if ($classFilter) {
            $classMap = [
                'Displaced' => 1,
                'Double-up' => 2,
                'Homeless' => 3,
                'Upgrading of Land Tenure' => 4,
            ];
            if (isset($classMap[$classFilter])) {
                $rowsQuery->where('c.classification', $classMap[$classFilter]);
            }
        }
        
        // Apply search filter
        if ($search) {
            $rowsQuery->where(function($q) use ($search) {
                $q->where('d.last_name', 'like', "%{$search}%")
                  ->orWhere('d.first_name', 'like', "%{$search}%")
                  ->orWhere('d.barangay', 'like', "%{$search}%")
                  ->orWhere('d.purok', 'like', "%{$search}%");
            });
        }
        
        $rows = $rowsQuery
            ->orderBy('d.barangay', 'asc')
            ->orderBy('c.classification', 'asc')
            ->orderBy('s.survey_id', 'desc')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->map(function ($row) {
                $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
                    6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
                ];
                $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
                $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?: '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?: '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?: '');

                return $row;
            });

        return response()->json([
            'data' => $rows,
            'total' => $total,
            'per_page' => $perPage,
            'page' => $page,
        ]);
    }

    public function submitSurvey(Request $request)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $survey_id = $request->input('survey_id');
        if (! $survey_id) {
            return response()->json(['message' => 'Missing survey_id'], 400);
        }

        $hasDeletedAt = Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at');
        $updateQuery = DB::table('survey')
            ->where('survey_id', $survey_id)
            ->where('validator_id', $validator_id)
            ->where('is_submitted', 0);
        if ($hasDeletedAt) {
            $updateQuery->whereNull('deleted_at');
        }
        $updated = $updateQuery->update(['is_submitted' => 1]);

        return response()->json(['updated' => (bool) $updated]);
    }

    public function submitSurveysBatch(Request $request)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $ids = $request->input('survey_ids');
        if (! is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'Missing survey_ids'], 400);
        }

        $ids = array_values(array_unique(array_map('intval', $ids)));
        $ids = array_filter($ids, function ($v) {
            return $v > 0;
        });
        if (empty($ids)) {
            return response()->json(['message' => 'Missing survey_ids'], 400);
        }

        $hasDeletedAt = Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at');
        $updateQuery = DB::table('survey')
            ->where('validator_id', $validator_id)
            ->whereIn('survey_id', $ids)
            ->where('is_submitted', 0);
        if ($hasDeletedAt) {
            $updateQuery->whereNull('deleted_at');
        }
        $updated = $updateQuery->update(['is_submitted' => 1]);

        return response()->json(['updated' => (int) $updated]);
    }

    // Get all survey IDs based on current filters  
    public function getAllSurveyIds(Request $request)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $search = $request->get('search', '');
        $barangayFilter = $request->get('barangay', '');
        $classFilter = $request->get('classification', '');
        
        $hasDeletedAt = Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at');
        
        $query = DB::table('survey AS s')
            ->join('demographic AS d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification AS c', 'c.survey_id', '=', 's.survey_id')
            ->select('s.survey_id')
            ->where('s.validator_id', $validator_id)
            ->where('s.is_submitted', 0);
            
        if ($hasDeletedAt) {
            $query->whereNull('s.deleted_at');
        }
        
        // Apply barangay filter
        if ($barangayFilter) {
            $query->where('d.barangay', $barangayFilter);
        }
        
        // Apply classification filter
        if ($classFilter) {
            $classMap = [
                'Displaced' => 1,
                'Double-up' => 2,
                'Homeless' => 3,
                'Upgrading of Land Tenure' => 4,
            ];
            if (isset($classMap[$classFilter])) {
                $query->where('c.classification', $classMap[$classFilter]);
            }
        }
        
        // Apply search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('d.last_name', 'like', "%{$search}%")
                  ->orWhere('d.first_name', 'like', "%{$search}%")
                  ->orWhere('d.barangay', 'like', "%{$search}%")
                  ->orWhere('d.purok', 'like', "%{$search}%");
            });
        }
        
        $ids = $query->pluck('s.survey_id')->map(fn($id) => (int)$id)->values()->all();
        
        return response()->json(['ids' => $ids]);
    }

    public function deleted(Request $request)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! Schema::hasTable('survey') || ! Schema::hasColumn('survey', 'deleted_at')) {
            return response()->json([
                'data' => [],
                'total' => 0,
                'per_page' => (int) $request->get('per_page', 10),
                'page' => (int) $request->get('page', 1),
            ]);
        }
        
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $offset = ($page - 1) * $perPage;
        $search = $request->get('search', '');
        $barangayFilter = $request->get('barangay', '');
        $classFilter = $request->get('classification', '');
        
        $totalQuery = DB::table('survey AS s')
            ->join('demographic AS d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification AS c', 'c.survey_id', '=', 's.survey_id')
            ->where('s.validator_id', $validator_id)
            ->whereNotNull('s.deleted_at');
        
        // Apply barangay filter
        if ($barangayFilter) {
            $totalQuery->where('d.barangay', $barangayFilter);
        }
        
        // Apply classification filter
        if ($classFilter) {
            $classMap = [
                'Displaced' => 1,
                'Double-up' => 2,
                'Homeless' => 3,
                'Upgrading of Land Tenure' => 4,
            ];
            if (isset($classMap[$classFilter])) {
                $totalQuery->where('c.classification', $classMap[$classFilter]);
            }
        }
        
        // Apply search filter
        if ($search) {
            $totalQuery->where(function($q) use ($search) {
                $q->where('d.last_name', 'like', "%{$search}%")
                  ->orWhere('d.first_name', 'like', "%{$search}%")
                  ->orWhere('d.barangay', 'like', "%{$search}%")
                  ->orWhere('d.purok', 'like', "%{$search}%");
            });
        }
        
        $total = $totalQuery->count();
        
        $rowsQuery = DB::table('survey AS s')
            ->join('demographic AS d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification AS c', 'c.survey_id', '=', 's.survey_id')
            ->select('s.survey_id', 's.date_interviewed', 'd.barangay', 'd.purok', 'd.last_name', 'c.classification', 'c.subclass_displaced', 'c.subclass_doubleup', 's.deleted_at')
            ->where('s.validator_id', $validator_id)
            ->whereNotNull('s.deleted_at');
        
        // Apply barangay filter
        if ($barangayFilter) {
            $rowsQuery->where('d.barangay', $barangayFilter);
        }
        
        // Apply classification filter
        if ($classFilter) {
            $classMap = [
                'Displaced' => 1,
                'Double-up' => 2,
                'Homeless' => 3,
                'Upgrading of Land Tenure' => 4,
            ];
            if (isset($classMap[$classFilter])) {
                $rowsQuery->where('c.classification', $classMap[$classFilter]);
            }
        }
        
        // Apply search filter
        if ($search) {
            $rowsQuery->where(function($q) use ($search) {
                $q->where('d.last_name', 'like', "%{$search}%")
                  ->orWhere('d.first_name', 'like', "%{$search}%")
                  ->orWhere('d.barangay', 'like', "%{$search}%")
                  ->orWhere('d.purok', 'like', "%{$search}%");
            });
        }
        
        $rows = $rowsQuery
            ->orderBy('s.deleted_at', 'desc')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->map(function ($row) {
                $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
                    6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
                ];
                $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?: '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?: '');

                return $row;
            });

        return response()->json(['data' => $rows, 'total' => $total, 'per_page' => $perPage, 'page' => $page]);
    }

    public function surveyDetails(Request $request, $survey_id)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $hasDeletedAt = Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at');

        $sQuery = DB::table('survey as s')
            ->where('s.survey_id', $survey_id)
            ->where('s.validator_id', $validator_id);
        if ($hasDeletedAt) {
            $sQuery->whereNull('s.deleted_at');
        }
        $s = $sQuery->first();
        if (! $s) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $c = DB::table('classification')->where('survey_id', $survey_id)->first();
        $d = DB::table('demographic')->where('survey_id', $survey_id)->first();
        $h = DB::table('household')->where('survey_id', $survey_id)->first();
        $e = DB::table('economic')->where('survey_id', $survey_id)->first();
        $t = DB::table('training')->where('survey_id', $survey_id)->first();

        $surveyArr = [];
        $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
        $displacedLabel = [
            1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
            6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
        ];
        $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
        $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
        $ynLabel = [0 => 'No', 1 => 'Yes'];
        $genderLabel = [1 => 'Male', 2 => 'Female'];
        $affLabel = [0 => 'None', 1 => 'SSS', 2 => 'GSIS', 3 => 'PhilHealth', 4 => 'PagIbig', 5 => 'PWD', 6 => 'Senior_Citizen', 7 => 'Solo_Parent', 8 => '4Ps'];
        $validatorName = null;
        $validatorSignatureData = null;
        if (! empty($s->validator_id)) {
            $validatorRow = DB::table('validator')
                ->select('name', 'signature_data')
                ->where('validator_id', $s->validator_id)
                ->first();
            if ($validatorRow) {
                $validatorName = $validatorRow->name ?? null;
                $validatorSignatureData = $validatorRow->signature_data ?? null;
            }
        }

        $surveyArr['survey_id'] = $survey_id;
        $surveyArr['interviewed_by'] = $s->interviewed_by ?? null;
        $surveyArr['date_interviewed'] = $s->date_interviewed ?? null;
        $surveyArr['is_submitted'] = $s->is_submitted ?? null;
        $surveyArr['validator_signature'] = $validatorSignatureData ?: ($s->validator_signature ?? null);
        $surveyArr['validator_name'] = $validatorName;

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
            $primaryAff = $this->primaryAffiliationFromString($d->affiliations ?? null);
            if ($primaryAff === null) {
                $key = $d->affiliation ?? null;
                if (array_key_exists($key, $affLabel)) {
                    $primaryAff = $affLabel[$key];
                } else {
                    $primaryAff = $key;
                }
            }
            $surveyArr['affiliation'] = $primaryAff;
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
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $row = DB::table('training as t')
            ->join('survey as s', 's.survey_id', '=', 't.survey_id')
            ->select('t.house_photo')
            ->where('t.survey_id', $survey_id)
            ->where('s.validator_id', $validator_id)
            ->first();

        if (! $row || empty($row->house_photo)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $pathStr = trim((string) $row->house_photo);
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
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $row = DB::table('training as t')
            ->join('survey as s', 's.survey_id', '=', 't.survey_id')
            ->select('t.person_photo')
            ->where('t.survey_id', $survey_id)
            ->where('s.validator_id', $validator_id)
            ->first();

        if (! $row || empty($row->person_photo)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $pathStr = trim((string) $row->person_photo);
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
        if (! $validator_id || ! $interviewed_by) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Validate request using defined rules
        try {
            $validated = $request->validate(
                $this->getSurveyValidationRules(),
                $this->getSurveyValidationMessages()
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Prepare data for logging, excluding sensitive fields
            $failedFields = array_keys($e->errors());
            $submittedData = $request->except([
                'respondent_signature',
                'validator_signature',
                'password',
                'password_confirmation',
            ]);
            
            // Only include failed field values in log
            $failedFieldValues = [];
            foreach ($failedFields as $field) {
                if (isset($submittedData[$field])) {
                    $failedFieldValues[$field] = $submittedData[$field];
                }
            }
            
            // Log validation failure
            Log::info('Survey validation failed', [
                'validator_id' => $validator_id,
                'timestamp' => now()->toDateTimeString(),
                'failed_fields' => $failedFields,
                'failed_field_values' => $failedFieldValues,
                'errors' => $e->errors(),
            ]);
            
            // Return validation errors in standard Laravel format
            return response()->json([
                'message' => 'Validation failed. Please check the highlighted fields.',
                'errors' => $e->errors(),
            ], 422);
        }

        $normalize = function ($v) {
            if ($v === null) {
                return null;
            }
            $v = is_string($v) ? trim($v) : $v;

            return is_string($v) ? str_replace('_', ' ', $v) : $v;
        };

        // Helper function to convert empty strings to NULL for optional fields
        $toNullIfEmpty = function ($v) {
            if ($v === null) {
                return null;
            }
            $trimmed = is_string($v) ? trim($v) : $v;
            return ($trimmed === '' || $trimmed === null) ? null : $trimmed;
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

        // Handle religion "other" option
        $religion = $normalize($request->input('religion'));
        if ($religion === 'Other' || $religion === 'Others' || $religion === 'other') {
            $religion = $normalize($request->input('other_religion'));
        }
        
        $spouse_religion = $normalize($request->input('spouse_religion'));
        if ($spouse_religion === 'Other' || $spouse_religion === 'Others' || $spouse_religion === 'other') {
            $spouse_religion = $normalize($request->input('other_spouse_religion'));
        }
        
        // Handle tribe and spouse_tribe "others" option
        $tribe = $normalize($request->input('tribe'));
        if ($tribe === 'others' || $tribe === 'Others') {
            $tribe = $normalize($request->input('other_tribe'));
        }
        
        $spouse_tribe = $normalize($request->input('spouse_tribe'));
        if ($spouse_tribe === 'others' || $spouse_tribe === 'Others') {
            $spouse_tribe = $normalize($request->input('other_spouse_tribe'));
        }

        $file = $request->file('house_photo');
        $house_photo_path = '';
        if ($file && $file->isValid()) {
            if ($file->getSize() > 5 * 1024 * 1024) {
                return response()->json(['message' => 'File too large'], 422);
            }
            $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
            $mime = $file->getClientMimeType() ?: 'image/jpeg';
            if (! in_array($mime, $allowed)) {
                return response()->json(['message' => 'Invalid file type'], 422);
            }
            // Use FileStorageService for dual storage
            $result = FileStorageService::store($file, 'house_photos', 'house_');
            if ($result['success']) {
                $house_photo_path = $result['path']; // e.g., 'house_photos/house_xxx.jpg'
            }
        }

        $person_photo_path = null;
        $personFile = $request->file('person_photo');
        if ($personFile && $personFile->isValid()) {
            if ($personFile->getSize() > 5 * 1024 * 1024) {
                return response()->json(['message' => 'File too large'], 422);
            }
            $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
            $mime = $personFile->getClientMimeType() ?: 'image/jpeg';
            if (! in_array($mime, $allowed)) {
                return response()->json(['message' => 'Invalid file type'], 422);
            }
            // Use FileStorageService for dual storage
            $result = FileStorageService::store($personFile, 'person_photos', 'person_');
            if ($result['success']) {
                $person_photo_path = $result['path']; // e.g., 'person_photos/person_xxx.jpg'
            }
        }

        $saveSignature = function ($input) {
            if (! $input) {
                return null;
            }
            $s = is_string($input) ? trim($input) : '';
            if ($s === '') {
                return null;
            }
            if (strpos($s, ',') !== false) {
                $parts = explode(',', $s);
                if (count($parts) !== 2) {
                    return null;
                }
                try {
                    $data = base64_decode($parts[1], true);
                    if ($data === false) {
                        Log::warning('Failed to decode signature base64 data');
                        return null;
                    }
                    $filename = uniqid('sig_').'.png';
                    
                    // Store in Laravel storage
                    Storage::disk('public')->put('signatures/'.$filename, $data);
                    
                    // Also copy to public directory using FileStorageService
                    try {
                        FileStorageService::copyToPublicDirectory('signatures', $filename);
                    } catch (\Exception $copyEx) {
                        // Log but don't fail - storage is already saved
                        Log::warning('Failed to copy signature to public directory', [
                            'filename' => $filename,
                            'error' => $copyEx->getMessage(),
                        ]);
                    }

                    return 'signatures/'.$filename; // Return path without 'storage/' prefix
                } catch (\Exception $sigEx) {
                    Log::error('Error processing signature', [
                        'error' => $sigEx->getMessage(),
                    ]);
                    return null;
                }
            }

            return $s;
        };

        $validator_signature = $saveSignature($request->input('validator_signature'));
        $respondent_signature = $saveSignature($request->input('respondent_signature'));

        $marital_status = $normalize($request->input('marital_status'));
        $allowSpouse = in_array($marital_status, ['Married', 'Live-in', 'Widow/Widower', 'Separated', 'Annulled']);

        $spouse_name = $allowSpouse ? $normalize($request->input('spouse_name')) : null;
        // Note: $spouse_religion and $spouse_tribe are already processed above with "other" handling
        $spouse_age = $allowSpouse ? $normalize($request->input('spouse_age')) : null;
        $spouse_gender = $allowSpouse ? $normalize($request->input('spouse_gender')) : null;
        
        // Apply allowSpouse logic to already-processed spouse fields
        if (!$allowSpouse) {
            $spouse_religion = null;
            $spouse_tribe = null;
        }

        $msInput = trim((string) $request->input('monthly_salary'));
        if ($msInput === '') {
            return response()->json(['message' => 'Monthly salary is required'], 422);
        }
        
        // Validate and prepare supporting documents
        $supportingDocuments = [];
        $uploadedFilePaths = [];
        
        if ($request->hasFile('supporting_documents')) {
            $fileValidator = new FileValidator();
            $fileStorage = new FileStorage();
            
            foreach ($request->file('supporting_documents', []) as $file) {
                // Validate file
                $validationResult = $fileValidator->validate($file);
                
                if (!$validationResult->isValid()) {
                    // Log validation failure
                    Log::warning('File validation failed during survey submission', [
                        'validator_id' => $validator_id,
                        'filename' => $file->getClientOriginalName(),
                        'errors' => $validationResult->getErrors(),
                        'timestamp' => now()->toDateTimeString(),
                    ]);
                    
                    return response()->json([
                        'message' => 'File validation failed: ' . $file->getClientOriginalName(),
                        'errors' => $validationResult->getErrors(),
                    ], 422);
                }
                
                // Store file
                $storageResult = $fileStorage->store($file, 'survey_documents');
                
                if (!$storageResult->isSuccess()) {
                    // Clean up any previously uploaded files
                    foreach ($uploadedFilePaths as $path) {
                        $fileStorage->delete($path);
                    }
                    
                    return response()->json([
                        'message' => 'Failed to store file: ' . $file->getClientOriginalName(),
                        'error' => $storageResult->getError(),
                    ], 500);
                }
                
                $supportingDocuments[] = [
                    'original_filename' => $file->getClientOriginalName(),
                    'stored_filename' => $storageResult->getFilename(),
                    'file_path' => $storageResult->getPath(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ];
                
                $uploadedFilePaths[] = $storageResult->getPath();
            }
        }
        
        try {
            $survey_id = DB::transaction(function () use ($validator_id, $interviewed_by, $request, $classification, $subclass_displaced, $subclass_doubleup, $subclass_homeless, $housing_structure, $type_of_toilet, $source_of_water, $source_of_electricity, $main_income_source, $work_status, $skills_for_living, $specific_skill, $organization_member, $specific_organization, $house_photo_path, $person_photo_path, $validator_signature, $respondent_signature, $marital_status, $spouse_name, $spouse_religion, $spouse_tribe, $spouse_age, $spouse_gender, $normalize, $msInput, $supportingDocuments, $toNullIfEmpty, $tribe, $religion) {
            $toInt = function ($v) {
                return is_numeric($v) ? (int) $v : null;
            };
            $yn = function ($v) {
                $s = is_string($v) ? strtolower(trim($v)) : $v;

                return ($s === 'yes' || $s === 1 || $s === '1') ? 1 : (($s === 'no' || $s === 0 || $s === '0') ? 0 : null);
            };
            $ynMayor = function ($v) {
                $s = is_string($v) ? strtolower(trim($v)) : $v;

                if ($s === 'yes' || $s === 1 || $s === '1') {
                    return 1;
                }
                if ($s === 'no' || $s === 2 || $s === '2' || $s === 0 || $s === '0') {
                    return 2;
                }

                return null;
            };
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
            $genderMap = ['male' => 1, 'female' => 2];

            $classificationCode = $classMap[strtolower((string) $classification)] ?? null;
            $subDisplacedCode = $subclass_displaced ? ($displacedMap[strtolower((string) $subclass_displaced)] ?? null) : null;
            $subDoubleupCode = $subclass_doubleup ? ($doubleupMap[strtolower((string) $subclass_doubleup)] ?? null) : null;
            $subHomelessCode = $subclass_homeless ? ($homelessMap[strtolower((string) $subclass_homeless)] ?? null) : null;
            $prevClientCode = $yn($request->input('previous_client'));
            $spouseGenderStr = is_string($spouse_gender) ? $spouse_gender : null;
            $barangayVal = trim((string) $request->input('barangay'));
            $affiliations = trim((string) $request->input('affiliations'));
            $sid = DB::table('survey')->insertGetId([
                'validator_id' => $validator_id,
                'interviewed_by' => $interviewed_by,
                'date_interviewed' => trim((string) $request->input('date_interviewed')),
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

            $attempts = 0;
            while (true) {
                $attempts++;
                $tagNumber = $this->generateTagNumber($barangayVal);
                try {
                    DB::table('demographic')->insert([
                        'survey_id' => $sid,
                        'interview_person' => trim((string) $request->input('interview_person')),
                        'last_name' => trim((string) $request->input('last_name')),
                        'first_name' => trim((string) $request->input('first_name')),
                        'middle_name' => $toNullIfEmpty($request->input('middle_name')),
                        'suffix' => $toNullIfEmpty($request->input('suffix')),
                        'barangay' => $barangayVal,
                        'purok' => $toNullIfEmpty($request->input('purok')),
                        'street' => $toNullIfEmpty($request->input('street')),
                        'gender' => trim((string) $request->input('gender')),
                        'religion' => $religion,
                        'birth_place' => $toNullIfEmpty($request->input('birth_place')),
                        'birth_date' => trim((string) $request->input('birth_date')),
                        'person_age' => $toInt($request->input('person_age')),
                        'marital_status' => $marital_status,
                        'contact_number' => $toNullIfEmpty($request->input('contact_number')),
                        'language_spoken' => $toNullIfEmpty($request->input('language_spoken')),
                        'tribe' => $tribe,
                        'highest_education' => $toNullIfEmpty($request->input('highest_education')),
                        'last_school_name' => $toNullIfEmpty($request->input('last_school_attended')),
                        'year_graduated' => $toInt($request->input('year_graduated')),
                        'spouse_name' => $spouse_name,
                        'spouse_religion' => $spouse_religion,
                        'spouse_tribe' => $spouse_tribe,
                        'spouse_age' => $toInt($spouse_age),
                        'spouse_gender' => $spouseGenderStr,
                        'affiliations' => $affiliations,
                        'endorsed_by_mayor' => $ynMayor($request->input('endorsed_by_mayor')),
                        'tag_number' => $tagNumber,
                    ]);
                    break;
                } catch (\Illuminate\Database\QueryException $e) {
                    $err = $e->errorInfo;
                    $isDuplicate = is_array($err) && isset($err[1]) && (int) $err[1] === 1062;
                    if ($isDuplicate && $attempts < 5) {
                        continue;
                    }
                    throw $e;
                }
            }

            DB::table('household')->insert([
                'survey_id' => $sid,
                'lot_ownership' => $toNullIfEmpty($request->input('lot_ownership')),
                'house_ownership' => $toNullIfEmpty($request->input('house_ownership')),
                'avail_socialized_housing' => $toNullIfEmpty($request->input('avail_socialized_housing')),
                'temporary_living_area' => $toNullIfEmpty($request->input('temporary_living_area')),
                'housing_structure' => $housing_structure,
                'type_of_toilet' => $type_of_toilet,
                'source_of_water' => $source_of_water,
                'source_of_electricity' => $source_of_electricity,
            ]);

            DB::table('economic')->insert([
                'survey_id' => $sid,
                'main_income_source' => $main_income_source,
                'work_status' => $work_status,
                'work_location_head' => $toNullIfEmpty($request->input('work_location_head')),
                'monthly_salary' => $msInput,
                'combine_monthly_income' => $toNullIfEmpty($request->input('combine_monthly_income')),
            ]);

            DB::table('training')->insert([
                'survey_id' => $sid,
                'skills_for_living' => $skills_for_living,
                'specific_skill' => $specific_skill,
                'organization_member' => $organization_member,
                'specific_organization' => $specific_organization,
                'house_photo' => $house_photo_path,
                'person_photo' => $person_photo_path,
                'wanttolearn' => $toNullIfEmpty($request->input('wanttolearn')),
                'remarks' => $toNullIfEmpty($request->input('remarks')),
                'latitude' => $toNullIfEmpty($request->input('latitude')),
                'longitude' => $toNullIfEmpty($request->input('longitude')),
                'respondent_signature' => $respondent_signature,
            ]);

            return $sid;
        });
        } catch (\Illuminate\Database\QueryException $e) {
            // Database-specific errors (constraints, syntax, etc.)
            if (!empty($uploadedFilePaths)) {
                $fileStorage = new FileStorage();
                foreach ($uploadedFilePaths as $path) {
                    try {
                        $fileStorage->delete($path);
                    } catch (\Exception $deleteEx) {
                        // Ignore cleanup errors
                    }
                }
            }
            
            $errorCode = $e->getCode();
            $errorInfo = $e->errorInfo ?? [];
            $sqlState = $errorInfo[0] ?? null;
            $errorNumber = isset($errorInfo[1]) ? (int)$errorInfo[1] : null;
            
            // Log detailed error with SQL state
            Log::error('Survey creation failed - Database error', [
                'validator_id' => $validator_id,
                'error' => $e->getMessage(),
                'error_code' => $errorCode,
                'error_info' => $errorInfo,
                'sql_state' => $sqlState,
                'error_number' => $errorNumber,
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Determine specific error message based on error code
            $message = 'Failed to save survey data. ';
            
            if ($errorNumber === 1062) {
                // Duplicate entry error
                $errorMessage = $e->getMessage();
                if (preg_match("/Duplicate entry '(.+?)' for key '(.+?)'/", $errorMessage, $matches)) {
                    $duplicateValue = $matches[1] ?? 'unknown';
                    $keyName = $matches[2] ?? 'unknown';
                    
                    // Identify the specific field from the key name
                    if (strpos($keyName, 'tag_number') !== false) {
                        $message .= 'A survey with this tag number already exists. Please try again.';
                    } elseif (strpos($keyName, 'survey_id') !== false) {
                        $message .= 'A survey with this ID already exists. Please try again.';
                    } elseif (strpos($keyName, 'PRIMARY') !== false) {
                        $message .= 'A record with this primary key already exists.';
                    } else {
                        $message .= "Duplicate entry detected for {$keyName}. Please check your input.";
                    }
                } else {
                    $message .= 'A duplicate entry was detected. Please check your input.';
                }
            } elseif ($errorNumber === 1452) {
                // Foreign key constraint violation
                $errorMessage = $e->getMessage();
                if (preg_match("/FOREIGN KEY \(`(.+?)`\) REFERENCES `(.+?)` \(`(.+?)`\)/", $errorMessage, $matches)) {
                    $foreignKeyColumn = $matches[1] ?? 'unknown';
                    $referencedTable = $matches[2] ?? 'unknown';
                    $referencedColumn = $matches[3] ?? 'unknown';
                    
                    $message .= "Invalid relationship detected: The {$foreignKeyColumn} references {$referencedTable}.{$referencedColumn} which does not exist. Please ensure all related data is valid.";
                } else {
                    $message .= 'Invalid relationship detected. Please ensure all related data is valid.';
                }
            } elseif ($errorNumber === 1451) {
                // Cannot delete or update parent row
                $message .= 'Cannot modify data due to existing relationships.';
            } elseif ($errorNumber === 1048) {
                // Column cannot be null
                $errorMessage = $e->getMessage();
                if (preg_match("/Column '(.+?)' cannot be null/", $errorMessage, $matches)) {
                    $columnName = $matches[1] ?? 'unknown';
                    $fieldName = str_replace('_', ' ', $columnName);
                    $message .= "The {$fieldName} field is required and cannot be empty.";
                } else {
                    $message .= 'A required field is missing. Please check all required fields.';
                }
            } elseif ($sqlState === '08S01' || $sqlState === 'HY000') {
                // Connection error
                $message .= 'A temporary system issue occurred. Please try again later.';
            } else {
                // Generic database error
                $message .= 'A database error occurred. Please try again or contact support.';
            }
            
            return response()->json([
                'message' => $message,
                'error' => config('app.debug') ? $e->getMessage() : 'Database error occurred',
            ], 500);
            
        } catch (\Exception $e) {
            // Transaction failed, clean up uploaded files
            if (!empty($uploadedFilePaths)) {
                $fileStorage = new FileStorage();
                foreach ($uploadedFilePaths as $path) {
                    try {
                        $fileStorage->delete($path);
                    } catch (\Exception $deleteEx) {
                        // Ignore cleanup errors
                    }
                }
            }
            
            Log::error('Survey creation failed', [
                'validator_id' => $validator_id,
                'error' => $e->getMessage(),
                'error_type' => get_class($e),
                'trace' => $e->getTraceAsString(),
                'request_keys' => array_keys($request->all()),
            ]);
            
            $errorMessage = 'Failed to create survey. ';
            if (strpos($e->getMessage(), 'file') !== false || strpos($e->getMessage(), 'upload') !== false) {
                $errorMessage .= 'File upload error. Please check file sizes and formats.';
            } elseif (strpos($e->getMessage(), 'signature') !== false) {
                $errorMessage .= 'Signature processing error. Please try signing again.';
            } else {
                $errorMessage .= 'Please check your input and try again.';
            }
            
            return response()->json([
                'message' => $errorMessage,
                'error' => config('app.debug') ? $e->getMessage() : 'Server error occurred',
            ], 500);
        }

        $names = $request->input('name');
        $hmCols = Schema::getColumnListing('household_mem');
        $colCivil = in_array('civilStatus', $hmCols) ? 'civilStatus' : 'civil_status';
        $colEdu = in_array('educationalAttainment', $hmCols) ? 'educationalAttainment' : 'educational_attainment';
        $colIncome = in_array('monthlyIncome', $hmCols) ? 'monthlyIncome' : 'monthly_income';
        $colSex = in_array('gender', $hmCols) ? 'gender' : (in_array('sex', $hmCols) ? 'sex' : null);
        $colCode = in_array('code', $hmCols) ? 'code' : null;
        if (is_array($names)) {
            $relationships = $request->input('relationship', []);
            $ages = $request->input('age', []);
            $sexes = $request->input('sex', $request->input('gender', []));
            $civil_statuses = $request->input('civil_status', []);
            $educations = $request->input('educational_attainment', []);
            $occupations = $request->input('occupation', []);
            $incomes = $request->input('monthly_income', []);
            $codes = $request->input('code', []);

            foreach ($names as $i => $n) {
                $n = $normalize($n);
                $rel = $normalize($relationships[$i] ?? null);
                $age = (int) ($ages[$i] ?? 0);
                $sex = $normalize($sexes[$i] ?? null);
                $civ = $normalize($civil_statuses[$i] ?? null);
                $edu = $normalize($educations[$i] ?? null);
                $occ = $normalize($occupations[$i] ?? null);
                $inc = $normalize($incomes[$i] ?? null);
                $code = $normalize($codes[$i] ?? null);

                if (empty($n) && empty($rel) && empty($age)) {
                    continue;
                }

                $payload = [
                    'survey_id' => $survey_id,
                    'name' => $n,
                    'relationship' => $rel,
                    'age' => $age,
                    'occupation' => $occ ?? '',
                ];
                if ($colSex) {
                    $payload[$colSex] = $sex ?? '';
                }
                $payload[$colCivil] = $civ ?? '';
                $payload[$colEdu] = $edu ?? '';
                $payload[$colIncome] = $inc ?? '';
                if ($colCode) {
                    $payload[$colCode] = $code ?? '';
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
                $payload = [
                    'survey_id' => $survey_id,
                    'name' => $spouse_name,
                    'relationship' => 'Spouse',
                    'age' => is_numeric($spouse_age) ? (int) $spouse_age : null,
                    'occupation' => 'N/A',
                ];
                if ($colSex) {
                    $payload[$colSex] = $spouse_gender ?? '';
                }
                $payload[$colCivil] = $marital_status;
                $payload[$colEdu] = 'N/A';
                $payload[$colIncome] = 'N/A';
                DB::table('household_mem')->insert($payload);
            }
        }

        // Calculate and save priority score
        try {
            $survey = Survey::find($survey_id);
            if ($survey) {
                $scoreService = new BeneficiaryScoreService();
                $scoreService->calculateAndSave($survey);
            }
        } catch (ScoreCalculationException $e) {
            // Log the error but don't fail the survey creation
            Log::error('Failed to calculate priority score for new survey', [
                'survey_id' => $survey_id,
                'error' => $e->getMessage(),
                'context' => $e->getContext()
            ]);
        }

        return response()->json(['survey_id' => $survey_id, 'tag_number' => DB::table('demographic')->where('survey_id', $survey_id)->value('tag_number')]);
    }

    public function updateSurvey(Request $request, $survey_id)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $hasDeletedAt = Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at');

        $s = DB::table('survey')->where('survey_id', (int) $survey_id)->where('validator_id', $validator_id)->first();
        if (! $s) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ((int) ($s->is_submitted ?? 0) !== 0) {
            return response()->json(['message' => 'Cannot edit after submission'], 403);
        }
        if ($hasDeletedAt && ! empty($s->deleted_at)) {
            return response()->json(['message' => 'Cannot edit a deleted survey'], 403);
        }

        $normalize = function ($v) {
            if ($v === null) {
                return null;
            }
            $v = is_string($v) ? trim($v) : $v;

            return is_string($v) ? str_replace('_', ' ', $v) : $v;
        };

        // Helper function to convert empty strings to NULL for optional fields
        $toNullIfEmpty = function ($v) {
            if ($v === null) {
                return null;
            }
            $trimmed = is_string($v) ? trim($v) : $v;
            return ($trimmed === '' || $trimmed === null) ? null : $trimmed;
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

        $skills_for_living = $normalize($request->input('skills_for_living'));
        $specific_skill = null;
        if ($skills_for_living === 'Yes') {
            $specific_skill = $normalize($request->input('specific_skill'));
            if ($specific_skill === 'others') {
                $specific_skill = $normalize($request->input('other_skill'));
            }
        } else {
            $specific_skill = '';
        }

        $organization_member = $normalize($request->input('organization_member'));
        $specific_organization = null;
        if ($organization_member === 'Yes') {
            $specific_organization = $normalize($request->input('specific_organization'));
            if ($specific_organization === 'others') {
                $specific_organization = $normalize($request->input('other_organization'));
            }
        } else {
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

        $yn = function ($v) {
            $s = is_string($v) ? strtolower(trim($v)) : $v;

            return ($s === 'yes' || $s === 1 || $s === '1') ? 1 : (($s === 'no' || $s === 0 || $s === '0') ? 0 : null);
        };
        $ynMayor = function ($v) {
            $s = is_string($v) ? strtolower(trim($v)) : $v;

            if ($s === 'yes' || $s === 1 || $s === '1') {
                return 1;
            }
            if ($s === 'no' || $s === 2 || $s === '2' || $s === 0 || $s === '0') {
                return 2;
            }

            return null;
        };
        $house_photo_path = null;
        $file = $request->file('house_photo');
        if ($file && $file->isValid()) {
            if ($file->getSize() > 5 * 1024 * 1024) {
                return response()->json(['message' => 'File too large'], 422);
            }
            $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
            $mime = $file->getClientMimeType() ?: 'image/jpeg';
            if (! in_array($mime, $allowed)) {
                return response()->json(['message' => 'Invalid file type'], 422);
            }
            // Use FileStorageService for dual storage
            $result = FileStorageService::store($file, 'house_photos', 'house_');
            if ($result['success']) {
                $house_photo_path = $result['path']; // e.g., 'house_photos/house_xxx.jpg'
            }
        }
        $person_photo_path = null;
        $personFile = $request->file('person_photo');
        if ($personFile && $personFile->isValid()) {
            if ($personFile->getSize() > 5 * 1024 * 1024) {
                return response()->json(['message' => 'File too large'], 422);
            }
            $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
            $mime = $personFile->getClientMimeType() ?: 'image/jpeg';
            if (! in_array($mime, $allowed)) {
                return response()->json(['message' => 'Invalid file type'], 422);
            }
            // Use FileStorageService for dual storage
            $result = FileStorageService::store($personFile, 'person_photos', 'person_');
            if ($result['success']) {
                $person_photo_path = $result['path']; // e.g., 'person_photos/person_xxx.jpg'
            }
        }
        $saveSignature = function ($input) {
            if (! $input) {
                return null;
            }
            $s = is_string($input) ? trim($input) : '';
            if ($s === '') {
                return null;
            }
            if (strpos($s, ',') !== false) {
                $parts = explode(',', $s, 2);
                if (count($parts) !== 2) {
                    return null;
                }
                $data = base64_decode($parts[1]);
                if ($data === false) {
                    return null;
                }
                $filename = uniqid('sig_').'.png';
                
                // Store in Laravel storage
                \Illuminate\Support\Facades\Storage::disk('public')->put('signatures/'.$filename, $data);
                
                // Also copy to public directory using FileStorageService
                FileStorageService::copyToPublicDirectory('signatures', $filename);

                return 'signatures/'.$filename; // Return path without 'storage/' prefix
            }

            return $s;
        };
        $validator_signature = null;
        $respondent_signature = $saveSignature($request->input('respondent_signature'));
        $lat = trim((string) $request->input('latitude'));
        $lon = trim((string) $request->input('longitude'));
        $marital_status = $normalize($request->input('marital_status'));
        $allowSpouse = in_array($marital_status, ['Married', 'Live-in', 'Widow/Widower', 'Separated', 'Annulled']);
        $spouse_name = $allowSpouse ? $normalize($request->input('spouse_name')) : null;
        $spouse_religion = $allowSpouse ? $normalize($request->input('spouse_religion')) : null;
        $other_spouse_religion = $allowSpouse ? $normalize($request->input('other_spouse_religion')) : null;
        $spouse_tribe = $allowSpouse ? $normalize($request->input('spouse_tribe')) : null;
        $spouse_age = $allowSpouse ? $normalize($request->input('spouse_age')) : null;
        $spouse_gender = $allowSpouse ? $normalize($request->input('spouse_gender')) : null;

        DB::transaction(function () use ($survey_id, $request, $classification, $subclass_displaced, $subclass_doubleup, $subclass_homeless, $housing_structure, $type_of_toilet, $source_of_water, $source_of_electricity, $main_income_source, $work_status, $skills_for_living, $specific_skill, $organization_member, $specific_organization, $respondent_signature, $house_photo_path, $person_photo_path, $lat, $lon, $spouse_name, $spouse_religion, $other_spouse_religion, $spouse_tribe, $spouse_age, $spouse_gender, $normalize, $yn, $ynMayor, $toNullIfEmpty) {
            $toInt = function ($v) {
                return is_numeric($v) ? (int) $v : null;
            };
            $classMap = ['displaced' => 1, 'double-up' => 2, 'homeless' => 3, 'upgrading of land tenure' => 4, 'upgrading_of_land_tenure' => 4];
            $displacedMap = ['coastal areas' => 1, 'drought' => 2, 'earthquake affected' => 3, 'flood affected' => 4, 'sea level rise' => 5, 'threat of eviction' => 6, 'eviction/demolition order' => 7, 'human induced disaster' => 8, 'infra projects' => 9, 'landslide affected' => 10, 'near waterways' => 11];
            $doubleupMap = ['renter/tenant' => 1, 'rent-free/sharer' => 2, 'caretaker' => 3];
            $homelessMap = ['public - living in tent' => 1, 'private - living in tent' => 2];
            $spouseGenderStr = is_string($spouse_gender) ? $spouse_gender : null;

            DB::table('survey')->where('survey_id', $survey_id)->update([
                'date_interviewed' => trim((string) $request->input('date_interviewed')),
            ]);
            DB::table('classification')->where('survey_id', $survey_id)->update([
                'previous_client' => $yn($request->input('previous_client')),
                'year_inhabited' => $toInt($request->input('year_inhabited')),
                'classification' => $classMap[strtolower((string) $classification)] ?? null,
                'subclass_displaced' => $subclass_displaced ? ($displacedMap[strtolower((string) $subclass_displaced)] ?? null) : null,
                'subclass_doubleup' => $subclass_doubleup ? ($doubleupMap[strtolower((string) $subclass_doubleup)] ?? null) : null,
                'subclass_homeless' => $subclass_homeless ? ($homelessMap[strtolower((string) $subclass_homeless)] ?? null) : null,
            ]);
            DB::table('demographic')->where('survey_id', $survey_id)->update([
                'interview_person' => trim((string) $request->input('interview_person')),
                'last_name' => trim((string) $request->input('last_name')),
                'first_name' => trim((string) $request->input('first_name')),
                'middle_name' => $toNullIfEmpty($request->input('middle_name')),
                'suffix' => $toNullIfEmpty($request->input('suffix')),
                'barangay' => trim((string) $request->input('barangay')),
                'purok' => $toNullIfEmpty($request->input('purok')),
                'street' => $toNullIfEmpty($request->input('street')),
                'gender' => trim((string) $request->input('gender')),
                'religion' => $toNullIfEmpty($request->input('religion')),
                'other_religion' => $toNullIfEmpty($request->input('other_religion')),
                'birth_place' => $toNullIfEmpty($request->input('birth_place')),
                'birth_date' => trim((string) $request->input('birth_date')),
                'person_age' => $toInt($request->input('person_age')),
                'marital_status' => trim((string) $request->input('marital_status')),
                'contact_number' => $toNullIfEmpty($request->input('contact_number')),
                'language_spoken' => $toNullIfEmpty($request->input('language_spoken')),
                'tribe' => $toNullIfEmpty($request->input('tribe')),
                'highest_education' => $toNullIfEmpty($request->input('highest_education')),
                'last_school_name' => $toNullIfEmpty($request->input('last_school_attended')),
                'year_graduated' => $toInt($request->input('year_graduated')),
                'spouse_name' => $spouse_name,
                'spouse_religion' => $spouse_religion,
                'other_spouse_religion' => $other_spouse_religion,
                'spouse_tribe' => $spouse_tribe,
                'spouse_age' => $toInt($spouse_age),
                'spouse_gender' => $spouseGenderStr,
                'endorsed_by_mayor' => $ynMayor($request->input('endorsed_by_mayor')),
            ]);
            DB::table('household')->where('survey_id', $survey_id)->update([
                'lot_ownership' => $toNullIfEmpty($request->input('lot_ownership')),
                'house_ownership' => $toNullIfEmpty($request->input('house_ownership')),
                'avail_socialized_housing' => $toNullIfEmpty($request->input('avail_socialized_housing')),
                'temporary_living_area' => $toNullIfEmpty($request->input('temporary_living_area')),
                'housing_structure' => $housing_structure,
                'type_of_toilet' => $type_of_toilet,
                'source_of_water' => $source_of_water,
                'source_of_electricity' => $source_of_electricity,
            ]);
            $msInput = trim((string) $request->input('monthly_salary'));
            if ($msInput === '') {
                throw new \Exception('Monthly salary is required');
            }
            DB::table('economic')->where('survey_id', $survey_id)->update([
                'main_income_source' => $main_income_source,
                'work_status' => $work_status,
                'work_location_head' => $toNullIfEmpty($request->input('work_location_head')),
                'monthly_salary' => $msInput,
                'combine_monthly_income' => $toNullIfEmpty($request->input('combine_monthly_income')),
            ]);
            $trainingUpdate = [
                'skills_for_living' => $skills_for_living,
                'specific_skill' => $specific_skill,
                'organization_member' => $organization_member,
                'specific_organization' => $specific_organization,
                'wanttolearn' => $toNullIfEmpty($request->input('wanttolearn')),
                'remarks' => $toNullIfEmpty($request->input('remarks')),
                'latitude' => $lat,
                'longitude' => $lon,
            ];
            if ($house_photo_path) {
                $trainingUpdate['house_photo'] = $house_photo_path;
            }
            if ($person_photo_path) {
                $trainingUpdate['person_photo'] = $person_photo_path;
            }
            if ($respondent_signature) {
                $trainingUpdate['respondent_signature'] = $respondent_signature;
            }
            DB::table('training')->where('survey_id', $survey_id)->update($trainingUpdate);
            DB::table('household_mem')->where('survey_id', $survey_id)->delete();
            $hmCols = Schema::getColumnListing('household_mem');
            $colCivil = in_array('civilStatus', $hmCols) ? 'civilStatus' : 'civil_status';
            $colEdu = in_array('educationalAttainment', $hmCols) ? 'educationalAttainment' : 'educational_attainment';
            $colIncome = in_array('monthlyIncome', $hmCols) ? 'monthlyIncome' : 'monthly_income';
            $colSex = in_array('gender', $hmCols) ? 'gender' : (in_array('sex', $hmCols) ? 'sex' : null);
            $colCode = in_array('code', $hmCols) ? 'code' : null;
            $names = $request->input('name', []);
            $relationships = $request->input('relationship', []);
            $ages = $request->input('age', []);
            $sexes = $request->input('sex', []);
            $civil_statuses = $request->input('civil_status', []);
            $educations = $request->input('educational_attainment', []);
            $occupations = $request->input('occupation', []);
            $incomes = $request->input('monthly_income', []);
            $codes = $request->input('code', []);
            foreach ($names as $i => $n) {
                $n = $normalize($n);
                $rel = $normalize($relationships[$i] ?? null);
                $age = (int) ($ages[$i] ?? 0);
                $sex = $normalize($sexes[$i] ?? null);
                $civ = $normalize($civil_statuses[$i] ?? null);
                $edu = $normalize($educations[$i] ?? null);
                $occ = $normalize($occupations[$i] ?? null);
                $inc = $normalize($incomes[$i] ?? null);
                $code = $normalize($codes[$i] ?? null);
                if (empty($n) && empty($rel) && empty($age)) {
                    continue;
                }
                $payload = ['survey_id' => $survey_id, 'name' => $n, 'relationship' => $rel, 'age' => $age, 'occupation' => $occ ?? ''];
                if ($colSex) {
                    $payload[$colSex] = $sex ?? '';
                }
                $payload[$colCivil] = $civ ?? '';
                $payload[$colEdu] = $edu ?? '';
                $payload[$colIncome] = $inc ?? '';
                if ($colCode) {
                    $payload[$colCode] = $code ?? '';
                }
                DB::table('household_mem')->insert($payload);
            }
        });

        // Calculate and save priority score after update
        try {
            $survey = Survey::find($survey_id);
            if ($survey) {
                $scoreService = new BeneficiaryScoreService();
                $scoreService->calculateAndSave($survey);
            }
        } catch (ScoreCalculationException $e) {
            // Log the error but don't fail the survey update
            Log::error('Failed to calculate priority score for updated survey', [
                'survey_id' => $survey_id,
                'error' => $e->getMessage(),
                'context' => $e->getContext()
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function deleteSurvey(Request $request, $survey_id)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! Schema::hasTable('survey') || ! Schema::hasColumn('survey', 'deleted_at')) {
            return response()->json(['message' => 'Soft delete not enabled'], 409);
        }

        $s = DB::table('survey')->where('survey_id', (int) $survey_id)->where('validator_id', $validator_id)->first();
        if (! $s) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ((int) ($s->is_submitted ?? 0) !== 0) {
            return response()->json(['message' => 'Cannot delete after submission'], 403);
        }
        if (! empty($s->deleted_at)) {
            return response()->json(['message' => 'Already deleted'], 409);
        }
        DB::table('survey')->where('survey_id', (int) $survey_id)->update(['deleted_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function restoreSurvey(Request $request, $survey_id)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! Schema::hasTable('survey') || ! Schema::hasColumn('survey', 'deleted_at')) {
            return response()->json(['message' => 'Soft delete not enabled'], 409);
        }

        $s = DB::table('survey')->where('survey_id', (int) $survey_id)->where('validator_id', $validator_id)->first();
        if (! $s) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if (empty($s->deleted_at)) {
            return response()->json(['message' => 'Not deleted'], 409);
        }
        DB::table('survey')->where('survey_id', (int) $survey_id)->update(['deleted_at' => null]);

        return response()->json(['ok' => true]);
    }

    public function adminRestoreAllDeletedSurveys(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (! Schema::hasTable('survey') || ! Schema::hasColumn('survey', 'deleted_at')) {
            return response()->json(['message' => 'Soft delete not enabled'], 409);
        }

        $count = DB::table('survey')->whereNotNull('deleted_at')->count();
        if ($count === 0) {
            return response()->json(['restored' => 0]);
        }

        DB::table('survey')->whereNotNull('deleted_at')->update(['deleted_at' => null]);
        Cache::flush();

        return response()->json(['restored' => $count]);
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
        $validator_id = session('validator_id');
        if (!$validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $current = (string) $request->input('current_password');
        $password = (string) $request->input('password');
        $confirmation = (string) $request->input('password_confirmation');

        $errors = [];
        if ($current === '') {
            $errors['current_password'][] = 'Current password is required';
        }
        if ($password === '') {
            $errors['password'][] = 'New password is required';
        } elseif (strlen($password) < 8) {
            $errors['password'][] = 'Password must be at least 8 characters';
        }
        if ($confirmation === '') {
            $errors['password_confirmation'][] = 'Please confirm your new password';
        } elseif ($password !== '' && $password !== $confirmation) {
            $errors['password_confirmation'][] = 'Passwords do not match';
        }
        if (!empty($errors)) {
            return response()->json(['errors' => $errors], 422);
        }

        $row = DB::table('validator')->select('password','name','email','validator_id')->where('validator_id', $validator_id)->first();
        if (!$row) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        $stored = is_string($row->password ?? null) ? $row->password : '';
        $valid = ($stored !== '' && password_verify($current, $stored)) || $current === $stored || (md5($current) === $stored);
        if (!$valid) {
            return response()->json(['errors' => ['current_password' => ['Current password is incorrect']]], 422);
        }

        DB::table('validator')->where('validator_id', $validator_id)->update([
            'password' => password_hash($password, PASSWORD_BCRYPT),
            'updated_at' => now(),
        ]);

        DB::table('notifications')->insert([
            'type' => 'validator_password_reset',
            'title' => 'Password changed',
            'payload' => json_encode([
                'validator_id' => $row->validator_id ?? null,
                'name' => $row->name ?? null,
                'email' => $row->email ?? null,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    public function updateEmail(Request $request)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $email = trim((string) $request->input('email', ''));
        $errors = [];

        if ($email === '') {
            $errors['email'][] = 'Email is required';
        } elseif (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'][] = 'Enter a valid email address';
        } else {
            $exists = DB::table('validator')
                ->where('email', $email)
                ->where('validator_id', '!=', $validator_id)
                ->exists();
            if ($exists) {
                $errors['email'][] = 'Email is already in use';
            }
        }

        if (! empty($errors)) {
            return response()->json(['errors' => $errors], 422);
        }

        $row = DB::table('validator')
            ->select('validator_id', 'name', 'email')
            ->where('validator_id', $validator_id)
            ->first();
        if (! $row) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        if ((string) ($row->email ?? '') === $email) {
            return response()->json(['ok' => true, 'message' => 'Email is unchanged']);
        }

        DB::table('validator')->where('validator_id', $validator_id)->update([
            'email' => $email,
            'updated_at' => now(),
        ]);

        DB::table('notifications')->insert([
            'type' => 'validator_email_changed',
            'title' => 'Email updated',
            'payload' => json_encode([
                'validator_id' => $row->validator_id ?? null,
                'name' => $row->name ?? null,
                'email' => $email,
                'old_email' => $row->email ?? null,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'ok' => true,
            'profile' => [
                'validator_id' => $row->validator_id ?? null,
                'name' => $row->name ?? null,
                'email' => $email,
            ],
        ]);
    }

    public function previewTagNumber(Request $request)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = $this->normalizeBarangay((string) $request->get('barangay', ''));
        if ($barangay === '') {
            return response()->json(['message' => 'Missing barangay'], 400);
        }
        $code = $this->getBarangayCode($barangay);
        $maxTag = DB::table('demographic')
            ->where('tag_number', 'like', $code.'%')
            ->max('tag_number');
        $nextSeq = 1;
        if ($maxTag) {
            $numericPart = substr($maxTag, 1);
            $parsed = (int) $numericPart;
            if ($parsed > 0) {
                $nextSeq = $parsed + 1;
            }
        }
        $seqStr = str_pad((string) $nextSeq, 3, '0', STR_PAD_LEFT);
        $tagNumber = $code.$seqStr;

        return response()->json(['tag_number' => $tagNumber]);
    }

    public function adminTotals(Request $request)
    {
        $data = Cache::remember('admin_totals', 30, function () {
            $total_validated = DB::table('survey')->where('is_submitted', 1)->count();
            $total_approved = DB::table('survey')->where('is_submitted', 2)->count();
            $total_assigned = DB::table('survey')->where('is_submitted', 3)->count();
            $total_overall = DB::table('survey')->whereIn('is_submitted', [1, 2, 3])->count();

            return [
                'total_validated' => $total_validated,
                'total_approved' => $total_approved,
                'total_assigned' => $total_assigned,
                'total_overall' => $total_overall,
            ];
        });

        return response()->json($data);
    }

    public function adminBarangay(Request $request)
    {
        $years = (int) $request->get('years', 0);
        $startYear = $request->get('start_year');
        $endYear = $request->get('end_year');
        $cacheKey = 'admin_barangay_'.md5(json_encode([$years, $startYear, $endYear]));
        $rows = Cache::remember($cacheKey, 300, function () use ($years, $startYear, $endYear) {
            return DB::table('survey as s')
                ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->select('d.barangay', DB::raw('COUNT(*) AS count'))
                ->whereIn('s.is_submitted', [1, 2, 3])
                ->when($startYear && $endYear, function ($q) use ($startYear, $endYear) {
                    $start = Carbon::createMidnightDate((int) $startYear, 1, 1)->toDateString();
                    $end = Carbon::createMidnightDate((int) $endYear, 12, 31)->toDateString();
                    $q->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '>=', $start)->whereDate('s.date_interviewed', '<=', $end);
                })
                ->when($years > 0, function ($q) use ($years) {
                    $start = Carbon::now()->subYears($years)->startOfDay()->toDateString();
                    $q->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '>=', $start);
                })
                ->groupBy('d.barangay')
                ->get();
        });

        return response()->json(['data' => $rows]);
    }

    public function adminClassification(Request $request)
    {
        $years = (int) $request->get('years', 0);
        $startYear = $request->get('start_year');
        $endYear = $request->get('end_year');
        $cacheKey = 'admin_classification_'.md5(json_encode([$years, $startYear, $endYear]));
        $data = Cache::remember($cacheKey, 300, function () use ($years, $startYear, $endYear) {
            $rows = DB::table('survey as s')
                ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->select('c.classification', 'd.barangay', DB::raw('COUNT(*) AS count'))
                ->whereIn('s.is_submitted', [1, 2, 3])
                ->when($startYear && $endYear, function ($q) use ($startYear, $endYear) {
                    $start = Carbon::createMidnightDate((int) $startYear, 1, 1)->toDateString();
                    $end = Carbon::createMidnightDate((int) $endYear, 12, 31)->toDateString();
                    $q->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '>=', $start)->whereDate('s.date_interviewed', '<=', $end);
                })
                ->when($years > 0, function ($q) use ($years) {
                    $start = Carbon::now()->subYears($years)->startOfDay()->toDateString();
                    $q->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '>=', $start);
                })
                ->groupBy('c.classification', 'd.barangay')
                ->get();
            $data = [];
            $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
            foreach ($rows as $r) {
                $c = array_key_exists($r->classification, $classLabel) ? $classLabel[$r->classification] : ($r->classification ?: 'Unknown');
                $b = $r->barangay ?: 'Unknown';
                if (! isset($data[$c])) {
                    $data[$c] = [];
                }
                $data[$c][$b] = (int) $r->count;
            }

            return $data;
        });

        return response()->json(['classificationData' => $data]);
    }

    public function adminSubclassDisplaced(Request $request)
    {
        $rows = Cache::remember('admin_subclass_displaced', 300, function () {
            return DB::table('survey as s')
                ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->select('d.barangay', 'c.subclass_displaced', DB::raw('COUNT(*) AS count'))
                ->whereIn('s.is_submitted', [1, 2, 3])
                ->whereNotNull('c.subclass_displaced')
                ->groupBy('d.barangay', 'c.subclass_displaced')
                ->get()
                ->map(function ($row) {
                    $displacedLabel = [
                        1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
                        6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
                    ];
                    $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? $row->subclass_displaced;

                    return $row;
                });
        });

        return response()->json(['data' => $rows]);
    }

    public function adminSubclassDoubleUp(Request $request)
    {
        $rows = Cache::remember('admin_subclass_doubleup', 300, function () {
            return DB::table('survey as s')
                ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->select('d.barangay', 'c.subclass_doubleup', DB::raw('COUNT(*) AS count'))
                ->whereIn('s.is_submitted', [1, 2, 3])
                ->whereNotNull('c.subclass_doubleup')
                ->groupBy('d.barangay', 'c.subclass_doubleup')
                ->get()
                ->map(function ($row) {
                    $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
                    $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? $row->subclass_doubleup;

                    return $row;
                });
        });

        return response()->json(['data' => $rows]);
    }

    public function adminSubclassHomeless(Request $request)
    {
        $rows = Cache::remember('admin_subclass_homeless', 300, function () {
            return DB::table('survey as s')
                ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->select('d.barangay', 'c.subclass_homeless', DB::raw('COUNT(*) AS count'))
                ->whereIn('s.is_submitted', [1, 2, 3])
                ->whereNotNull('c.subclass_homeless')
                ->groupBy('d.barangay', 'c.subclass_homeless')
                ->get()
                ->map(function ($row) {
                    $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
                    $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? $row->subclass_homeless;

                    return $row;
                });
        });

        return response()->json(['data' => $rows]);
    }

    public function adminBeneficiariesValidated(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $search = trim((string) $request->get('search', ''));
        $barangay = trim((string) $request->get('barangay', ''));
        $aff = trim((string) $request->get('affiliation', ''));
        $class = trim((string) $request->get('classification', ''));
        $status = strtolower(trim((string) $request->get('status', 'validated')));
        $dateFrom = $request->get('date_from') ?? $request->get('dateFrom');
        $dateTo = $request->get('date_to') ?? $request->get('dateTo');
        $pointsMin = $request->get('points_min') ?? $request->get('pointsMin');
        $pointsMax = $request->get('points_max') ?? $request->get('pointsMax');
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
            'none' => 0, 'n/a' => 0,
            'sss' => 1, 'gsis' => 2, 'philhealth' => 3, 'pagibig' => 4,
            'pwd' => 5, 'senior_citizen' => 6, 'solo_parent' => 7, '4ps' => 8,
        ];
        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        $base = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
            ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
            ->where(function ($q) {
                $q->whereNull('d.endorsed_by_mayor')
                    ->orWhereIn('d.endorsed_by_mayor', [0, 2]);
            });
        if ($status === 'validated') {
            $base->where('s.is_submitted', 1);
        } elseif ($status === 'approved') {
            $base->where('s.is_submitted', 2);
        } elseif ($status === 'assigned') {
            $base->where('s.is_submitted', 3);
        } elseif ($status === 'disapproved') {
            $base->where('s.is_submitted', 5);
        } elseif ($status === 'submitted') {
            $base->whereIn('s.is_submitted', [1, 2, 3, 5]);
        }
        if ($aff === '') {
            $base->where(function ($q) {
                $q->whereNull('d.affiliations')
                    ->orWhere('d.affiliations', '')
                    ->orWhere('d.affiliations', 'None')
                    ->orWhere('d.affiliations', 'N/A');
            });
        } elseif ($aff !== '') {
            $affStr = str_replace('_', ' ', $aff);
            $base->where('d.affiliations', 'like', "%$affStr%");
        }
        if ($barangay !== '') {
            $barangayAlt = str_replace('_', ' ', $barangay);
            $base->where(function ($q) use ($barangay, $barangayAlt) {
                $q->where('d.barangay', $barangay)
                    ->orWhere('d.barangay', $barangayAlt);
            });
        }
        if ($dateFrom) {
            $base->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '>=', $dateFrom);
        }
        if ($dateTo) {
            $base->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '<=', $dateTo);
        }
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) {
                $base->where('c.classification', $code);
            }
        }
        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('d.last_name', 'like', "%$search%")
                    ->orWhere('d.barangay', 'like', "%$search%");
            });
        }

        $scored = $base->select(
            's.survey_id',
            's.date_interviewed',
            's.is_submitted',
            's.priority_score',
            's.score_calculated_at',
            'd.barangay',
            'd.last_name',
            'c.classification',
            'c.subclass_displaced',
            'c.subclass_doubleup',
            'c.subclass_homeless',
            'e.combine_monthly_income',
            'h.lot_ownership',
            'h.house_ownership',
            'h.temporary_living_area',
            'h.housing_structure',
            'h.type_of_toilet',
            'h.source_of_water',
            'h.source_of_electricity'
        )->selectRaw("COALESCE(s.priority_score, 0) as points");

        if (is_numeric($pointsMin)) {
            $min = (float) $pointsMin;
            $scored->where('s.priority_score', '>=', $min);
        }
        if (is_numeric($pointsMax)) {
            $max = (float) $pointsMax;
            $scored->where('s.priority_score', '<=', $max);
        }

        $total = (clone $scored)->count();

        // Always order by points descending first for global sorting across all pages
        $rows = $scored
            ->orderByDesc('points')
            ->orderBy('d.barangay')
            ->orderBy('c.classification')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->map(function ($row) {
                $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
                    6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
                ];
                $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
                $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');

                return $row;
            })
            ->values();

        return response()->json([
            'data' => $rows,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
        ]);
    }

    public function adminBeneficiariesApproved(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $search = trim((string) $request->get('search', ''));
        $barangay = trim((string) $request->get('barangay', ''));
        $aff = trim((string) $request->get('affiliation', ''));
        $class = trim((string) $request->get('classification', ''));
        $pointsMin = $request->get('points_min') ?? $request->get('pointsMin');
        $pointsMax = $request->get('points_max') ?? $request->get('pointsMax');
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
            'none' => 0, 'n/a' => 0,
            'sss' => 1, 'gsis' => 2, 'philhealth' => 3, 'pagibig' => 4,
            'pwd' => 5, 'senior_citizen' => 6, 'solo_parent' => 7, '4ps' => 8,
        ];
        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        $base = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
            ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
            ->whereIn('s.is_submitted', [1, 2, 3]);
        if ($aff !== '') {
            $affStr = str_replace('_', ' ', $aff);
            $base->where('d.affiliations', 'like', "%$affStr%");
        }
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) {
                $base->where('c.classification', $code);
            }
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
        }
        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('d.last_name', 'like', "%$search%")
                    ->orWhere('d.barangay', 'like', "%$search%");
            });
        }

        $scored = $base->select(
            's.survey_id',
            's.date_interviewed',
            's.priority_score',
            's.score_calculated_at',
            'd.barangay',
            'd.last_name',
            'c.classification',
            'c.subclass_displaced',
            'c.subclass_doubleup',
            'c.subclass_homeless',
            'e.combine_monthly_income',
            'h.lot_ownership',
            'h.house_ownership',
            'h.temporary_living_area',
            'h.housing_structure',
            'h.type_of_toilet',
            'h.source_of_water',
            'h.source_of_electricity'
        )->selectRaw("COALESCE(s.priority_score, 0) as points");

        if (is_numeric($pointsMin)) {
            $min = (float) $pointsMin;
            $scored->where('s.priority_score', '>=', $min);
        }
        if (is_numeric($pointsMax)) {
            $max = (float) $pointsMax;
            $scored->where('s.priority_score', '<=', $max);
        }

        $total = (clone $scored)->count();

        $rowsQuery = $scored;
        if (is_numeric($pointsMin) || is_numeric($pointsMax)) {
            $rowsQuery = $rowsQuery
                ->orderByDesc('points')
                ->orderBy('d.barangay')
                ->orderBy('c.classification');
        } else {
            $rowsQuery = $rowsQuery
                ->orderBy('d.barangay')
                ->orderBy('c.classification')
                ->orderByDesc('points');
        }

        $rows = $rowsQuery
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->map(function ($row) {
                $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
                    6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
                ];
                $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
                $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');

                return $row;
            })
            ->values();

        return response()->json([
            'data' => $rows,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
        ]);
    }

    /**
     * Get assigned beneficiaries (is_submitted = 3) for Monitoring and Revocations.
     * These are beneficiaries who have been assigned a project site, block, and lot.
     */
    public function adminBeneficiariesAssigned(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $search = trim((string) $request->get('search', ''));
        $projectId = $request->get('project_id', '');
        $offset = ($page - 1) * $perPage;

        $base = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->leftJoin('assignments as a', 'a.survey_id', '=', 's.survey_id')
            ->leftJoin('siteproj as p', 'p.project_id', '=', 'a.project_id')
            ->where('s.is_submitted', 3); // Only assigned beneficiaries

        // Filter by project_id if provided
        if ($projectId !== '' && $projectId !== null) {
            $base->where('a.project_id', $projectId);
        }

        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('d.last_name', 'like', "%$search%")
                    ->orWhere('d.first_name', 'like', "%$search%")
                    ->orWhere('d.barangay', 'like', "%$search%")
                    ->orWhere('p.project_name', 'like', "%$search%")
                    ->orWhereRaw('CONCAT("Block ", a.block_no, " Lot ", a.lot_no) LIKE ?', ["%$search%"])
                    ->orWhere('a.block_no', 'like', "%$search%")
                    ->orWhere('a.lot_no', 'like', "%$search%");
            });
        }

        $total = (clone $base)->count();

        $rows = $base->select(
            's.survey_id',
            's.date_interviewed',
            's.priority_score',
            's.score_calculated_at',
            'd.barangay',
            'd.first_name',
            'd.last_name',
            'c.classification',
            'c.subclass_displaced',
            'c.subclass_doubleup',
            'c.subclass_homeless',
            'a.block_no',
            'a.lot_no',
            'a.date_assigned',
            'p.project_id',
            'p.project_name'
        )
            ->orderBy('a.date_assigned', 'desc')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->map(function ($row) {
                $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
                    6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
                ];
                $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
                $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
                
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
                
                // Add demographic object for frontend compatibility
                $row->demographic = (object) [
                    'first_name' => $row->first_name,
                    'last_name' => $row->last_name,
                    'barangay' => $row->barangay,
                ];
                
                // Add assignment info
                $row->assignment = (object) [
                    'block_no' => $row->block_no,
                    'lot_no' => $row->lot_no,
                    'date_assigned' => $row->date_assigned,
                    'project_name' => $row->project_name,
                    'project_id' => $row->project_id,
                ];

                return $row;
            })
            ->values();

        return response()->json([
            'data' => $rows,
            'total' => $total,
            'page' => $page,
            'current_page' => $page,
            'per_page' => $perPage,
        ]);
    }

    public function adminBeneficiariesAffiliated(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $search = trim((string) $request->get('search', ''));
        $status = strtolower(trim((string) $request->get('status', 'validated')));
        $barangay = trim((string) $request->get('barangay', ''));
        $aff = trim((string) $request->get('affiliation', ''));
        $class = trim((string) $request->get('classification', ''));
        $dateFrom = $request->get('date_from') ?? $request->get('dateFrom');
        $dateTo = $request->get('date_to') ?? $request->get('dateTo');
        $pointsMin = $request->get('points_min') ?? $request->get('pointsMin');
        $pointsMax = $request->get('points_max') ?? $request->get('pointsMax');
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
            'none' => 0, 'n/a' => 0,
            'sss' => 1, 'gsis' => 2, 'philhealth' => 3, 'pagibig' => 4,
            'pwd' => 5, 'senior_citizen' => 6, 'solo_parent' => 7, '4ps' => 8,
        ];
        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        $base = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
            ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
            ->whereNotNull('d.affiliations')
            ->where('d.affiliations', '<>', '')
            ->whereNotIn('d.affiliations', ['None', 'N/A'])
            ->where(function ($q) {
                $q->whereNull('d.endorsed_by_mayor')
                    ->orWhereIn('d.endorsed_by_mayor', [0, 2]);
            });
        if ($status === 'validated') {
            $base->where('s.is_submitted', 1);
        } elseif ($status === 'approved') {
            $base->where('s.is_submitted', 2);
        } elseif ($status === 'assigned') {
            $base->where('s.is_submitted', 3);
        } elseif ($status === 'disapproved') {
            $base->where('s.is_submitted', 5);
        } elseif ($status === 'submitted') {
            $base->whereIn('s.is_submitted', [1, 2, 3, 5]);
        }
        if ($aff !== '') {
            $affStr = str_replace('_', ' ', $aff);
            $base->where('d.affiliations', 'like', "%$affStr%");
        }
        if ($barangay !== '') {
            $barangayAlt = str_replace('_', ' ', $barangay);
            $base->where(function ($q) use ($barangay, $barangayAlt) {
                $q->where('d.barangay', $barangay)
                    ->orWhere('d.barangay', $barangayAlt);
            });
        }
        if ($dateFrom) {
            $base->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '>=', $dateFrom);
        }
        if ($dateTo) {
            $base->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '<=', $dateTo);
        }
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) {
                $base->where('c.classification', $code);
            }
        }
        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('d.last_name', 'like', "%$search%")
                    ->orWhere('d.barangay', 'like', "%$search%")
                    ->orWhere('d.affiliations', 'like', "%$search%");
            });
        }

        $scored = $base->select(
            's.survey_id',
            's.date_interviewed',
            's.is_submitted',
            's.priority_score',
            's.score_calculated_at',
            'd.barangay',
            'd.last_name',
            'c.classification',
            'c.subclass_displaced',
            'c.subclass_doubleup',
            'c.subclass_homeless',
            'd.affiliations',
            'e.combine_monthly_income',
            'h.lot_ownership',
            'h.house_ownership',
            'h.temporary_living_area',
            'h.housing_structure',
            'h.type_of_toilet',
            'h.source_of_water',
            'h.source_of_electricity'
        )->selectRaw("COALESCE(s.priority_score, 0) as points");

        if (is_numeric($pointsMin)) {
            $min = (float) $pointsMin;
            $scored->where('s.priority_score', '>=', $min);
        }
        if (is_numeric($pointsMax)) {
            $max = (float) $pointsMax;
            $scored->where('s.priority_score', '<=', $max);
        }

        $total = (clone $scored)->count();

        // Always order by points descending first for global sorting across all pages
        $rows = $scored
            ->orderByDesc('points')
            ->orderBy('d.barangay')
            ->orderBy('c.classification')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->map(function ($row) {
                $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
                    6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
                ];
                $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
                $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
                $row->affiliation = $this->primaryAffiliationFromString($row->affiliations ?? null);

                return $row;
            })
            ->values();

        return response()->json([
            'data' => $rows,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
        ]);
    }

    public function adminBeneficiariesMayorEndorsed(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);
        $search = trim((string) $request->get('search', ''));
        $barangay = trim((string) $request->get('barangay', ''));
        $class = trim((string) $request->get('classification', ''));
        $status = strtolower(trim((string) $request->get('status', 'validated')));
        $dateFrom = $request->get('date_from') ?? $request->get('dateFrom');
        $dateTo = $request->get('date_to') ?? $request->get('dateTo');
        $pointsMin = $request->get('points_min') ?? $request->get('pointsMin');
        $pointsMax = $request->get('points_max') ?? $request->get('pointsMax');
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

        $base = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
            ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
            ->where('d.endorsed_by_mayor', 1);

        if ($status === 'validated') {
            $base->where('s.is_submitted', 1);
        } elseif ($status === 'approved') {
            $base->where('s.is_submitted', 2);
        } elseif ($status === 'assigned') {
            $base->where('s.is_submitted', 3);
        } elseif ($status === 'submitted') {
            $base->whereIn('s.is_submitted', [1, 2, 3]);
        }

        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) {
                $base->where('c.classification', $code);
            }
        }
        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('d.last_name', 'like', "%$search%")
                    ->orWhere('d.barangay', 'like', "%$search%");
            });
        }

        if ($barangay !== '') {
            $barangayAlt = str_replace('_', ' ', $barangay);
            $base->where(function ($q) use ($barangay, $barangayAlt) {
                $q->where('d.barangay', $barangay)
                    ->orWhere('d.barangay', $barangayAlt);
            });
        }
        if ($dateFrom) {
            $base->whereDate('s.date_interviewed', '>=', $dateFrom);
        }
        if ($dateTo) {
            $base->whereDate('s.date_interviewed', '<=', $dateTo);
        }

        $scored = $base->select(
            's.survey_id',
            's.date_interviewed',
            's.priority_score',
            's.score_calculated_at',
            'd.barangay',
            'd.last_name',
            'c.classification',
            'c.subclass_displaced',
            'c.subclass_doubleup',
            'c.subclass_homeless',
            'e.combine_monthly_income',
            'h.lot_ownership',
            'h.house_ownership',
            'h.temporary_living_area',
            'h.housing_structure',
            'h.type_of_toilet',
            'h.source_of_water',
            'h.source_of_electricity'
        )->selectRaw("COALESCE(s.priority_score, 0) as points");

        if (is_numeric($pointsMin)) {
            $min = (float) $pointsMin;
            $scored->where('s.priority_score', '>=', $min);
        }
        if (is_numeric($pointsMax)) {
            $max = (float) $pointsMax;
            $scored->where('s.priority_score', '<=', $max);
        }

        $total = (clone $scored)->count();

        $rows = $scored
            ->orderBy('d.barangay')
            ->orderBy('c.classification')
            ->orderByDesc('points')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->map(function ($row) {
                $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
                    6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
                ];
                $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
                $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');

                return $row;
            })
            ->values();

        return response()->json([
            'data' => $rows,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
        ]);
    }

    public function adminSurveyDetails(Request $request, $survey_id)
    {
        $s = DB::table('survey as s')->where('s.survey_id', $survey_id)->first();
        if (! $s) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $c = DB::table('classification')->where('survey_id', $survey_id)->first();
        $d = DB::table('demographic')->where('survey_id', $survey_id)->first();
        $h = DB::table('household')->where('survey_id', $survey_id)->first();
        $e = DB::table('economic')->where('survey_id', $survey_id)->first();
        $t = DB::table('training')->where('survey_id', $survey_id)->first();
        $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
        $displacedLabel = [
            1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
            6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
        ];
        $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
        $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
        $ynLabel = [0 => 'No', 1 => 'Yes'];
        $genderLabel = [1 => 'Male', 2 => 'Female'];
        $affLabel = [0 => 'None', 1 => 'SSS', 2 => 'GSIS', 3 => 'PhilHealth', 4 => 'PagIbig', 5 => 'PWD', 6 => 'Senior_Citizen', 7 => 'Solo_Parent', 8 => '4Ps'];
        $validatorName = null;
        $validatorSignatureData = null;
        if (! empty($s->validator_id)) {
            $validatorRow = DB::table('validator')
                ->select('name', 'signature_data')
                ->where('validator_id', $s->validator_id)
                ->first();
            if ($validatorRow) {
                $validatorName = $validatorRow->name ?? null;
                $validatorSignatureData = $validatorRow->signature_data ?? null;
            }
        }

        $surveyArr = [];
        $surveyArr['survey_id'] = $survey_id;
        $surveyArr['interviewed_by'] = $s->interviewed_by ?? null;
        $surveyArr['date_interviewed'] = $s->date_interviewed ?? null;
        $surveyArr['is_submitted'] = $s->is_submitted ?? null;
        $surveyArr['validator_signature'] = $validatorSignatureData ?: ($s->validator_signature ?? null);
        $surveyArr['validator_name'] = $validatorName;
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
            $primaryAff = $this->primaryAffiliationFromString($d->affiliations ?? null);
            if ($primaryAff === null) {
                $key = $d->affiliation ?? null;
                if (array_key_exists($key, $affLabel)) {
                    $primaryAff = $affLabel[$key];
                } else {
                    $primaryAff = $key;
                }
            }
            $surveyArr['affiliation'] = $primaryAff;
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
            ->join('survey as s', 's.survey_id', '=', 't.survey_id')
            ->select('t.house_photo')
            ->where('t.survey_id', $survey_id)
            ->first();
        if (! $row || empty($row->house_photo)) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $p = ltrim(trim((string) $row->house_photo), '/');
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
            ->join('survey as s', 's.survey_id', '=', 't.survey_id')
            ->select('t.person_photo')
            ->where('t.survey_id', $survey_id)
            ->first();
        if (! $row || empty($row->person_photo)) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $p = ltrim(trim((string) $row->person_photo), '/');
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
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $s = DB::table('survey as s')
            ->where('s.survey_id', $survey_id)
            ->where('s.validator_id', $validator_id)
            ->first();
        if (! $s) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $c = DB::table('classification')->where('survey_id', $survey_id)->first();
        $d = DB::table('demographic')->where('survey_id', $survey_id)->first();
        $h = DB::table('household')->where('survey_id', $survey_id)->first();
        $e = DB::table('economic')->where('survey_id', $survey_id)->first();
        $t = DB::table('training')->where('survey_id', $survey_id)->first();
        $members = DB::table('household_mem')->where('survey_id', $survey_id)->get();

        $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
        $displacedLabel = [
            1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
            6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
        ];
        $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
        $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
        $ynLabel = [0 => 'No', 1 => 'Yes'];
        $genderLabel = [1 => 'Male', 2 => 'Female'];
        $affLabel = [0 => 'None', 1 => 'SSS', 2 => 'GSIS', 3 => 'PhilHealth', 4 => 'PagIbig', 5 => 'PWD', 6 => 'Senior_Citizen', 7 => 'Solo_Parent', 8 => '4Ps'];

        $csv = fopen('php://temp', 'w+');
        fputcsv($csv, ['Section', 'Field', 'Value']);

        // Survey meta
        fputcsv($csv, ['Survey', 'survey_id', $survey_id]);
        fputcsv($csv, ['Survey', 'interviewed_by', $s->interviewed_by ?? '']);
        fputcsv($csv, ['Survey', 'date_interviewed', $s->date_interviewed ?? '']);
        fputcsv($csv, ['Survey', 'is_submitted', $s->is_submitted ?? '']);

        if ($c) {
            fputcsv($csv, ['Classification', 'previous_client', array_key_exists($c->previous_client, $ynLabel) ? $ynLabel[$c->previous_client] : ($c->previous_client ?? '')]);
            fputcsv($csv, ['Classification', 'year_inhabited', $c->year_inhabited ?? '']);
            fputcsv($csv, ['Classification', 'classification', array_key_exists($c->classification, $classLabel) ? $classLabel[$c->classification] : ($c->classification ?? '')]);
            fputcsv($csv, ['Classification', 'subclass_displaced', array_key_exists($c->subclass_displaced, $displacedLabel) ? $displacedLabel[$c->subclass_displaced] : ($c->subclass_displaced ?? '')]);
            fputcsv($csv, ['Classification', 'subclass_doubleup', array_key_exists($c->subclass_doubleup, $doubleupLabel) ? $doubleupLabel[$c->subclass_doubleup] : ($c->subclass_doubleup ?? '')]);
            fputcsv($csv, ['Classification', 'subclass_homeless', array_key_exists($c->subclass_homeless, $homelessLabel) ? $homelessLabel[$c->subclass_homeless] : ($c->subclass_homeless ?? '')]);
        }

        if ($d) {
            fputcsv($csv, ['Demographic', 'interview_person', $d->interview_person ?? '']);
            fputcsv($csv, ['Demographic', 'last_name', $d->last_name ?? '']);
            fputcsv($csv, ['Demographic', 'first_name', $d->first_name ?? '']);
            fputcsv($csv, ['Demographic', 'middle_name', $d->middle_name ?? '']);
            fputcsv($csv, ['Demographic', 'suffix', $d->suffix ?? '']);
            fputcsv($csv, ['Demographic', 'barangay', $d->barangay ?? '']);
            fputcsv($csv, ['Demographic', 'purok', $d->purok ?? '']);
            fputcsv($csv, ['Demographic', 'street', $d->street ?? '']);
            fputcsv($csv, ['Demographic', 'gender', $d->gender ?? '']);
            fputcsv($csv, ['Demographic', 'religion', $d->religion ?? '']);
            fputcsv($csv, ['Demographic', 'birth_place', $d->birth_place ?? '']);
            fputcsv($csv, ['Demographic', 'birth_date', $d->birth_date ?? '']);
            fputcsv($csv, ['Demographic', 'person_age', $d->person_age ?? '']);
            fputcsv($csv, ['Demographic', 'marital_status', $d->marital_status ?? '']);
            fputcsv($csv, ['Demographic', 'contact_number', $d->contact_number ?? '']);
            fputcsv($csv, ['Demographic', 'language_spoken', $d->language_spoken ?? '']);
            fputcsv($csv, ['Demographic', 'tribe', $d->tribe ?? '']);
            fputcsv($csv, ['Demographic', 'highest_education', $d->highest_education ?? '']);
            fputcsv($csv, ['Demographic', 'last_school_name', $d->last_school_name ?? '']);
            fputcsv($csv, ['Demographic', 'year_graduated', $d->year_graduated ?? '']);
            fputcsv($csv, ['Demographic', 'spouse_name', $d->spouse_name ?? '']);
            fputcsv($csv, ['Demographic', 'spouse_religion', $d->spouse_religion ?? '']);
            fputcsv($csv, ['Demographic', 'spouse_tribe', $d->spouse_tribe ?? '']);
            fputcsv($csv, ['Demographic', 'spouse_age', $d->spouse_age ?? '']);
            fputcsv($csv, ['Demographic', 'spouse_gender', array_key_exists($d->spouse_gender, $genderLabel) ? $genderLabel[$d->spouse_gender] : ($d->spouse_gender ?? '')]);
            $affPrimary = $this->primaryAffiliationFromString($d->affiliations ?? null);
            if ($affPrimary === null) {
                $key = $d->affiliation ?? null;
                if (array_key_exists($key, $affLabel)) {
                    $affPrimary = $affLabel[$key];
                } else {
                    $affPrimary = $key;
                }
            }
            fputcsv($csv, ['Demographic', 'affiliation', $affPrimary ?? '']);
        }

        if ($h) {
            fputcsv($csv, ['Household', 'lot_ownership', $h->lot_ownership ?? '']);
            fputcsv($csv, ['Household', 'house_ownership', $h->house_ownership ?? '']);
            fputcsv($csv, ['Household', 'avail_socialized_housing', $h->avail_socialized_housing ?? '']);
            fputcsv($csv, ['Household', 'temporary_living_area', $h->temporary_living_area ?? '']);
            fputcsv($csv, ['Household', 'housing_structure', $h->housing_structure ?? '']);
            fputcsv($csv, ['Household', 'type_of_toilet', $h->type_of_toilet ?? '']);
            fputcsv($csv, ['Household', 'source_of_water', $h->source_of_water ?? '']);
            fputcsv($csv, ['Household', 'source_of_electricity', $h->source_of_electricity ?? '']);
        }

        if ($e) {
            fputcsv($csv, ['Economic', 'main_income_source', $e->main_income_source ?? '']);
            fputcsv($csv, ['Economic', 'work_status', $e->work_status ?? '']);
            fputcsv($csv, ['Economic', 'work_location_head', $e->work_location_head ?? '']);
            fputcsv($csv, ['Economic', 'monthly_salary', $e->monthly_salary ?? '']);
            fputcsv($csv, ['Economic', 'combine_monthly_income', $e->combine_monthly_income ?? '']);
        }

        if ($t) {
            fputcsv($csv, ['Training', 'skills_for_living', $t->skills_for_living ?? '']);
            fputcsv($csv, ['Training', 'specific_skill', $t->specific_skill ?? '']);
            fputcsv($csv, ['Training', 'organization_member', $t->organization_member ?? '']);
            fputcsv($csv, ['Training', 'specific_organization', $t->specific_organization ?? '']);
            fputcsv($csv, ['Training', 'wanttolearn', $t->wanttolearn ?? '']);
            fputcsv($csv, ['Training', 'remarks', $t->remarks ?? '']);
            fputcsv($csv, ['Training', 'latitude', $t->latitude ?? '']);
            fputcsv($csv, ['Training', 'longitude', $t->longitude ?? '']);
        }

        foreach ($members as $i => $m) {
            $idx = $i + 1;
            fputcsv($csv, ['Member '.$idx, 'name', $m->name ?? '']);
            fputcsv($csv, ['Member '.$idx, 'relationship', $m->relationship ?? '']);
            fputcsv($csv, ['Member '.$idx, 'age', isset($m->age) ? $m->age : '']);
            fputcsv($csv, ['Member '.$idx, 'occupation', $m->occupation ?? '']);
            $cs = property_exists($m, 'civilStatus') ? $m->civilStatus : (property_exists($m, 'civil_status') ? $m->civil_status : null);
            $edu = property_exists($m, 'educationalAttainment') ? $m->educationalAttainment : (property_exists($m, 'educational_attainment') ? $m->educational_attainment : null);
            $inc = property_exists($m, 'monthlyIncome') ? $m->monthlyIncome : (property_exists($m, 'monthly_income') ? $m->monthly_income : null);
            fputcsv($csv, ['Member '.$idx, 'civil_status', $cs ?? '']);
            fputcsv($csv, ['Member '.$idx, 'educational_attainment', $edu ?? '']);
            fputcsv($csv, ['Member '.$idx, 'monthly_income', $inc ?? '']);
        }

        rewind($csv);
        $out = stream_get_contents($csv);
        fclose($csv);
        $filename = 'survey-'.$survey_id.'.csv';

        return response($out, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function adminExportSurveyCsv(Request $request, $survey_id)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $s = DB::table('survey as s')->where('s.survey_id', $survey_id)->first();
        if (! $s) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $c = DB::table('classification')->where('survey_id', $survey_id)->first();
        $d = DB::table('demographic')->where('survey_id', $survey_id)->first();
        $h = DB::table('household')->where('survey_id', $survey_id)->first();
        $e = DB::table('economic')->where('survey_id', $survey_id)->first();
        $t = DB::table('training')->where('survey_id', $survey_id)->first();
        $members = DB::table('household_mem')->where('survey_id', $survey_id)->get();

        $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
        $displacedLabel = [
            1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
            6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
        ];
        $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
        $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
        $ynLabel = [0 => 'No', 1 => 'Yes'];
        $genderLabel = [1 => 'Male', 2 => 'Female'];
        $affLabel = [0 => 'None', 1 => 'SSS', 2 => 'GSIS', 3 => 'PhilHealth', 4 => 'PagIbig', 5 => 'PWD', 6 => 'Senior_Citizen', 7 => 'Solo_Parent', 8 => '4Ps'];

        $csv = fopen('php://temp', 'w+');
        fputcsv($csv, ['Section', 'Field', 'Value']);

        // Survey meta
        fputcsv($csv, ['Survey', 'survey_id', $survey_id]);
        fputcsv($csv, ['Survey', 'interviewed_by', $s->interviewed_by ?? '']);
        fputcsv($csv, ['Survey', 'date_interviewed', $s->date_interviewed ?? '']);
        fputcsv($csv, ['Survey', 'is_submitted', $s->is_submitted ?? '']);

        if ($c) {
            fputcsv($csv, ['Classification', 'previous_client', array_key_exists($c->previous_client, $ynLabel) ? $ynLabel[$c->previous_client] : ($c->previous_client ?? '')]);
            fputcsv($csv, ['Classification', 'year_inhabited', $c->year_inhabited ?? '']);
            fputcsv($csv, ['Classification', 'classification', array_key_exists($c->classification, $classLabel) ? $classLabel[$c->classification] : ($c->classification ?? '')]);
            fputcsv($csv, ['Classification', 'subclass_displaced', array_key_exists($c->subclass_displaced, $displacedLabel) ? $displacedLabel[$c->subclass_displaced] : ($c->subclass_displaced ?? '')]);
            fputcsv($csv, ['Classification', 'subclass_doubleup', array_key_exists($c->subclass_doubleup, $doubleupLabel) ? $doubleupLabel[$c->subclass_doubleup] : ($c->subclass_doubleup ?? '')]);
            fputcsv($csv, ['Classification', 'subclass_homeless', array_key_exists($c->subclass_homeless, $homelessLabel) ? $homelessLabel[$c->subclass_homeless] : ($c->subclass_homeless ?? '')]);
        }

        if ($d) {
            fputcsv($csv, ['Demographic', 'interview_person', $d->interview_person ?? '']);
            fputcsv($csv, ['Demographic', 'last_name', $d->last_name ?? '']);
            fputcsv($csv, ['Demographic', 'first_name', $d->first_name ?? '']);
            fputcsv($csv, ['Demographic', 'middle_name', $d->middle_name ?? '']);
            fputcsv($csv, ['Demographic', 'suffix', $d->suffix ?? '']);
            fputcsv($csv, ['Demographic', 'barangay', $d->barangay ?? '']);
            fputcsv($csv, ['Demographic', 'purok', $d->purok ?? '']);
            fputcsv($csv, ['Demographic', 'street', $d->street ?? '']);
            fputcsv($csv, ['Demographic', 'gender', $d->gender ?? '']);
            fputcsv($csv, ['Demographic', 'religion', $d->religion ?? '']);
            fputcsv($csv, ['Demographic', 'birth_place', $d->birth_place ?? '']);
            fputcsv($csv, ['Demographic', 'birth_date', $d->birth_date ?? '']);
            fputcsv($csv, ['Demographic', 'person_age', $d->person_age ?? '']);
            fputcsv($csv, ['Demographic', 'marital_status', $d->marital_status ?? '']);
            fputcsv($csv, ['Demographic', 'contact_number', $d->contact_number ?? '']);
            fputcsv($csv, ['Demographic', 'language_spoken', $d->language_spoken ?? '']);
            fputcsv($csv, ['Demographic', 'tribe', $d->tribe ?? '']);
            fputcsv($csv, ['Demographic', 'highest_education', $d->highest_education ?? '']);
            fputcsv($csv, ['Demographic', 'last_school_name', $d->last_school_name ?? '']);
            fputcsv($csv, ['Demographic', 'year_graduated', $d->year_graduated ?? '']);
            fputcsv($csv, ['Demographic', 'spouse_name', $d->spouse_name ?? '']);
            fputcsv($csv, ['Demographic', 'spouse_religion', $d->spouse_religion ?? '']);
            fputcsv($csv, ['Demographic', 'spouse_tribe', $d->spouse_tribe ?? '']);
            fputcsv($csv, ['Demographic', 'spouse_age', $d->spouse_age ?? '']);
            fputcsv($csv, ['Demographic', 'spouse_gender', array_key_exists($d->spouse_gender, $genderLabel) ? $genderLabel[$d->spouse_gender] : ($d->spouse_gender ?? '')]);
            $affPrimary = $this->primaryAffiliationFromString($d->affiliations ?? null);
            if ($affPrimary === null) {
                $key = $d->affiliation ?? null;
                if (array_key_exists($key, $affLabel)) {
                    $affPrimary = $affLabel[$key];
                } else {
                    $affPrimary = $key;
                }
            }
            fputcsv($csv, ['Demographic', 'affiliation', $affPrimary ?? '']);
        }

        if ($h) {
            fputcsv($csv, ['Household', 'lot_ownership', $h->lot_ownership ?? '']);
            fputcsv($csv, ['Household', 'house_ownership', $h->house_ownership ?? '']);
            fputcsv($csv, ['Household', 'avail_socialized_housing', $h->avail_socialized_housing ?? '']);
            fputcsv($csv, ['Household', 'temporary_living_area', $h->temporary_living_area ?? '']);
            fputcsv($csv, ['Household', 'housing_structure', $h->housing_structure ?? '']);
            fputcsv($csv, ['Household', 'type_of_toilet', $h->type_of_toilet ?? '']);
            fputcsv($csv, ['Household', 'source_of_water', $h->source_of_water ?? '']);
            fputcsv($csv, ['Household', 'source_of_electricity', $h->source_of_electricity ?? '']);
        }

        if ($e) {
            fputcsv($csv, ['Economic', 'main_income_source', $e->main_income_source ?? '']);
            fputcsv($csv, ['Economic', 'work_status', $e->work_status ?? '']);
            fputcsv($csv, ['Economic', 'work_location_head', $e->work_location_head ?? '']);
            fputcsv($csv, ['Economic', 'monthly_salary', $e->monthly_salary ?? '']);
            fputcsv($csv, ['Economic', 'combine_monthly_income', $e->combine_monthly_income ?? '']);
        }

        if ($t) {
            fputcsv($csv, ['Training', 'skills_for_living', $t->skills_for_living ?? '']);
            fputcsv($csv, ['Training', 'specific_skill', $t->specific_skill ?? '']);
            fputcsv($csv, ['Training', 'organization_member', $t->organization_member ?? '']);
            fputcsv($csv, ['Training', 'specific_organization', $t->specific_organization ?? '']);
            fputcsv($csv, ['Training', 'wanttolearn', $t->wanttolearn ?? '']);
            fputcsv($csv, ['Training', 'remarks', $t->remarks ?? '']);
            fputcsv($csv, ['Training', 'latitude', $t->latitude ?? '']);
            fputcsv($csv, ['Training', 'longitude', $t->longitude ?? '']);
        }

        foreach ($members as $i => $m) {
            $idx = $i + 1;
            fputcsv($csv, ['Member '.$idx, 'name', $m->name ?? '']);
            fputcsv($csv, ['Member '.$idx, 'relationship', $m->relationship ?? '']);
            fputcsv($csv, ['Member '.$idx, 'age', isset($m->age) ? $m->age : '']);
            fputcsv($csv, ['Member '.$idx, 'occupation', $m->occupation ?? '']);
            $cs = property_exists($m, 'civilStatus') ? $m->civilStatus : (property_exists($m, 'civil_status') ? $m->civil_status : null);
            $edu = property_exists($m, 'educationalAttainment') ? $m->educationalAttainment : (property_exists($m, 'educational_attainment') ? $m->educational_attainment : null);
            $inc = property_exists($m, 'monthlyIncome') ? $m->monthlyIncome : (property_exists($m, 'monthly_income') ? $m->monthly_income : null);
            fputcsv($csv, ['Member '.$idx, 'civil_status', $cs ?? '']);
            fputcsv($csv, ['Member '.$idx, 'educational_attainment', $edu ?? '']);
            fputcsv($csv, ['Member '.$idx, 'monthly_income', $inc ?? '']);
        }

        rewind($csv);
        $out = stream_get_contents($csv);
        fclose($csv);
        $filename = 'survey-'.$survey_id.'.csv';

        return response($out, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function adminExportBarangayCsv(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string) $request->get('barangay', ''));
        if ($barangay === '') {
            return response()->json(['message' => 'Barangay required'], 422);
        }
        $status = strtolower(trim((string) $request->get('status', 'submitted')));
        $class = trim((string) $request->get('classification', ''));
        $dateFrom = $request->get('date_from') ?? $request->get('dateFrom');
        $dateTo = $request->get('date_to') ?? $request->get('dateTo');
        $pointsMin = $request->get('points_min') ?? $request->get('pointsMin');
        $pointsMax = $request->get('points_max') ?? $request->get('pointsMax');
        $affLabel = [0 => 'None', 1 => 'SSS', 2 => 'GSIS', 3 => 'PhilHealth', 4 => 'PagIbig', 5 => 'PWD', 6 => 'Senior_Citizen', 7 => 'Solo_Parent', 8 => '4Ps'];
        $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
        $displacedLabel = [1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise', 6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways'];
        $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
        $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
        $ynLabel = [0 => 'No', 1 => 'Yes'];
        $ynLabel = [0 => 'No', 1 => 'Yes'];
        $ynLabel = [0 => 'No', 1 => 'Yes'];
        $classMap = ['displaced' => 1, 'double-up' => 2, 'homeless' => 3, 'upgrading of land tenure' => 4];
        $base = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->leftJoin('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
            ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
            ->leftJoin('training as t', 't.survey_id', '=', 's.survey_id')
            ->leftJoin('assignments as a', 'a.survey_id', '=', 's.survey_id')
            ->leftJoin('siteproj as p', 'p.project_id', '=', 'a.project_id')
            ->where('d.barangay', $barangay);
        if ($status === 'validated') {
            $base->where('s.is_submitted', 1);
        } elseif ($status === 'approved') {
            $base->where('s.is_submitted', 2);
        } elseif ($status === 'assigned') {
            $base->where('s.is_submitted', 3);
        } elseif ($status === 'submitted') {
            $base->whereIn('s.is_submitted', [1, 2, 3]);
        }
        if ($class !== '') {
            $code = $classMap[strtolower($class)] ?? null;
            if ($code !== null) {
                $base->where('c.classification', $code);
            }
        }
        if ($dateFrom) {
            $base->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '>=', $dateFrom);
        }
        if ($dateTo) {
            $base->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '<=', $dateTo);
        }
        $rows = $base->select(
                'd.tag_number',
                'c.previous_client', 'c.year_inhabited', 'c.classification', 'c.subclass_displaced', 'c.subclass_doubleup', 'c.subclass_homeless',
                'd.last_name', 'd.first_name', 'd.middle_name', 'd.suffix', 'd.barangay', 'd.purok', 'd.street', 'd.gender', 'd.religion', 'd.birth_place', 'd.birth_date', 'd.person_age', 'd.marital_status', 'd.contact_number', 'd.language_spoken', 'd.tribe', 'd.highest_education', 'd.last_school_name', 'd.year_graduated', 'd.spouse_name', 'd.spouse_religion', 'd.spouse_tribe', 'd.spouse_age', 'd.spouse_gender', 'd.affiliations',
                'h.lot_ownership', 'h.house_ownership', 'h.avail_socialized_housing', 'h.temporary_living_area', 'h.housing_structure', 'h.type_of_toilet', 'h.source_of_water', 'h.source_of_electricity',
                'e.main_income_source', 'e.work_status', 'e.work_location_head', 'e.monthly_salary', 'e.combine_monthly_income',
                't.skills_for_living', 't.specific_skill', 't.organization_member', 't.specific_organization', 't.wanttolearn', 't.remarks',
                'p.project_name', 'a.block_no', 'a.lot_no', 'a.assignment_id'
            )
            ->orderBy('d.barangay', 'asc')
            ->orderBy('c.classification', 'asc')
            ->orderBy('s.survey_id', 'desc')
            ->get();
        $csv = fopen('php://temp', 'w+');
        $title = ucfirst(str_replace('_', ' ', $barangay)).' beneficiary list';
        fputcsv($csv, [$title]);
        $header = [
            'tag_number', 'project_site', 'block_no', 'lot_no', 'assignment_status',
            'previous_client', 'year_inhabited', 'classification', 'subclass_displaced', 'subclass_doubleup', 'subclass_homeless',
            'last_name', 'first_name', 'middle_name', 'suffix', 'barangay', 'purok', 'street', 'gender', 'religion', 'birth_place', 'birth_date', 'person_age', 'marital_status', 'contact_number', 'language_spoken', 'tribe', 'highest_education', 'last_school_name', 'year_graduated', 'spouse_name', 'spouse_religion', 'spouse_tribe', 'spouse_age', 'spouse_gender', 'affiliation',
            'lot_ownership', 'house_ownership', 'avail_socialized_housing', 'temporary_living_area', 'housing_structure', 'type_of_toilet', 'source_of_water', 'source_of_electricity',
            'main_income_source', 'work_status', 'work_location_head', 'monthly_salary', 'combine_monthly_income',
            'skills_for_living', 'specific_skill', 'organization_member', 'specific_organization', 'wanttolearn', 'remarks',
        ];
        fputcsv($csv, $header);
        foreach ($rows as $r) {
            $classificationName = array_key_exists($r->classification, $classLabel) ? $classLabel[$r->classification] : ($r->classification ?? '');
            $subDis = array_key_exists($r->subclass_displaced, $displacedLabel) ? $displacedLabel[$r->subclass_displaced] : ($r->subclass_displaced ?? '');
            $subDou = array_key_exists($r->subclass_doubleup, $doubleupLabel) ? $doubleupLabel[$r->subclass_doubleup] : ($r->subclass_doubleup ?? '');
            $subHom = array_key_exists($r->subclass_homeless, $homelessLabel) ? $homelessLabel[$r->subclass_homeless] : ($r->subclass_homeless ?? '');
            $affName = $this->primaryAffiliationFromString($r->affiliations ?? null);
            if ($affName === null) {
                $affKey = $r->affiliation ?? null;
                if (array_key_exists($affKey, $affLabel)) {
                    $affName = $affLabel[$affKey];
                } else {
                    $affName = $affKey;
                }
            }
            $arr = [
                'classification' => $classificationName,
                'subclass_displaced' => $subDis,
                'subclass_doubleup' => $subDou,
                'subclass_homeless' => $subHom,
                'combine_monthly_income' => $r->combine_monthly_income,
                'lot_ownership' => $r->lot_ownership,
                'house_ownership' => $r->house_ownership,
                'temporary_living_area' => $r->temporary_living_area,
                'housing_structure' => $r->housing_structure,
                'type_of_toilet' => $r->type_of_toilet,
                'source_of_water' => $r->source_of_water,
                'source_of_electricity' => $r->source_of_electricity,
            ];
            $points = $this->computePoints($arr);
            if (is_numeric($pointsMin) && $points < (float) $pointsMin) {
                continue;
            }
            if (is_numeric($pointsMax) && $points > (float) $pointsMax) {
                continue;
            }
            $assignmentStatus = $r->assignment_id ? 'Assigned' : 'Pending for assignment';
            $row = [
                $r->tag_number ?? '',
                $r->project_name ?? '',
                $r->block_no ?? '',
                $r->lot_no ?? '',
                $assignmentStatus,
                array_key_exists($r->previous_client, $ynLabel) ? $ynLabel[$r->previous_client] : ($r->previous_client ?? ''),
                $r->year_inhabited ?? '',
                $classificationName,
                $subDis,
                $subDou,
                $subHom,
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
                $affName ?? '',
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
                $r->remarks ?? '',
            ];
            fputcsv($csv, $row);
        }
        rewind($csv);
        $out = stream_get_contents($csv);
        fclose($csv);
        $filename = 'barangay-'.strtolower(str_replace(' ', '_', $barangay)).'.csv';

        return response($out, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function adminExportAffiliatedCsv(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string) $request->get('search', ''));
        $barangay = trim((string) $request->get('barangay', ''));
        $aff = trim((string) $request->get('affiliation', ''));
        $class = trim((string) $request->get('classification', ''));
        $status = strtolower(trim((string) $request->get('status', 'submitted')));
        $barangay = trim((string) $request->get('barangay', ''));
        $dateFrom = $request->get('date_from') ?? $request->get('dateFrom');
        $dateTo = $request->get('date_to') ?? $request->get('dateTo');
        $pointsMin = $request->get('points_min') ?? $request->get('pointsMin');
        $pointsMax = $request->get('points_max') ?? $request->get('pointsMax');

        $affMap = [
            'none' => 0, 'n/a' => 0,
            'sss' => 1, 'gsis' => 2, 'philhealth' => 3, 'pagibig' => 4,
            'pwd' => 5, 'senior_citizen' => 6, 'solo_parent' => 7, '4ps' => 8,
        ];
        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
        $displacedLabel = [1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise', 6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways'];
        $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
        $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
        $affLabel = [0 => 'None', 1 => 'SSS', 2 => 'GSIS', 3 => 'PhilHealth', 4 => 'PagIbig', 5 => 'PWD', 6 => 'Senior_Citizen', 7 => 'Solo_Parent', 8 => '4Ps'];
        $ynLabel = [0 => 'No', 1 => 'Yes'];

        $base = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
            ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
            ->leftJoin('assignments as a', 'a.survey_id', '=', 's.survey_id')
            ->leftJoin('siteproj as p', 'p.project_id', '=', 'a.project_id')
            ->whereNotNull('d.affiliations')
            ->where('d.affiliations', '<>', '')
            ->whereNotIn('d.affiliations', ['None', 'N/A'])
            ->where(function ($q) {
                $q->whereNull('d.endorsed_by_mayor')
                    ->orWhereIn('d.endorsed_by_mayor', [0, 2]);
            });
        if ($status === 'validated') {
            $base->where('s.is_submitted', 1);
        } elseif ($status === 'approved') {
            $base->where('s.is_submitted', 2);
        } elseif ($status === 'assigned') {
            $base->where('s.is_submitted', 3);
        } elseif ($status === 'submitted') {
            $base->whereIn('s.is_submitted', [1, 2, 3]);
        }
        if ($aff !== '') {
            $affStr = str_replace('_', ' ', $aff);
            $base->where('d.affiliations', 'like', "%$affStr%");
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
        }
        if ($dateFrom) {
            $base->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '>=', $dateFrom);
        }
        if ($dateTo) {
            $base->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '<=', $dateTo);
        }
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) {
                $base->where('c.classification', $code);
            }
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
        }
        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('d.last_name', 'like', "%$search%")
                    ->orWhere('d.barangay', 'like', "%$search%");
            });
        }

        $rows = $base->leftJoin('training as t', 't.survey_id', '=', 's.survey_id')
            ->select(
                's.interviewed_by', 's.date_interviewed', 'd.tag_number', 'p.project_name', 'a.block_no', 'a.lot_no', 'a.assignment_id', 's.is_submitted',
                'c.previous_client', 'c.year_inhabited', 'c.classification', 'c.subclass_displaced', 'c.subclass_doubleup', 'c.subclass_homeless',
                'd.last_name', 'd.first_name', 'd.middle_name', 'd.suffix', 'd.barangay', 'd.purok', 'd.street', 'd.gender', 'd.religion', 'd.birth_place', 'd.birth_date', 'd.person_age', 'd.marital_status', 'd.contact_number', 'd.language_spoken', 'd.tribe', 'd.highest_education', 'd.last_school_name', 'd.year_graduated', 'd.spouse_name', 'd.spouse_religion', 'd.spouse_tribe', 'd.spouse_age', 'd.spouse_gender', 'd.affiliations',
                'h.lot_ownership', 'h.house_ownership', 'h.avail_socialized_housing', 'h.temporary_living_area', 'h.housing_structure', 'h.type_of_toilet', 'h.source_of_water', 'h.source_of_electricity',
                'e.main_income_source', 'e.work_status', 'e.work_location_head', 'e.monthly_salary', 'e.combine_monthly_income',
                't.skills_for_living', 't.specific_skill', 't.organization_member', 't.specific_organization', 't.wanttolearn', 't.remarks'
            )
            ->orderBy('d.barangay', 'asc')
            ->orderBy('c.classification', 'asc')
            ->orderBy('s.survey_id', 'desc')
            ->get();

        $csv = fopen('php://temp', 'w+');
        fputcsv($csv, [
            'interviewed_by', 'date_interviewed', 'tag_number', 'project_site', 'block_no', 'lot_no', 'identifier', 'assignment_status',
            'previous_client', 'year_inhabited', 'classification', 'subclass_displaced', 'subclass_doubleup', 'subclass_homeless',
            'last_name', 'first_name', 'middle_name', 'suffix', 'barangay', 'purok', 'street', 'gender', 'religion', 'birth_place', 'birth_date', 'person_age', 'marital_status', 'contact_number', 'language_spoken', 'tribe', 'highest_education', 'last_school_name', 'year_graduated', 'spouse_name', 'spouse_religion', 'spouse_tribe', 'spouse_age', 'spouse_gender', 'affiliation',
            'lot_ownership', 'house_ownership', 'avail_socialized_housing', 'temporary_living_area', 'housing_structure', 'type_of_toilet', 'source_of_water', 'source_of_electricity',
            'main_income_source', 'work_status', 'work_location_head', 'monthly_salary', 'combine_monthly_income',
            'skills_for_living', 'specific_skill', 'organization_member', 'specific_organization', 'wanttolearn', 'remarks',
        ]);

        foreach ($rows as $row) {
            $row->classification = $classLabel[$row->classification] ?? $row->classification;
            $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
            $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
            $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
            $rowAff = $this->primaryAffiliationFromString($row->affiliations ?? null);
            if ($rowAff === null) {
                $key = $row->affiliation ?? null;
                if (array_key_exists($key, $affLabel)) {
                    $rowAff = $affLabel[$key];
                } else {
                    $rowAff = $key;
                }
            }
            $row->affiliation = $rowAff;
            $assignmentStatus = $row->assignment_id ? 'assigned' : 'pending for assignment';
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
            $points = $this->computePoints($arr);
            fputcsv($csv, [
                $row->interviewed_by ?? '',
                $row->date_interviewed ?? '',
                $row->tag_number ?? '',
                $row->project_name ?? '',
                $row->block_no ?? '',
                $row->lot_no ?? '',
                'affiliated',
                $assignmentStatus,
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
            'Content-Disposition' => 'attachment; filename="affiliated_beneficiaries.csv"',
        ]);
    }

    public function adminExportValidatedCsv(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string) $request->get('search', ''));
        $barangay = trim((string) $request->get('barangay', ''));
        $class = trim((string) $request->get('classification', ''));

        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
        $displacedLabel = [1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise', 6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways'];
        $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
        $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];

        $base = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
            ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
            ->leftJoin('training as t', 't.survey_id', '=', 's.survey_id')
            ->leftJoin('assignments as a', 'a.survey_id', '=', 's.survey_id')
            ->leftJoin('siteproj as p', 'p.project_id', '=', 'a.project_id')
            ->leftJoin('assignments as a', 'a.survey_id', '=', 's.survey_id')
            ->leftJoin('siteproj as p', 'p.project_id', '=', 'a.project_id')
            ->whereIn('s.is_submitted', [1, 2, 3])
            ->where(function ($q) {
                $q->whereNull('d.affiliations')
                    ->orWhere('d.affiliations', '')
                    ->orWhere('d.affiliations', 'None')
                    ->orWhere('d.affiliations', 'N/A');
            })
            ->where(function ($q) {
                $q->whereNull('d.endorsed_by_mayor')
                    ->orWhereIn('d.endorsed_by_mayor', [0, 2]);
            });
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) {
                $base->where('c.classification', $code);
            }
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
        }
        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('d.last_name', 'like', "%$search%")
                    ->orWhere('d.barangay', 'like', "%$search%");
            });
        }

        $rows = $base->select(
            's.interviewed_by', 's.date_interviewed', 'd.tag_number', 'p.project_name', 'a.block_no', 'a.lot_no', 'a.assignment_id', 's.is_submitted',
            'c.previous_client', 'c.year_inhabited', 'c.classification', 'c.subclass_displaced', 'c.subclass_doubleup', 'c.subclass_homeless',
            'd.last_name', 'd.first_name', 'd.middle_name', 'd.suffix', 'd.barangay', 'd.purok', 'd.street', 'd.gender', 'd.religion', 'd.birth_place', 'd.birth_date', 'd.person_age', 'd.marital_status', 'd.contact_number', 'd.language_spoken', 'd.tribe', 'd.highest_education', 'd.last_school_name', 'd.year_graduated', 'd.spouse_name', 'd.spouse_religion', 'd.spouse_tribe', 'd.spouse_age', 'd.spouse_gender', 'd.affiliations',
            'h.lot_ownership', 'h.house_ownership', 'h.avail_socialized_housing', 'h.temporary_living_area', 'h.housing_structure', 'h.type_of_toilet', 'h.source_of_water', 'h.source_of_electricity',
            'e.main_income_source', 'e.work_status', 'e.work_location_head', 'e.monthly_salary', 'e.combine_monthly_income',
            't.skills_for_living', 't.specific_skill', 't.organization_member', 't.specific_organization', 't.wanttolearn', 't.remarks'
        )
            ->orderBy('d.barangay', 'asc')
            ->orderBy('c.classification', 'asc')
            ->orderBy('s.survey_id', 'desc')
            ->get();

        $csv = fopen('php://temp', 'w+');
        fputcsv($csv, [
            'interviewed_by', 'date_interviewed', 'tag_number', 'project_site', 'block_no', 'lot_no', 'identifier', 'assignment_status',
            'previous_client', 'year_inhabited', 'classification', 'subclass_displaced', 'subclass_doubleup', 'subclass_homeless',
            'last_name', 'first_name', 'middle_name', 'suffix', 'barangay', 'purok', 'street', 'gender', 'religion', 'birth_place', 'birth_date', 'person_age', 'marital_status', 'contact_number', 'language_spoken', 'tribe', 'highest_education', 'last_school_name', 'year_graduated', 'spouse_name', 'spouse_religion', 'spouse_tribe', 'spouse_age', 'spouse_gender', 'affiliation',
            'lot_ownership', 'house_ownership', 'avail_socialized_housing', 'temporary_living_area', 'housing_structure', 'type_of_toilet', 'source_of_water', 'source_of_electricity',
            'main_income_source', 'work_status', 'work_location_head', 'monthly_salary', 'combine_monthly_income',
            'skills_for_living', 'specific_skill', 'organization_member', 'specific_organization', 'wanttolearn', 'remarks',
        ]);
        foreach ($rows as $row) {
            $row->classification = $classLabel[$row->classification] ?? $row->classification;
            $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
            $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
            $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
            $assignmentStatus = $row->assignment_id ? 'assigned' : 'pending for assignment';
            fputcsv($csv, [
                $row->interviewed_by ?? '',
                $row->date_interviewed ?? '',
                $row->tag_number ?? '',
                $row->project_name ?? '',
                $row->block_no ?? '',
                $row->lot_no ?? '',
                'none-affiliated',
                $assignmentStatus,
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
                $this->primaryAffiliationFromString($row->affiliations ?? null) ?? '',
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
            'Content-Disposition' => 'attachment; filename="validated_beneficiaries.csv"',
        ]);
    }

    public function adminExportMayorCsv(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string) $request->get('search', ''));
        $barangay = trim((string) $request->get('barangay', ''));
        $class = trim((string) $request->get('classification', ''));

        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];
        $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
        $displacedLabel = [1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise', 6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways'];
        $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
        $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];

        $base = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
            ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
            ->leftJoin('training as t', 't.survey_id', '=', 's.survey_id')
            ->where('d.endorsed_by_mayor', 1)
            ->whereIn('s.is_submitted', [1, 2, 3]);
        if ($class !== '') {
            $lc = strtolower($class);
            $code = $classMap[$lc] ?? null;
            if ($code !== null) {
                $base->where('c.classification', $code);
            }
        }
        if ($barangay !== '') {
            $base->where('d.barangay', $barangay);
        }
        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('d.last_name', 'like', "%$search%")
                    ->orWhere('d.barangay', 'like', "%$search%");
            });
        }

        $rows = $base->select(
            's.interviewed_by', 's.date_interviewed', 'd.tag_number', 'p.project_name', 'a.block_no', 'a.lot_no', 'a.assignment_id', 's.is_submitted',
            'c.previous_client', 'c.year_inhabited', 'c.classification', 'c.subclass_displaced', 'c.subclass_doubleup', 'c.subclass_homeless',
            'd.last_name', 'd.first_name', 'd.middle_name', 'd.suffix', 'd.barangay', 'd.purok', 'd.street', 'd.gender', 'd.religion', 'd.birth_place', 'd.birth_date', 'd.person_age', 'd.marital_status', 'd.contact_number', 'd.language_spoken', 'd.tribe', 'd.highest_education', 'd.last_school_name', 'd.year_graduated', 'd.spouse_name', 'd.spouse_religion', 'd.spouse_tribe', 'd.spouse_age', 'd.spouse_gender', 'd.affiliations',
            'h.lot_ownership', 'h.house_ownership', 'h.avail_socialized_housing', 'h.temporary_living_area', 'h.housing_structure', 'h.type_of_toilet', 'h.source_of_water', 'h.source_of_electricity',
            'e.main_income_source', 'e.work_status', 'e.work_location_head', 'e.monthly_salary', 'e.combine_monthly_income',
            't.skills_for_living', 't.specific_skill', 't.organization_member', 't.specific_organization', 't.wanttolearn', 't.remarks'
        )
            ->orderBy('d.barangay', 'asc')
            ->orderBy('c.classification', 'asc')
            ->orderBy('s.survey_id', 'desc')
            ->get();

        $csv = fopen('php://temp', 'w+');
        fputcsv($csv, [
            'interviewed_by', 'date_interviewed', 'tag_number', 'project_site', 'block_no', 'lot_no', 'identifier', 'assignment_status',
            'previous_client', 'year_inhabited', 'classification', 'subclass_displaced', 'subclass_doubleup', 'subclass_homeless',
            'last_name', 'first_name', 'middle_name', 'suffix', 'barangay', 'purok', 'street', 'gender', 'religion', 'birth_place', 'birth_date', 'person_age', 'marital_status', 'contact_number', 'language_spoken', 'tribe', 'highest_education', 'last_school_name', 'year_graduated', 'spouse_name', 'spouse_religion', 'spouse_tribe', 'spouse_age', 'spouse_gender', 'affiliation',
            'lot_ownership', 'house_ownership', 'avail_socialized_housing', 'temporary_living_area', 'housing_structure', 'type_of_toilet', 'source_of_water', 'source_of_electricity',
            'main_income_source', 'work_status', 'work_location_head', 'monthly_salary', 'combine_monthly_income',
            'skills_for_living', 'specific_skill', 'organization_member', 'specific_organization', 'wanttolearn', 'remarks',
        ]);
        foreach ($rows as $row) {
            $row->classification = $classLabel[$row->classification] ?? $row->classification;
            $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
            $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
            $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');
            $assignmentStatus = $row->assignment_id ? 'assigned' : 'pending for assignment';
            fputcsv($csv, [
                $row->interviewed_by ?? '',
                $row->date_interviewed ?? '',
                $row->tag_number ?? '',
                $row->project_name ?? '',
                $row->block_no ?? '',
                $row->lot_no ?? '',
                'mayor-endorsed',
                $assignmentStatus,
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
                $this->primaryAffiliationFromString($row->affiliations ?? null) ?? '',
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
            'Content-Disposition' => 'attachment; filename="mayor_endorsed_beneficiaries.csv"',
        ]);
    }

    public function validatorExportBarangayCsv(Request $request)
    {
        $validator_id = session('validator_id');
        if (! $validator_id) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string) $request->get('barangay', ''));
        if ($barangay === '') {
            return response()->json(['message' => 'Barangay required'], 422);
        }
        $scope = strtolower(trim((string) $request->get('scope', 'all')));
        $class = trim((string) $request->get('classification', ''));
        $affLabel = [0 => 'None', 1 => 'SSS', 2 => 'GSIS', 3 => 'PhilHealth', 4 => 'PagIbig', 5 => 'PWD', 6 => 'Senior_Citizen', 7 => 'Solo_Parent', 8 => '4Ps'];
        $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
        $displacedLabel = [1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise', 6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways'];
        $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
        $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
        $ynLabel = [0 => 'No', 1 => 'Yes'];
        $classMap = ['displaced' => 1, 'double-up' => 2, 'homeless' => 3, 'upgrading of land tenure' => 4];

        $hasDeletedAt = Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at');
        $base = DB::table('survey as s')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->leftJoin('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
            ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
            ->leftJoin('training as t', 't.survey_id', '=', 's.survey_id')
            ->leftJoin('assignments as a', 'a.survey_id', '=', 's.survey_id')
            ->where('s.validator_id', $validator_id)
            ->where('d.barangay', $barangay);
        if ($hasDeletedAt) {
            $base->whereNull('s.deleted_at');
        }
        if ($scope === 'submitted') {
            $base->whereIn('s.is_submitted', [1, 2, 3]);
        } elseif ($scope === 'survey') {
            $base->where(function ($q) {
                $q->whereNull('s.is_submitted')->orWhere('s.is_submitted', 0);
            });
        }
        if ($class !== '') {
            $code = $classMap[strtolower($class)] ?? null;
            if ($code !== null) {
                $base->where('c.classification', $code);
            }
        }
        $rows = $base->select(
            's.interviewed_by', 's.date_interviewed', 'd.tag_number', 's.is_submitted', 'a.assignment_id',
            'c.previous_client', 'c.year_inhabited', 'c.classification', 'c.subclass_displaced', 'c.subclass_doubleup', 'c.subclass_homeless',
            'd.last_name', 'd.first_name', 'd.middle_name', 'd.suffix', 'd.barangay', 'd.purok', 'd.street', 'd.gender', 'd.religion', 'd.birth_place', 'd.birth_date', 'd.person_age', 'd.marital_status', 'd.contact_number', 'd.language_spoken', 'd.tribe', 'd.highest_education', 'd.last_school_name', 'd.year_graduated', 'd.spouse_name', 'd.spouse_religion', 'd.spouse_tribe', 'd.spouse_age', 'd.spouse_gender', 'd.affiliations',
            'h.lot_ownership', 'h.house_ownership', 'h.avail_socialized_housing', 'h.temporary_living_area', 'h.housing_structure', 'h.type_of_toilet', 'h.source_of_water', 'h.source_of_electricity',
            'e.main_income_source', 'e.work_status', 'e.work_location_head', 'e.monthly_salary', 'e.combine_monthly_income',
            't.skills_for_living', 't.specific_skill', 't.organization_member', 't.specific_organization', 't.wanttolearn', 't.remarks'
        )
            ->orderBy('d.barangay', 'asc')
            ->orderBy('c.classification', 'asc')
            ->orderBy('s.survey_id', 'desc')
            ->get();
        $csv = fopen('php://temp', 'w+');
        $title = ucfirst(str_replace('_', ' ', $barangay)).' beneficiaries list';
        fputcsv($csv, [$title]);
        $header = [
            'interviewed_by', 'date_interviewed', 'tag_number', 'status',
            'previous_client', 'year_inhabited', 'classification', 'subclass_displaced', 'subclass_doubleup', 'subclass_homeless',
            'last_name', 'first_name', 'middle_name', 'suffix', 'barangay', 'purok', 'street', 'gender', 'religion', 'birth_place', 'birth_date', 'person_age', 'marital_status', 'contact_number', 'language_spoken', 'tribe', 'highest_education', 'last_school_name', 'year_graduated', 'spouse_name', 'spouse_religion', 'spouse_tribe', 'spouse_age', 'spouse_gender', 'affiliation',
            'lot_ownership', 'house_ownership', 'avail_socialized_housing', 'temporary_living_area', 'housing_structure', 'type_of_toilet', 'source_of_water', 'source_of_electricity',
            'main_income_source', 'work_status', 'work_location_head', 'monthly_salary', 'combine_monthly_income',
            'skills_for_living', 'specific_skill', 'organization_member', 'specific_organization', 'wanttolearn', 'remarks',
        ];
        fputcsv($csv, $header);
        foreach ($rows as $r) {
            $row = [
                $r->interviewed_by ?? '',
                $r->date_interviewed ?? '',
                $r->tag_number ?? '',
                (function ($s) {
                    if ($s === 1) {
                        return 'validated';
                    }
                    if ($s === 2) {
                        return 'approved';
                    }
                    if ($s === 3) {
                        return 'assigned';
                    }

                    return 'pending';
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
                $this->primaryAffiliationFromString($r->affiliations ?? null) ?? '',
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
                $r->remarks ?? '',
            ];
            fputcsv($csv, $row);
        }
        rewind($csv);
        $out = stream_get_contents($csv);
        fclose($csv);
        $filename = 'barangay-'.strtolower(str_replace(' ', '_', $barangay)).'.csv';

        return response($out, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function adminMapPoints(Request $request)
    {
        $scope = strtolower(trim((string) $request->get('scope', 'submitted')));
        $mode = strtolower(trim((string) $request->get('mode', 'barangay')));
        $startYear = $request->get('start_year');
        $endYear = $request->get('end_year');

        if ($mode === 'survey') {
            $cacheKey = 'admin_map_points_survey_'.md5(json_encode([$scope, $startYear, $endYear]));
            $points = Cache::remember($cacheKey, 300, function () use ($scope, $startYear, $endYear) {
                $rows = DB::table('survey as s')
                    ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                    ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                    ->leftJoin('training as t', 't.survey_id', '=', 's.survey_id')
                    ->select('s.survey_id', 's.is_submitted', 'd.barangay', 'c.classification', 'd.first_name', 'd.last_name', 'd.middle_name', 'd.suffix', 'd.tag_number', 't.latitude', 't.longitude', 't.house_photo', 't.person_photo');
                if ($scope === 'validated') {
                    $rows->where('s.is_submitted', 1);
                } elseif ($scope === 'approved') {
                    $rows->where('s.is_submitted', 2);
                } elseif ($scope === 'assigned') {
                    $rows->where('s.is_submitted', 3);
                } else {
                    $rows->whereIn('s.is_submitted', [1, 2, 3]);
                }
                if ($startYear && $endYear) {
                    $start = Carbon::createMidnightDate((int) $startYear, 1, 1)->toDateString();
                    $end = Carbon::createMidnightDate((int) $endYear, 12, 31)->toDateString();
                    $rows->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '>=', $start)->whereDate('s.date_interviewed', '<=', $end);
                }
                if (Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at')) {
                    $rows->whereNull('s.deleted_at');
                }
                $rows->whereNotNull('t.latitude')->whereNotNull('t.longitude');
                $rows = $rows->get();

                $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
                $points = [];
                foreach ($rows as $r) {
                    $lat = is_numeric($r->latitude ?? null) ? (float) $r->latitude : null;
                    $lng = is_numeric($r->longitude ?? null) ? (float) $r->longitude : null;
                    if ($lat === null || $lng === null) {
                        continue;
                    }
                    $nameParts = [];
                    if (! empty($r->first_name)) {
                        $nameParts[] = $r->first_name;
                    }
                    if (! empty($r->middle_name)) {
                        $nameParts[] = substr($r->middle_name, 0, 1).'.';
                    }
                    if (! empty($r->last_name)) {
                        $nameParts[] = $r->last_name;
                    }
                    if (! empty($r->suffix)) {
                        $nameParts[] = $r->suffix;
                    }
                    $name = implode(' ', $nameParts);
                    $hasPhoto = ! empty($r->house_photo);
                    $hasPersonPhoto = ! empty($r->person_photo);
                    $points[] = [
                        'survey_id' => $r->survey_id,
                        'is_submitted' => (int) ($r->is_submitted ?? 0),
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

                return $points;
            });

            return response()->json(['points' => $points]);
        }

        $cacheKey = 'admin_map_points_barangay_'.md5(json_encode([$scope, $startYear, $endYear]));
        $points = Cache::remember($cacheKey, 300, function () use ($scope, $startYear, $endYear) {
            $countsQuery = DB::table('survey as s')
                ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->select('d.barangay', 'c.classification', DB::raw('COUNT(*) AS count'));
            $coordsQuery = DB::table('survey as s')
                ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->leftJoin('training as t', 't.survey_id', '=', 's.survey_id')
                ->select(
                    'd.barangay',
                    DB::raw('MAX(t.latitude) AS latitude'),
                    DB::raw('MAX(t.longitude) AS longitude')
                );

            if ($scope === 'validated') {
                $countsQuery->where('s.is_submitted', 1);
                $coordsQuery->where('s.is_submitted', 1);
            } elseif ($scope === 'approved') {
                $countsQuery->where('s.is_submitted', 2);
                $coordsQuery->where('s.is_submitted', 2);
            } elseif ($scope === 'assigned') {
                $countsQuery->where('s.is_submitted', 3);
                $coordsQuery->where('s.is_submitted', 3);
            } else {
                $countsQuery->whereIn('s.is_submitted', [1, 2, 3]);
                $coordsQuery->whereIn('s.is_submitted', [1, 2, 3]);
            }
            if ($startYear && $endYear) {
                $start = Carbon::createMidnightDate((int) $startYear, 1, 1)->toDateString();
                $end = Carbon::createMidnightDate((int) $endYear, 12, 31)->toDateString();
                $countsQuery->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '>=', $start)->whereDate('s.date_interviewed', '<=', $end);
                $coordsQuery->whereNotNull('s.date_interviewed')->whereDate('s.date_interviewed', '>=', $start)->whereDate('s.date_interviewed', '<=', $end);
            }
            if (Schema::hasTable('survey') && Schema::hasColumn('survey', 'deleted_at')) {
                $countsQuery->whereNull('s.deleted_at');
                $coordsQuery->whereNull('s.deleted_at');
            }

            $counts = $countsQuery->groupBy('d.barangay', 'c.classification')->get();
            $coords = $coordsQuery->groupBy('d.barangay')->get();

            $coordMap = [];
            foreach ($coords as $c) {
                $coordMap[$c->barangay ?: 'Unknown'] = [
                    'lat' => is_numeric($c->latitude ?? null) ? (float) $c->latitude : null,
                    'lng' => is_numeric($c->longitude ?? null) ? (float) $c->longitude : null,
                ];
            }
            $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];

            $points = [];
            foreach ($counts as $row) {
                $b = $row->barangay ?: 'Unknown';
                $cls = $classLabel[$row->classification] ?? ($row->classification ?: 'Unknown');
                if (! isset($points[$b])) {
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
                    $points[$b]['counts'][$cls] += (int) $row->count;
                }
                $points[$b]['total'] += (int) $row->count;
            }

            return array_values($points);
        });

        return response()->json(['points' => $points]);
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
                        $points += 1;
                        break;
                    case 'Earthquake Affected':
                    case 'Landslide Affected':
                    case 'Flood Affected':
                    case 'Eviction/Demolition Order':
                        $points += 3;
                        break;
                    case 'Human Induced Disaster':
                    case 'Infra Projects':
                        $points += 4;
                        break;
                    default: $points += 0;
                }
                break;
            case 'Double-up':
            case 'Double-Up':
            case 'Doubled-up':
                switch ($subclass_doubleup) {
                    case 'Renter/Tenant': $points += 6;
                        break;
                    case 'Rent-free/Sharer': $points += 7;
                        break;
                    case 'Caretaker': $points += 3;
                        break;
                    default: $points += 0;
                }
                break;
            case 'Homeless':
                switch ($subclass_homeless) {
                    case 'Public - living in tent': $points += 30;
                        break;
                    case 'Private - living in tent': $points += 20;
                        break;
                    default: $points += 30;
                }
                break;
            case 'Upgrading_of_Land_Tenure':
            case 'Upgrading of Land Tenure':
            case 'upgrading':
                $points += 10;
                break;
            default:
                $points += 0;
        }

        $incomeBandKey = $this->incomeBandKeyFromValue($row['combine_monthly_income'] ?? null);
        switch ($incomeBandKey) {
            case '0_2999': $points += 30;
                break;
            case '3000_5999': $points += 25;
                break;
            case '6000_8999': $points += 20;
                break;
            case '9000_12999': $points += 15;
                break;
            case '13000_plus': $points += 10;
                break;
            default: $points += 0;
        }

        $points += (($row['lot_ownership'] ?? '') === 'Yes') ? 20 : 0;
        $points += (($row['house_ownership'] ?? '') === 'Yes') ? 30 : 0;
        $points += (($row['temporary_living_area'] ?? '') === 'Yes') ? 50 : 0;

        switch ($row['housing_structure'] ?? '') {
            case 'Full_Concrete': $points += 3;
                break;
            case 'Made_of_wood_and_metal_roof': $points += 15;
                break;
            case 'Made_of_Amakan_and_Nipa': $points += 25;
                break;
            case 'Combination_of_concrete_and_wood': $points += 10;
                break;
            case 'Made_of_Amakan_and_metal_roof': $points += 15;
                break;
            case 'Others': $points += 2;
                break;
            default: $points += 0;
        }

        switch ($row['type_of_toilet'] ?? '') {
            case 'Water_Sealed': $points += 20;
                break;
            case 'Open_Pit/Antipolo': $points += 30;
                break;
            case 'No_Toilet': $points += 40;
                break;
            case 'Others': $points += 10;
                break;
            default: $points += 0;
        }

        switch ($row['source_of_water'] ?? '') {
            case 'NAWASA': $points += 4;
                break;
            case 'Deep_Well': $points += 15;
                break;
            case 'Spring': $points += 20;
                break;
            case 'Rainwater': $points += 25;
                break;
            case 'Surface_Water': $points += 30;
                break;
            case 'Others': $points += 6;
                break;
            default: $points += 0;
        }

        switch ($row['source_of_electricity'] ?? '') {
            case 'With_own_meter': $points += 15;
                break;
            case 'Tapping_to_the_neighbor': $points += 25;
                break;
            case 'Solar_Panel': $points += 20;
                break;
            case 'Candle/Lamp': $points += 30;
                break;
            case 'Others': $points += 10;
                break;
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
            ->select('username', 'email')
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
        if (! $email && ! $password) {
            return response()->json(['message' => 'No changes'], 400);
        }
        $row = DB::table('admin')->select('password')->where('username', $username)->first();
        if ($password) {
            $current = $request->input('current_password');
            $valid = $row && (password_verify($current, $row->password) || $current === $row->password);
            if (! $valid) {
                return response()->json(['errors' => ['current_password' => ['Current password is incorrect']]], 422);
            }
        }
        $update = [];
        if ($email) {
            $update['email'] = $email;
        }
        if ($password) {
            $update['password'] = password_hash($password, PASSWORD_BCRYPT);
        }
        DB::table('admin')->where('username', $username)->update($update);

        return response()->json(['ok' => true]);
    }

    public function adminProjectSitesList(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string) $request->get('search', ''));
        $base = DB::table('siteproj');
        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('project_name', 'like', "%$search%")
                    ->orWhere('barangay', 'like', "%$search%")
                    ->orWhere('year_started', 'like', "%$search%")
                    ->orWhere('description', 'like', "%$search%");
            });
        }
        $rows = $base->orderBy('project_id', 'desc')->get();
        $data = [];
        foreach ($rows as $r) {
            $img = is_string($r->proj_image ?? null) ? $r->proj_image : '';
            $url = null;
            if ($img !== '') {
                // Use FileStorageService to get the URL
                $url = FileStorageService::getUrl($img);
            }
            $blocksJson = property_exists($r, 'blocks_json') ? ($r->blocks_json ?? null) : null;
            $availableLotsTotal = 0;
            try {
                $maxByBlock = $this->computeMaxLotsByBlock($r);
                $capacity = is_array($maxByBlock) ? array_sum(array_map('intval', $maxByBlock)) : 0;
                if ($capacity > 0) {
                    $assignedCount = DB::table('assignments')->where('project_id', (int) $r->project_id)->count();
                    $availableLotsTotal = max(0, $capacity - $assignedCount);
                }
            } catch (\Throwable $e) {
                $availableLotsTotal = 0;
            }
            $data[] = [
                'project_id' => (int) $r->project_id,
                'project_name' => $r->project_name,
                'land_area' => $r->land_area,
                'total_blocks' => (int) ($r->total_blocks ?? 0),
                'total_lots' => (int) ($r->total_lots ?? 0),
                'barangay' => $r->barangay,
                'year_started' => $r->year_started,
                'description' => $r->description,
                'proj_image' => $img,
                'image_url' => $url,
                'geojson' => property_exists($r, 'geojson') ? $r->geojson : null,
                'blocks_json' => $blocksJson,
                'available_lots' => $availableLotsTotal,
            ];
        }

        return response()->json(['data' => $data]);
    }

    public function adminProjectSitesCreate(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (! Schema::hasTable('siteproj')) {
            return response()->json(['message' => 'Project sites table missing'], 422);
        }
        $validated = $request->validate([
            'project_name' => ['required', 'string', 'max:255'],
            'land_area' => ['nullable', 'numeric'],
            'total_blocks' => ['nullable', 'integer', 'min:0'],
            'total_lots' => ['nullable', 'integer', 'min:0'],
            'barangay' => ['nullable', 'string', 'max:100'],
            'year_started' => ['nullable', 'digits:4'],
            'description' => ['nullable', 'string'],
            'proj_image' => ['nullable', 'file', 'image', 'max:5120'],
            'blocks_json' => ['nullable', 'string'],
        ]);

        $path = null;
        if ($request->hasFile('proj_image')) {
            // Use FileStorageService for dual storage
            $result = FileStorageService::store(
                $request->file('proj_image'),
                'projects',
                'proj_'
            );
            
            if ($result['success']) {
                $path = $result['path']; // e.g., 'projects/proj_xxx.jpg'
            }
        }
        $columns = Schema::getColumnListing('siteproj');
        if (! in_array('blocks_json', $columns)) {
            try {
                Schema::table('siteproj', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->longText('blocks_json')->nullable();
                });
                $columns = Schema::getColumnListing('siteproj');
            } catch (\Throwable $e) {
            }
        }
        $payload = [
            'project_name' => $validated['project_name'],
            'land_area' => $validated['land_area'] ?? 0,
            'total_blocks' => $validated['total_blocks'] ?? 0,
            'total_lots' => $validated['total_lots'] ?? 0,
            'barangay' => $validated['barangay'] ?? '',
            'year_started' => $validated['year_started'] ?? date('Y'),
            'description' => $validated['description'] ?? '',
            'proj_image' => $path ?? '',
            'blocks_json' => $validated['blocks_json'] ?? null,
        ];
        $filtered = array_intersect_key($payload, array_flip($columns));
        try {
            $newId = DB::table('siteproj')->insertGetId($filtered, 'project_id');

            return response()->json(['ok' => true, 'project_id' => $newId]);
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'project_id') && str_contains($msg, 'default')) {
                $maxId = DB::table('siteproj')->max('project_id');
                $nextId = is_numeric($maxId) ? ((int) $maxId + 1) : 1;
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
        if (! Schema::hasTable('siteproj')) {
            return response()->json(['message' => 'Project sites table missing'], 422);
        }
        $project = DB::table('siteproj')->where('project_id', (int) $project_id)->first();
        if (! $project) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $validated = $request->validate([
            'project_name' => ['nullable', 'string', 'max:255'],
            'land_area' => ['nullable', 'numeric'],
            'total_blocks' => ['nullable', 'integer', 'min:0'],
            'total_lots' => ['nullable', 'integer', 'min:0'],
            'barangay' => ['nullable', 'string', 'max:100'],
            'year_started' => ['nullable', 'digits:4'],
            'description' => ['nullable', 'string'],
            'proj_image' => ['nullable', 'file', 'image', 'max:5120'],
            'blocks_json' => ['nullable', 'string'],
        ]);
        $path = null;
        if ($request->hasFile('proj_image')) {
            // Delete old image if exists
            $oldImg = is_string($project->proj_image ?? null) ? $project->proj_image : '';
            if ($oldImg !== '') {
                FileStorageService::delete($oldImg);
            }
            
            // Use FileStorageService for dual storage
            $result = FileStorageService::store(
                $request->file('proj_image'),
                'projects',
                'proj_'
            );
            
            if ($result['success']) {
                $path = $result['path']; // e.g., 'projects/proj_xxx.jpg'
            }
        }
        $columns = Schema::getColumnListing('siteproj');
        $payload = [];
        foreach (['project_name', 'land_area', 'total_blocks', 'total_lots', 'barangay', 'year_started', 'description'] as $k) {
            if (array_key_exists($k, $validated)) {
                $payload[$k] = $validated[$k];
            }
        }
        if ($path !== null) {
            $payload['proj_image'] = $path;
        }
        if (array_key_exists('blocks_json', $validated)) {
            $payload['blocks_json'] = $validated['blocks_json'];
        }
        $filtered = array_intersect_key($payload, array_flip($columns));
        if (empty($filtered)) {
            return response()->json(['ok' => true]);
        }
        DB::table('siteproj')->where('project_id', (int) $project_id)->update($filtered);

        return response()->json(['ok' => true]);
    }

    public function adminProjectSitesDelete(Request $request, $project_id)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (! Schema::hasTable('siteproj')) {
            return response()->json(['message' => 'Project sites table missing'], 422);
        }
        $project = DB::table('siteproj')->where('project_id', (int) $project_id)->first();
        if (! $project) {
            return response()->json(['message' => 'Not found'], 404);
        }
        try {
            $img = is_string($project->proj_image ?? null) ? $project->proj_image : '';
            if ($img !== '') {
                // Use FileStorageService to delete from both locations
                FileStorageService::delete($img);
            }
        } catch (\Throwable $e) {
        }
        try {
            DB::table('siteproj')->where('project_id', (int) $project_id)->delete();

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
        if (! Schema::hasTable('siteproj')) {
            return response()->json(['message' => 'Project sites table missing'], 422);
        }
        $project = DB::table('siteproj')->where('project_id', (int) $project_id)->first();
        if (! $project) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $raw = trim((string) $request->input('geojson', ''));
        if ($raw === '') {
            return response()->json(['message' => 'GeoJSON required'], 422);
        }
        try {
            $parsed = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Invalid GeoJSON'], 422);
        }
        $columns = Schema::getColumnListing('siteproj');
        if (! in_array('geojson', $columns)) {
            try {
                Schema::table('siteproj', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->longText('geojson')->nullable();
                });
                $columns = Schema::getColumnListing('siteproj');
            } catch (\Throwable $e) {
                return response()->json(['message' => 'Column geojson missing in siteproj'], 422);
            }
            if (! in_array('geojson', $columns)) {
                return response()->json(['message' => 'Column geojson missing in siteproj'], 422);
            }
        }
        DB::table('siteproj')->where('project_id', (int) $project_id)->update(['geojson' => json_encode($parsed)]);

        return response()->json(['ok' => true]);
    }

    public function adminAssignmentsPending(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string) $request->get('search', ''));
        if (! Schema::hasTable('assignments')) {
            $base = DB::table('survey as s')
                ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->where('s.is_submitted', 2);
        } else {
            $base = DB::table('survey as s')
                ->leftJoin('assignments as a', 'a.survey_id', '=', 's.survey_id')
                ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->where('s.is_submitted', 2)
                ->whereNull('a.assignment_id');
        }
        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('d.last_name', 'like', "%$search%")
                    ->orWhere('d.barangay', 'like', "%$search%");
            });
        }
        $rows = $base->select('s.survey_id', 's.date_interviewed', 'd.barangay', 'd.last_name', 'c.classification', 'c.subclass_displaced', 'c.subclass_doubleup', 'c.subclass_homeless')
            ->orderBy('s.survey_id', 'desc')
            ->get()
            ->map(function ($row) {
                $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
                $displacedLabel = [
                    1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
                    6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
                ];
                $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
                $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;
                $row->subclass_displaced = $displacedLabel[$row->subclass_displaced] ?? ($row->subclass_displaced ?? '');
                $row->subclass_doubleup = $doubleupLabel[$row->subclass_doubleup] ?? ($row->subclass_doubleup ?? '');
                $row->subclass_homeless = $homelessLabel[$row->subclass_homeless] ?? ($row->subclass_homeless ?? '');

                return $row;
            });

        return response()->json(['data' => $rows]);
    }

    public function adminAssignmentsList(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string) $request->get('search', ''));
        if (! Schema::hasTable('assignments')) {
            return response()->json(['data' => []]);
        }
        $base = DB::table('assignments as a')
            ->join('survey as s', 's.survey_id', '=', 'a.survey_id')
            ->join('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->join('siteproj as p', 'p.project_id', '=', 'a.project_id')
            ->where('s.is_submitted', 3); // Only show fully assigned beneficiaries
        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('d.last_name', 'like', "%$search%")
                    ->orWhere('p.project_name', 'like', "%$search%")
                    ->orWhere('d.barangay', 'like', "%$search%")
                    ->orWhere('a.block_no', 'like', "%$search%")
                    ->orWhere('a.lot_no', 'like', "%$search%");
            });
        }
        $rows = $base->select('a.assignment_id', 'a.block_no', 'a.lot_no', 'a.date_assigned', 'p.project_id', 'p.project_name', 's.survey_id', 'd.last_name', 'd.barangay', 'c.classification')
            ->orderBy('a.assignment_id', 'desc')
            ->get()
            ->map(function ($row) {
                $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
                $row->classification = $classLabel[$row->classification] ?? $row->classification;

                return $row;
            });

        return response()->json(['data' => $rows]);
    }

    public function adminAssignmentsCreate(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (! Schema::hasTable('assignments')) {
            return response()->json(['message' => 'Assignments table missing'], 422);
        }
        $validated = $request->validate([
            'survey_id' => ['required', 'integer'],
            'project_id' => ['required', 'integer'],
            'block_no' => ['required'],
            'lot_no' => ['required'],
        ]);
        $exists = DB::table('assignments')->where('survey_id', $validated['survey_id'])->first();
        if ($exists) {
            return response()->json(['message' => 'Already assigned'], 422);
        }
        $project = DB::table('siteproj')->where('project_id', (int) $validated['project_id'])->first();
        if (! $project) {
            return response()->json(['message' => 'Project not found'], 404);
        }
        $blockNo = is_numeric($validated['block_no']) ? (int) $validated['block_no'] : null;
        $lotNo = is_numeric($validated['lot_no']) ? (int) $validated['lot_no'] : null;
        if (! $blockNo || ! $lotNo) {
            return response()->json(['message' => 'Invalid block/lot'], 422);
        }
        $maxLotsByBlock = $this->computeMaxLotsByBlock($project);
        $validBlocks = array_keys($maxLotsByBlock);
        if (! in_array($blockNo, $validBlocks)) {
            return response()->json(['message' => 'Block not found in project'], 422);
        }
        $maxLots = (int) ($maxLotsByBlock[$blockNo] ?? 0);
        if ($maxLots <= 0) {
            return response()->json(['message' => 'No lots configured for this block'], 422);
        }
        if ($lotNo < 1 || $lotNo > $maxLots) {
            return response()->json(['message' => 'Lot number out of range for block'], 422);
        }
        $taken = DB::table('assignments')->where('project_id', (int) $validated['project_id'])->where('block_no', (string) $blockNo)->where('lot_no', (string) $lotNo)->first();
        if ($taken) {
            return response()->json(['message' => 'Lot already occupied'], 422);
        }
        DB::table('assignments')->insert([
            'survey_id' => $validated['survey_id'],
            'project_id' => $validated['project_id'],
            'block_no' => (string) $blockNo,
            'lot_no' => (string) $lotNo,
            'date_assigned' => now(),
        ]);

        // Update survey status to Assigned (is_submitted = 3)
        DB::table('survey')->where('survey_id', $validated['survey_id'])->update(['is_submitted' => 3]);

        return response()->json(['ok' => true]);
    }

    private function computeMaxLotsByBlock($project)
    {
        $columns = Schema::getColumnListing('siteproj');
        $totalBlocks = (int) ($project->total_blocks ?? 0);
        $totalLots = (int) ($project->total_lots ?? 0);
        $result = [];
        if (in_array('blocks_json', $columns) && isset($project->blocks_json) && is_string($project->blocks_json) && $project->blocks_json !== '') {
            try {
                $parsed = json_decode($project->blocks_json, true);
                if (is_array($parsed)) {
                    foreach ($parsed as $b => $max) {
                        $bn = (int) $b;
                        $result[$bn] = (int) $max;
                    }
                }
            } catch (\Throwable $e) {
            }
        }
        if (! empty($result)) {
            return $result;
        }
        if ($totalBlocks <= 0 || $totalLots <= 0) {
            return [];
        }
        $base = intdiv($totalLots, $totalBlocks);
        $rem = $totalLots % $totalBlocks;
        for ($i = 1; $i <= $totalBlocks; $i++) {
            $result[$i] = $base + ($i <= $rem ? 1 : 0);
        }

        return $result;
    }

    private function incomeBandVariants()
    {
        return [
            '0_2999' => ['0 - 2,999 PHP'],
            '3000_5999' => ['3,000 - 5,999 PHP'],
            '6000_8999' => ['6,000 - 8,999 PHP'],
            '9000_12999' => ['9,000 - 12,999 PHP', '9,000 - 12,999_PHP'],
            '13000_plus' => ['13,000 and above'],
        ];
    }

    private function incomeBandKeyFromValue($value)
    {
        $raw = trim((string) $value);
        if ($raw === '') {
            return null;
        }

        $variants = $this->incomeBandVariants();
        foreach ($variants as $key => $labels) {
            foreach ($labels as $label) {
                if (strcasecmp($raw, $label) === 0) {
                    return $key;
                }
            }
        }

        if (is_numeric($raw)) {
            $n = (float) $raw;
            if ($n <= 2999) {
                return '0_2999';
            }
            if ($n <= 5999) {
                return '3000_5999';
            }
            if ($n <= 8999) {
                return '6000_8999';
            }
            if ($n <= 12999) {
                return '9000_12999';
            }

            return '13000_plus';
        }

        preg_match_all('/\d[\d,]*/', $raw, $m);
        $nums = array_map(function ($x) {
            return (int) str_replace(',', '', $x);
        }, $m[0] ?? []);
        $nums = array_values(array_filter($nums, function ($n) {
            return $n > 0;
        }));
        if (count($nums) >= 2) {
            $min = (int) min($nums[0], $nums[1]);
            $max = (int) max($nums[0], $nums[1]);
            $mid = ($min + $max) / 2;
            if ($mid <= 2999) {
                return '0_2999';
            }
            if ($mid <= 5999) {
                return '3000_5999';
            }
            if ($mid <= 8999) {
                return '6000_8999';
            }
            if ($mid <= 12999) {
                return '9000_12999';
            }

            return '13000_plus';
        }
        if (count($nums) === 1) {
            $n = (int) $nums[0];
            if ($n <= 2999) {
                return '0_2999';
            }
            if ($n <= 5999) {
                return '3000_5999';
            }
            if ($n <= 8999) {
                return '6000_8999';
            }
            if ($n <= 12999) {
                return '9000_12999';
            }

            return '13000_plus';
        }

        return null;
    }

    private function applyIncomeBandFilter($query, $incomeBand)
    {
        $band = strtolower(trim((string) $incomeBand));
        if ($band === '') {
            return;
        }
        $variants = $this->incomeBandVariants();
        if (! array_key_exists($band, $variants)) {
            return;
        }
        $labels = $variants[$band];

        $range = null;
        if ($band === '0_2999') {
            $range = [0, 2999];
        } elseif ($band === '3000_5999') {
            $range = [3000, 5999];
        } elseif ($band === '6000_8999') {
            $range = [6000, 8999];
        } elseif ($band === '9000_12999') {
            $range = [9000, 12999];
        } elseif ($band === '13000_plus') {
            $range = [13000, null];
        }

        $query->where(function ($q) use ($labels, $range) {
            if (! empty($labels)) {
                $q->whereIn('e.combine_monthly_income', $labels);
            }
            if ($range) {
                $min = (int) $range[0];
                $max = $range[1] !== null ? (int) $range[1] : null;
                $numericCheck = "e.combine_monthly_income REGEXP '^[0-9]+(\\.[0-9]+)?$'";
                if ($max !== null) {
                    $q->orWhereRaw("$numericCheck AND (e.combine_monthly_income+0) >= $min AND (e.combine_monthly_income+0) <= $max");
                } else {
                    $q->orWhereRaw("$numericCheck AND (e.combine_monthly_income+0) >= $min");
                }
            }
        });
    }

    public function adminProjectBlocks(Request $request, $project_id)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $project = DB::table('siteproj')->where('project_id', (int) $project_id)->first();
        if (! $project) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $maxByBlock = $this->computeMaxLotsByBlock($project);
        $occupied = DB::table('assignments')
            ->where('project_id', (int) $project_id)
            ->select('block_no', DB::raw('COUNT(*) as cnt'))
            ->groupBy('block_no')
            ->get()
            ->reduce(function ($acc, $row) {
                $acc[(int) $row->block_no] = (int) $row->cnt;

                return $acc;
            }, []);
        $blocks = [];
        foreach ($maxByBlock as $bn => $max) {
            $occ = (int) ($occupied[$bn] ?? 0);
            $blocks[] = ['block_no' => (int) $bn, 'max_lots' => (int) $max, 'occupied_lots' => $occ, 'available_lots' => max(0, (int) $max - $occ)];
        }

        return response()->json(['data' => $blocks]);
    }

    public function adminProjectBlockAvailableLots(Request $request, $project_id, $block_no)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $project = DB::table('siteproj')->where('project_id', (int) $project_id)->first();
        if (! $project) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $bn = (int) $block_no;
        $maxByBlock = $this->computeMaxLotsByBlock($project);
        $max = (int) ($maxByBlock[$bn] ?? 0);
        if ($max <= 0) {
            return response()->json(['data' => []]);
        }
        $used = DB::table('assignments')
            ->where('project_id', (int) $project_id)
            ->where('block_no', (string) $bn)
            ->pluck('lot_no')
            ->map(function ($v) {
                return (int) $v;
            })
            ->toArray();
        $avail = [];
        for ($i = 1; $i <= $max; $i++) {
            if (! in_array($i, $used)) {
                $avail[] = $i;
            }
        }

        return response()->json(['data' => $avail]);
    }

    public function adminApproveSurvey(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $survey_id = (int) $request->input('survey_id');
        if (! $survey_id) {
            return response()->json(['message' => 'Missing survey_id'], 400);
        }
        $exists = DB::table('survey')->where('survey_id', $survey_id)->first();
        if (! $exists) {
            return response()->json(['message' => 'Not found'], 404);
        }
        // Only approve surveys that are currently validated (is_submitted = 1)
        // Don't change surveys that are already approved (2) or assigned (3)
        $updated = DB::table('survey')
            ->where('survey_id', $survey_id)
            ->where('is_submitted', 1)
            ->update(['is_submitted' => 2]);

        return response()->json(['ok' => true, 'updated' => (bool) $updated]);
    }

    /**
     * Send a validated survey back for revalidation.
     * Sets is_submitted = 0 so it goes back to the validator's queue.
     */
    public function adminRevalidateSurvey(Request $request, int $surveyId)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        $exists = DB::table('survey')->where('survey_id', $surveyId)->first();
        if (! $exists) {
            return response()->json(['message' => 'Survey not found'], 404);
        }
        
        // Only revalidate surveys that are currently validated (is_submitted = 1)
        if ((int) $exists->is_submitted !== 1) {
            return response()->json(['message' => 'Only validated surveys can be sent for revalidation'], 400);
        }
        
        $updated = DB::table('survey')
            ->where('survey_id', $surveyId)
            ->where('is_submitted', 1)
            ->update(['is_submitted' => 0]);

        return response()->json([
            'success' => (bool) $updated,
            'message' => $updated ? 'Survey sent back for revalidation' : 'Failed to update survey status'
        ]);
    }

    /**
     * Disapprove a validated survey.
     * Sets is_submitted = 5 to mark it as disapproved.
     */
    public function adminDisapproveSurvey(Request $request, int $surveyId)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        $exists = DB::table('survey')->where('survey_id', $surveyId)->first();
        if (! $exists) {
            return response()->json(['message' => 'Survey not found'], 404);
        }
        
        // Only disapprove surveys that are currently validated (is_submitted = 1)
        if ((int) $exists->is_submitted !== 1) {
            return response()->json(['message' => 'Only validated surveys can be disapproved'], 400);
        }
        
        $updated = DB::table('survey')
            ->where('survey_id', $surveyId)
            ->where('is_submitted', 1)
            ->update(['is_submitted' => 5]);

        return response()->json([
            'success' => (bool) $updated,
            'message' => $updated ? 'Survey has been disapproved' : 'Failed to update survey status'
        ]);
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
        $sample = Schema::hasTable('validator') ? DB::table('validator')->select('validator_id', 'username', 'name', 'status')->limit(5)->get() : [];

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
        $barangay = trim((string) $request->get('barangay', ''));
        $classParam = strtolower(trim((string) $request->get('classification', '')));
        $incomeBand = strtolower(trim((string) $request->get('income_band', '')));
        $water = strtolower(trim((string) $request->get('water', '')));
        $electricity = strtolower(trim((string) $request->get('electricity', '')));

        $cacheKey = 'admin_indicators_'.md5(json_encode([$barangay, $classParam, $incomeBand, $water, $electricity]));
        $data = Cache::remember($cacheKey, 300, function () use ($barangay, $classParam, $incomeBand, $water, $electricity) {
            $classMap = [
                'displaced' => 1,
                'double-up' => 2,
                'homeless' => 3,
                'upgrading of land tenure' => 4,
            ];

            $baseFilter = DB::table('survey as s')
                ->leftJoin('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->leftJoin('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
                ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
                ->whereIn('s.is_submitted', [1, 2, 3]);
            if ($barangay !== '') {
                $baseFilter->where('d.barangay', $barangay);
            }
            if ($classParam !== '' && array_key_exists($classParam, $classMap)) {
                $baseFilter->where('c.classification', $classMap[$classParam]);
            }
            $this->applyIncomeBandFilter($baseFilter, $incomeBand);
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
            $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
            $classRows = DB::table('classification as c')
                ->join('survey as s', 's.survey_id', '=', 'c.survey_id')
                ->whereIn('c.survey_id', $surveyIds)
                ->select('c.classification', DB::raw('COUNT(*) AS count'))
                ->groupBy('c.classification')
                ->get();
            $classificationPct = [];
            $classificationCount = [];
            foreach ($classRows as $r) {
                $k = $classLabel[$r->classification] ?? ($r->classification ?: 'Unknown');
                $classificationPct[$k] = $baseTotal ? round(((int) $r->count / $baseTotal) * 100) : 0;
                $classificationCount[$k] = (int) $r->count;
            }
            $houseCount = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->count();
            $noLot = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.lot_ownership,'')) <> 'yes'")->count();
            $noHouse = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.house_ownership,'')) <> 'yes'")->count();
            $temporaryLiving = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.temporary_living_area,'')) = 'yes'")->count();
            $hasWater = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.source_of_water,'')) <> '' AND LOWER(IFNULL(h.source_of_water,'none')) <> 'none'")->count();
            $noWater = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.source_of_water,'')) = '' OR LOWER(IFNULL(h.source_of_water,'')) = 'none'")->count();
            $hasElectricity = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.source_of_electricity,'')) <> '' AND LOWER(IFNULL(h.source_of_electricity,'none')) <> 'none'")->count();
            $noElectricity = DB::table('household as h')->whereIn('h.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(h.source_of_electricity,'')) = '' OR LOWER(IFNULL(h.source_of_electricity,'')) = 'none'")->count();

            $incomeBands = [
                '0_2999' => 0,
                '3000_5999' => 0,
                '6000_8999' => 0,
                '9000_12999' => 0,
                '13000_plus' => 0,
                'unknown' => 0,
                'total' => 0,
            ];
            $incomeValues = DB::table('economic as e')->whereIn('e.survey_id', $surveyIds)->pluck('e.combine_monthly_income')->all();
            $incomeBands['total'] = count($incomeValues);
            foreach ($incomeValues as $v) {
                $k = $this->incomeBandKeyFromValue($v);
                if ($k === null) {
                    $incomeBands['unknown']++;

                    continue;
                }
                if (! array_key_exists($k, $incomeBands)) {
                    $incomeBands['unknown']++;

                    continue;
                }
                $incomeBands[$k]++;
            }

            $subclassBreakdown = [
                'displaced' => [],
                'doubleup' => [],
                'homeless' => [],
            ];
            $displacedLabel = [
                1 => 'Coastal Areas', 2 => 'Drought', 3 => 'Earthquake Affected', 4 => 'Flood Affected', 5 => 'Sea Level Rise',
                6 => 'Threat of Eviction', 7 => 'Eviction/Demolition Order', 8 => 'Human Induced Disaster', 9 => 'Infra Projects', 10 => 'Landslide Affected', 11 => 'Near Waterways',
            ];
            $doubleupLabel = [1 => 'Renter/Tenant', 2 => 'Rent-free/Sharer', 3 => 'Caretaker'];
            $homelessLabel = [1 => 'Public - living in tent', 2 => 'Private - living in tent'];
            $subRows = DB::table('classification as c')
                ->whereIn('c.survey_id', $surveyIds)
                ->select('c.classification', 'c.subclass_displaced', 'c.subclass_doubleup', 'c.subclass_homeless')
                ->get();
            foreach ($subRows as $r) {
                $className = $classLabel[$r->classification] ?? null;
                if ($className === 'Displaced') {
                    $v = $displacedLabel[$r->subclass_displaced] ?? ($r->subclass_displaced ?? '');
                    $k = trim((string) $v) !== '' ? (string) $v : 'Unknown';
                    $subclassBreakdown['displaced'][$k] = (int) ($subclassBreakdown['displaced'][$k] ?? 0) + 1;
                } elseif ($className === 'Double-up') {
                    $v = $doubleupLabel[$r->subclass_doubleup] ?? ($r->subclass_doubleup ?? '');
                    $k = trim((string) $v) !== '' ? (string) $v : 'Unknown';
                    $subclassBreakdown['doubleup'][$k] = (int) ($subclassBreakdown['doubleup'][$k] ?? 0) + 1;
                } elseif ($className === 'Homeless') {
                    $v = $homelessLabel[$r->subclass_homeless] ?? ($r->subclass_homeless ?? '');
                    $k = trim((string) $v) !== '' ? (string) $v : 'Unknown';
                    $subclassBreakdown['homeless'][$k] = (int) ($subclassBreakdown['homeless'][$k] ?? 0) + 1;
                }
            }
            foreach (['displaced', 'doubleup', 'homeless'] as $k) {
                arsort($subclassBreakdown[$k]);
            }

            $sizes = DB::table('demographic as d')
                ->leftJoin(DB::raw('(SELECT survey_id, COUNT(*) AS cnt FROM household_mem GROUP BY survey_id) hm'), function ($join) {
                    $join->on('hm.survey_id', '=', 'd.survey_id');
                })
                ->whereIn('d.survey_id', $surveyIds)
                ->select('d.barangay', DB::raw('AVG(IFNULL(hm.cnt,0)) AS avg_size'))
                ->groupBy('d.barangay')
                ->get()
                ->map(function ($r) {
                    $r->avg_size = round((float) $r->avg_size, 1);

                    return $r;
                })
                ->sortByDesc('avg_size')
                ->values()
                ->take(10);

            $eduRows = DB::table('demographic as d')
                ->whereIn('d.survey_id', $surveyIds)
                ->select('d.highest_education', DB::raw('COUNT(*) AS count'))
                ->groupBy('d.highest_education')
                ->get();
            $education = [];
            foreach ($eduRows as $r) {
                $key = $r->highest_education ?: 'Unknown';
                $education[$key] = (int) $r->count;
            }

            $skillsTotal = DB::table('training as t')->whereIn('t.survey_id', $surveyIds)->count();
            $skillsYes = DB::table('training as t')->whereIn('t.survey_id', $surveyIds)->whereRaw("LOWER(IFNULL(t.skills_for_living,'')) = 'yes'")->count();
            $skillsPct = $skillsTotal ? round(($skillsYes / $skillsTotal) * 100) : 0;
            $topSkills = DB::table('training as t')
                ->whereIn('t.survey_id', $surveyIds)
                ->whereNotNull('t.specific_skill')
                ->whereRaw("TRIM(IFNULL(t.specific_skill,'')) <> ''")
                ->select('t.specific_skill', DB::raw('COUNT(*) AS count'))
                ->groupBy('t.specific_skill')
                ->orderBy('count', 'desc')
                ->limit(5)
                ->get();
            $wantRows = DB::table('training as t')
                ->whereIn('t.survey_id', $surveyIds)
                ->whereNotNull('t.wanttolearn')
                ->whereRaw("TRIM(IFNULL(t.wanttolearn,'')) <> ''")
                ->select('t.wanttolearn', DB::raw('COUNT(*) AS count'))
                ->groupBy('t.wanttolearn')
                ->orderBy('count', 'desc')
                ->limit(5)
                ->get();

            return [
                'base_total' => $baseTotal,
                'vulnerability' => [
                    'classification_pct' => $classificationPct,
                    'classification_count' => $classificationCount,
                    'no_lot' => [
                        'pct' => $houseCount ? round(($noLot / $houseCount) * 100) : 0,
                        'count' => (int) $noLot,
                        'total' => (int) $houseCount,
                    ],
                    'no_house' => [
                        'pct' => $houseCount ? round(($noHouse / $houseCount) * 100) : 0,
                        'count' => (int) $noHouse,
                        'total' => (int) $houseCount,
                    ],
                    'temporary_living' => [
                        'pct' => $houseCount ? round(($temporaryLiving / $houseCount) * 100) : 0,
                        'count' => (int) $temporaryLiving,
                        'total' => (int) $houseCount,
                    ],
                ],
                'service' => [
                    'has_water' => [
                        'pct' => $houseCount ? round(($hasWater / $houseCount) * 100) : 0,
                        'count' => (int) $hasWater,
                        'total' => (int) $houseCount,
                    ],
                    'no_water' => [
                        'pct' => $houseCount ? round(($noWater / $houseCount) * 100) : 0,
                        'count' => (int) $noWater,
                        'total' => (int) $houseCount,
                    ],
                    'has_electricity' => [
                        'pct' => $houseCount ? round(($hasElectricity / $houseCount) * 100) : 0,
                        'count' => (int) $hasElectricity,
                        'total' => (int) $houseCount,
                    ],
                    'no_electricity' => [
                        'pct' => $houseCount ? round(($noElectricity / $houseCount) * 100) : 0,
                        'count' => (int) $noElectricity,
                        'total' => (int) $houseCount,
                    ],
                ],
                'economic' => [
                    'bands' => $incomeBands,
                    'avg_household_size_by_barangay' => $sizes,
                ],
                'education_skills' => [
                    'education_breakdown' => $education,
                    'skills_for_living' => [
                        'pct' => $skillsPct,
                        'yes_count' => (int) $skillsYes,
                        'total' => (int) $skillsTotal,
                    ],
                    'top_skills' => $topSkills,
                    'top_wanttolearn' => $wantRows,
                ],
                'subclass_breakdown' => $subclassBreakdown,
            ];
        });

        return response()->json($data);
    }

    public function adminTimeSeries(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string) $request->get('barangay', ''));
        $classParam = strtolower(trim((string) $request->get('classification', '')));
        $incomeBand = strtolower(trim((string) $request->get('income_band', '')));
        $water = strtolower(trim((string) $request->get('water', '')));
        $electricity = strtolower(trim((string) $request->get('electricity', '')));

        $cacheKey = 'admin_timeseries_'.md5(json_encode([$barangay, $classParam, $incomeBand, $water, $electricity]));
        $data = Cache::remember($cacheKey, 300, function () use ($barangay, $classParam, $incomeBand, $water, $electricity) {
            $classMap = [
                'displaced' => 1,
                'double-up' => 2,
                'homeless' => 3,
                'upgrading of land tenure' => 4,
            ];

            $baseFilter = DB::table('survey as s')
                ->leftJoin('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->leftJoin('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
                ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
                ->whereIn('s.is_submitted', [1, 2, 3]);
            if ($barangay !== '') {
                $baseFilter->where('d.barangay', $barangay);
            }
            if ($classParam !== '' && array_key_exists($classParam, $classMap)) {
                $baseFilter->where('c.classification', $classMap[$classParam]);
            }
            $this->applyIncomeBandFilter($baseFilter, $incomeBand);
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
            if ($baseTotal === 0) {
                return [
                    'base_total' => 0,
                    'surveys_per_month' => [],
                    'surveys_per_month_by_status' => [],
                    'followups_per_month' => [],
                    'classification_per_month' => [],
                    'avg_income_per_month' => [],
                ];
            }

            $surveysPerMonth = DB::table('survey as s')
                ->whereIn('s.survey_id', $surveyIds)
                ->whereNotNull('s.date_interviewed')
                ->selectRaw("DATE_FORMAT(s.date_interviewed, '%Y-%m') AS ym, COUNT(*) AS count")
                ->groupBy('ym')
                ->orderBy('ym', 'asc')
                ->get();

            // Surveys per month by status (for multi-line chart)
            // Status: 1=Validated, 2=Approved/Pending, 3=Assigned
            $surveysPerMonthByStatus = DB::table('survey as s')
                ->whereIn('s.survey_id', $surveyIds)
                ->whereNotNull('s.date_interviewed')
                ->whereIn('s.is_submitted', [1, 2, 3])
                ->selectRaw("DATE_FORMAT(s.date_interviewed, '%Y-%m') AS ym, s.is_submitted AS status, COUNT(*) AS count")
                ->groupBy('ym', 's.is_submitted')
                ->orderBy('ym', 'asc')
                ->get();

            $followupsPerMonth = DB::table('survey as s')
                ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->whereIn('s.survey_id', $surveyIds)
                ->whereNotNull('s.date_interviewed')
                ->whereRaw('IFNULL(c.previous_client,0) = 1')
                ->selectRaw("DATE_FORMAT(s.date_interviewed, '%Y-%m') AS ym, COUNT(*) AS count")
                ->groupBy('ym')
                ->orderBy('ym', 'asc')
                ->get();

            $classificationPerMonth = DB::table('survey as s')
                ->join('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->whereIn('s.survey_id', $surveyIds)
                ->whereNotNull('s.date_interviewed')
                ->whereNotNull('c.classification')
                ->selectRaw("DATE_FORMAT(s.date_interviewed, '%Y-%m') AS ym, c.classification AS classification, COUNT(*) AS count")
                ->groupBy('ym', 'c.classification')
                ->orderBy('ym', 'asc')
                ->get();

            $avgIncomePerMonth = DB::table('survey as s')
                ->join('economic as e', 'e.survey_id', '=', 's.survey_id')
                ->whereIn('s.survey_id', $surveyIds)
                ->whereNotNull('s.date_interviewed')
                ->selectRaw("DATE_FORMAT(s.date_interviewed, '%Y-%m') AS ym, AVG(CASE WHEN e.combine_monthly_income REGEXP '^[0-9]+(\\.[0-9]+)?$' THEN NULLIF((e.combine_monthly_income+0),0) ELSE NULL END) AS avg_income")
                ->groupBy('ym')
                ->orderBy('ym', 'asc')
                ->get()
                ->map(function ($r) {
                    $r->avg_income = is_numeric($r->avg_income ?? null) ? round((float) $r->avg_income, 2) : null;

                    return $r;
                });

            return [
                'base_total' => $baseTotal,
                'surveys_per_month' => $surveysPerMonth,
                'surveys_per_month_by_status' => $surveysPerMonthByStatus,
                'followups_per_month' => $followupsPerMonth,
                'classification_per_month' => $classificationPerMonth,
                'avg_income_per_month' => $avgIncomePerMonth,
            ];
        });

        return response()->json($data);
    }

    public function adminDataQuality(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string) $request->get('barangay', ''));
        $classParam = strtolower(trim((string) $request->get('classification', '')));
        $incomeBand = strtolower(trim((string) $request->get('income_band', '')));
        $water = strtolower(trim((string) $request->get('water', '')));
        $electricity = strtolower(trim((string) $request->get('electricity', '')));

        $classMap = [
            'displaced' => 1,
            'double-up' => 2,
            'homeless' => 3,
            'upgrading of land tenure' => 4,
        ];

        $baseFilter = DB::table('survey as s')
            ->leftJoin('demographic as d', 'd.survey_id', '=', 's.survey_id')
            ->leftJoin('classification as c', 'c.survey_id', '=', 's.survey_id')
            ->leftJoin('economic as e', 'e.survey_id', '=', 's.survey_id')
            ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
            ->whereIn('s.is_submitted', [1, 2, 3]);
        if ($barangay !== '') {
            $baseFilter->where('d.barangay', $barangay);
        }
        if ($classParam !== '' && array_key_exists($classParam, $classMap)) {
            $baseFilter->where('c.classification', $classMap[$classParam]);
        }
        $this->applyIncomeBandFilter($baseFilter, $incomeBand);
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
        if ($baseTotal === 0) {
            return response()->json([
                'base_total' => 0,
                'missing' => [],
                'counts' => [],
            ]);
        }

        $missingDate = DB::table('survey as s')->whereIn('s.survey_id', $surveyIds)->whereNull('s.date_interviewed')->count();
        $missingBarangay = DB::table('demographic as d')
            ->whereIn('d.survey_id', $surveyIds)
            ->whereRaw("TRIM(IFNULL(d.barangay,'')) = ''")
            ->count();
        $missingClassification = DB::table('classification as c')
            ->whereIn('c.survey_id', $surveyIds)
            ->whereNull('c.classification')
            ->count();
        $missingIncome = DB::table('economic as e')
            ->whereIn('e.survey_id', $surveyIds)
            ->whereRaw("TRIM(IFNULL(e.combine_monthly_income,'')) = ''")
            ->count();
        $missingWater = DB::table('household as h')
            ->whereIn('h.survey_id', $surveyIds)
            ->whereRaw("LOWER(TRIM(IFNULL(h.source_of_water,''))) = '' OR LOWER(TRIM(IFNULL(h.source_of_water,''))) = 'none'")
            ->count();
        $missingElectricity = DB::table('household as h')
            ->whereIn('h.survey_id', $surveyIds)
            ->whereRaw("LOWER(TRIM(IFNULL(h.source_of_electricity,''))) = '' OR LOWER(TRIM(IFNULL(h.source_of_electricity,''))) = 'none'")
            ->count();

        $missingCoordinates = DB::table('training as t')
            ->whereIn('t.survey_id', $surveyIds)
            ->where(function ($q) {
                $q->whereRaw("TRIM(IFNULL(t.latitude,'')) = ''")
                    ->orWhereRaw("TRIM(IFNULL(t.longitude,'')) = ''");
            })
            ->count();

        $pct = function ($n) use ($baseTotal) {
            return $baseTotal ? round(($n / $baseTotal) * 100) : 0;
        };

        return response()->json([
            'base_total' => $baseTotal,
            'missing' => [
                'date_interviewed_pct' => $pct($missingDate),
                'barangay_pct' => $pct($missingBarangay),
                'classification_pct' => $pct($missingClassification),
                'income_pct' => $pct($missingIncome),
                'water_pct' => $pct($missingWater),
                'electricity_pct' => $pct($missingElectricity),
                'coordinates_pct' => $pct($missingCoordinates),
            ],
            'counts' => [
                'missing_date_interviewed' => $missingDate,
                'missing_barangay' => $missingBarangay,
                'missing_classification' => $missingClassification,
                'missing_income' => $missingIncome,
                'missing_water' => $missingWater,
                'missing_electricity' => $missingElectricity,
                'missing_coordinates' => $missingCoordinates,
            ],
        ]);
    }

    public function adminCrosstabIncomeClassification(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string) $request->get('barangay', ''));
        $classParam = strtolower(trim((string) $request->get('classification', '')));
        $water = strtolower(trim((string) $request->get('water', '')));
        $electricity = strtolower(trim((string) $request->get('electricity', '')));
        $classMap = ['displaced' => 1, 'double-up' => 2, 'homeless' => 3, 'upgrading of land tenure' => 4];
        $cacheKey = 'admin_crosstab_income_classification_'.md5(json_encode([$barangay, $classParam, $water, $electricity]));
        $data = Cache::remember($cacheKey, 300, function () use ($barangay, $classParam, $water, $electricity, $classMap) {
            $baseFilter = DB::table('survey as s')
                ->leftJoin('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->leftJoin('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->leftJoin('household as h', 'h.survey_id', '=', 's.survey_id')
                ->whereIn('s.is_submitted', [1, 2, 3]);
            if ($barangay !== '') {
                $baseFilter->where('d.barangay', $barangay);
            }
            if ($classParam !== '' && array_key_exists($classParam, $classMap)) {
                $baseFilter->where('c.classification', $classMap[$classParam]);
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

            $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
            $counts = [];
            $bandKeys = ['0_2999', '3000_5999', '6000_8999', '9000_12999', '13000_plus'];
            $rows = DB::table('classification as c')
                ->leftJoin('economic as e', 'e.survey_id', '=', 'c.survey_id')
                ->whereIn('c.survey_id', $surveyIds)
                ->select('c.classification', 'e.combine_monthly_income')
                ->get();
            foreach ($rows as $r) {
                $className = $classLabel[$r->classification] ?? ($r->classification ?: 'Unknown');
                if (! array_key_exists($className, $counts)) {
                    $counts[$className] = array_reduce($bandKeys, function ($acc, $k) {
                        $acc[$k] = 0;

                        return $acc;
                    }, ['classification' => $className, 'total' => 0]);
                }
                $bandKey = $this->incomeBandKeyFromValue($r->combine_monthly_income ?? null);
                if ($bandKey !== null && in_array($bandKey, $bandKeys, true)) {
                    $counts[$className][$bandKey] = (int) $counts[$className][$bandKey] + 1;
                }
                $counts[$className]['total'] = (int) $counts[$className]['total'] + 1;
            }
            $out = array_values($counts);
            usort($out, function ($a, $b) {
                return strcmp((string) ($a['classification'] ?? ''), (string) ($b['classification'] ?? ''));
            });

            return $out;
        });

        return response()->json(['data' => $data]);
    }

    public function adminCrosstabClassificationBarangay(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $barangay = trim((string) $request->get('barangay', ''));
        $classParam = strtolower(trim((string) $request->get('classification', '')));
        $classMap = ['displaced' => 1, 'double-up' => 2, 'homeless' => 3, 'upgrading of land tenure' => 4];
        $cacheKey = 'admin_crosstab_classification_barangay_'.md5(json_encode([$barangay, $classParam]));
        $rows = Cache::remember($cacheKey, 300, function () use ($barangay, $classParam, $classMap) {
            $baseFilter = DB::table('survey as s')
                ->leftJoin('demographic as d', 'd.survey_id', '=', 's.survey_id')
                ->leftJoin('classification as c', 'c.survey_id', '=', 's.survey_id')
                ->whereIn('s.is_submitted', [1, 2, 3]);
            if ($barangay !== '') {
                $baseFilter->where('d.barangay', $barangay);
            }
            if ($classParam !== '' && array_key_exists($classParam, $classMap)) {
                $baseFilter->where('c.classification', $classMap[$classParam]);
            }
            $surveyIds = $baseFilter->select('s.survey_id')->pluck('s.survey_id')->all();

            $classLabel = [1 => 'Displaced', 2 => 'Double-up', 3 => 'Homeless', 4 => 'Upgrading of Land Tenure'];
            return DB::table('classification as c')
                ->join('demographic as d', 'd.survey_id', '=', 'c.survey_id')
                ->whereIn('c.survey_id', $surveyIds)
                ->select('d.barangay', 'c.classification', DB::raw('COUNT(*) AS count'))
                ->groupBy('d.barangay', 'c.classification')
                ->get()
                ->map(function ($r) use ($classLabel) {
                    $r->classification = $classLabel[$r->classification] ?? $r->classification;

                    return $r;
                });
        });

        return response()->json(['data' => $rows]);
    }

    public function adminNotifications(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $limit = (int) ($request->get('limit') ?? 10);
        $rows = DB::table('notifications')
            ->whereIn('type', ['validator_password_reset', 'validator_email_changed'])
            ->orderBy('id', 'desc')
            ->limit(max(1, $limit))
            ->get()
            ->map(function ($r) {
                $p = is_string($r->payload ?? null) ? json_decode($r->payload, true) : [];

                return [
                    'id' => $r->id,
                    'type' => $r->type,
                    'title' => $r->title,
                    'name' => $p['name'] ?? null,
                    'email' => $p['email'] ?? null,
                    'created_at' => $r->created_at,
                    'read' => ! is_null($r->read_at),
                ];
            });

        return response()->json(['data' => $rows]);
    }

    public function adminNotificationRead(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $id = (int) $request->input('id');
        if (! $id) {
            return response()->json(['message' => 'Missing id'], 400);
        }
        DB::table('notifications')->where('id', $id)->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function adminValidators(Request $request)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $search = trim((string) $request->get('search', ''));
        $base = DB::table('validator');
        if ($search !== '') {
            $base->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('username', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            });
        }
        $rows = $base->select('validator_id', 'name', 'username', 'email', 'status')->orderBy('name', 'asc')->get();

        return response()->json(['data' => $rows]);
    }

    public function adminValidatorUpdateStatus(Request $request, $validator_id)
    {
        if (session('role') !== 'admin') {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $status = $request->input('status');
        if (! in_array($status, ['approved', 'deactivated', 'pending'])) {
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
            'username' => ['required', 'string'],
            'name' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
            'signature' => ['required', 'file', 'image', 'max:2048'],
        ]);
        $username = $request->input('username');
        $exists = DB::table('validator')->where('username', $username)->exists();
        if ($exists) {
            return response()->json(['errors' => ['username' => ['Username already taken']]], 422);
        }
        $signaturePath = null;
        if ($request->hasFile('signature')) {
            $file = $request->file('signature');
            $stored = $file->store('signatures', 'public');
            $relative = ltrim($stored, '/');
            $sourcePath = Storage::disk('public')->path($relative);
            $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
            $publicDir = $docRoot ? ($docRoot.'/storage/signatures') : (rtrim(dirname(base_path(), 2), '/\\').'/public_html/storage/signatures');
            if (! is_dir($publicDir)) {
                @mkdir($publicDir, 0775, true);
            }
            $destinationPath = $publicDir.'/'.basename($relative);
            @copy($sourcePath, $destinationPath);
            $signaturePath = 'storage/signatures/'.basename($relative);
        }
        DB::table('validator')->insert([
            'username' => $username,
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => password_hash($request->input('password'), PASSWORD_BCRYPT),
            'status' => 'approved',
            'signature_data' => $signaturePath,
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
                'name', 'email', 'username', 'password', 'status',
                DB::raw('created_at AS createdAt'),
                DB::raw('updated_at AS updatedAt')
            )
            ->where('status', 'approved')
            ->get()
            ->map(function ($row) {
                return $row;
            })->all();

        return response()->json([
            'success' => true,
            'validators' => $rows,
            'count' => count($rows),
            'message' => 'Validators synced successfully for offline use',
        ]);
    }

    // Mobile: validate validator credentials (online login)
    public function mobileValidateValidator(Request $request)
    {
        $payload = $request->json()->all();
        $username = strtolower(trim((string) ($payload['username'] ?? $request->input('username'))));
        $password = (string) ($payload['password'] ?? $request->input('password'));

        $row = DB::table('validator')
            ->select(
                DB::raw('CAST(validator_id AS UNSIGNED) AS id'),
                'name', 'email', 'username', 'password', 'status',
                DB::raw('created_at AS createdAt'),
                DB::raw('updated_at AS updatedAt')
            )
            ->whereRaw('LOWER(username) = ?', [$username])
            ->where('status', 'approved')
            ->first();

        if (! $row) {
            return response()->json(['success' => false, 'message' => 'Validator not found or not approved'], 404);
        }
        $stored = is_string($row->password ?? null) ? $row->password : '';
        $valid = ($stored !== '' && password_verify($password, $stored)) || $password === $stored || (md5($password) === $stored);
        if (! $valid) {
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

        $norm = function ($v) {
            return is_string($v) ? trim($v) : $v;
        };
        $val = function ($key) use ($data, $norm) {
            return $norm($data[$key] ?? null);
        };

        $saveSignature = function ($input) {
            if (! $input) {
                return null;
            }
            $s = is_string($input) ? trim($input) : '';
            if ($s === '') {
                return null;
            }
            if (strpos($s, 'signatures/') === 0 || strpos($s, 'storage/signatures/') === 0) {
                return $s;
            }
            $base64 = $s;
            if (strpos($s, 'base64,') !== false) {
                $parts = explode(',', $s, 2);
                $base64 = $parts[1] ?? '';
            }
            if ($base64 === '') {
                return null;
            }
            $dataBin = base64_decode($base64);
            if ($dataBin === false) {
                return null;
            }
            $path = 'signatures/'.uniqid().'.png';
            Storage::disk('public')->put($path, $dataBin);
            $relative = ltrim($path, '/');
            $sourcePath = Storage::disk('public')->path($relative);
            $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
            $publicDir = $docRoot ? ($docRoot.'/storage/signatures') : (rtrim(dirname(base_path(), 2), '/\\').'/public_html/storage/signatures');
            if (! is_dir($publicDir)) {
                @mkdir($publicDir, 0775, true);
            }
            $destinationPath = $publicDir.'/'.basename($relative);
            @copy($sourcePath, $destinationPath);

            return 'storage/signatures/'.basename($relative);
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
                $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
                if (! in_array($t, $allowed)) {
                    return response()->json(['message' => 'Invalid file type'], 422);
                }
                $house_photo_blob = $decoded;
                $house_photo_filename = $val('house_photo_filename') ?: $request->input('house_photo_filename');
                $house_photo_type = $t;
            }
        }
        if (! $house_photo_blob) {
            try {
                $file = $request->file('house_photo');
                if ($file && $file->isValid()) {
                    $realPath = $file->getRealPath();
                    if (! $realPath || ! is_readable($realPath)) {
                        \Log::warning('mobileSubmitSurvey: house_photo temp file missing or unreadable', [
                            'realPath' => $realPath,
                        ]);
                    } else {
                        if ($file->getSize() > 5 * 1024 * 1024) {
                            return response()->json(['message' => 'File too large'], 422);
                        }
                        $originalName = $file->getClientOriginalName();
                        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
                        if ($ext === '') {
                            $ext = 'jpg';
                        }
                        $allowedExt = ['jpg', 'jpeg', 'png', 'gif'];
                        if (! in_array($ext, $allowedExt, true)) {
                            return response()->json(['message' => 'Invalid file type'], 422);
                        }
                        $house_photo_blob = file_get_contents($realPath);
                        $house_photo_filename = $originalName;
                        if ($ext === 'png') {
                            $house_photo_type = 'image/png';
                        } elseif ($ext === 'gif') {
                            $house_photo_type = 'image/gif';
                        } else {
                            $house_photo_type = 'image/jpeg';
                        }
                    }
                }
            } catch (\Throwable $e) {
                \Log::error('mobileSubmitSurvey: exception processing house_photo upload', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($house_photo_blob) {
            $ext = 'jpg';
            if ($house_photo_type === 'image/png') {
                $ext = 'png';
            } elseif ($house_photo_type === 'image/gif') {
                $ext = 'gif';
            } elseif ($house_photo_type === 'image/jpg' || $house_photo_type === 'image/jpeg') {
                $ext = 'jpg';
            }
            if (! $house_photo_filename || strpos($house_photo_filename, '.') === false) {
                $house_photo_filename = 'survey_'.time().'_'.uniqid().'.'.$ext;
            }
            Storage::disk('public')->put('survey_photos/'.$house_photo_filename, $house_photo_blob);
            $house_photo_path = 'storage/survey_photos/'.$house_photo_filename;
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
                $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
                if (! in_array($t, $allowed)) {
                    return response()->json(['message' => 'Invalid file type'], 422);
                }
                $person_photo_blob = $decoded;
                $person_photo_filename = $val('person_photo_filename') ?: $request->input('person_photo_filename');
                $person_photo_type = $t;
            }
        }
        if (! $person_photo_blob) {
            try {
                $file = $request->file('person_photo');
                if ($file && $file->isValid()) {
                    $realPath = $file->getRealPath();
                    if (! $realPath || ! is_readable($realPath)) {
                        \Log::warning('mobileSubmitSurvey: person_photo temp file missing or unreadable', [
                            'realPath' => $realPath,
                        ]);
                    } else {
                        if ($file->getSize() > 5 * 1024 * 1024) {
                            return response()->json(['message' => 'File too large'], 422);
                        }
                        $originalName = $file->getClientOriginalName();
                        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
                        if ($ext === '') {
                            $ext = 'jpg';
                        }
                        $allowedExt = ['jpg', 'jpeg', 'png', 'gif'];
                        if (! in_array($ext, $allowedExt, true)) {
                            return response()->json(['message' => 'Invalid file type'], 422);
                        }
                        $person_photo_blob = file_get_contents($realPath);
                        $person_photo_filename = $originalName;
                        if ($ext === 'png') {
                            $person_photo_type = 'image/png';
                        } elseif ($ext === 'gif') {
                            $person_photo_type = 'image/gif';
                        } else {
                            $person_photo_type = 'image/jpeg';
                        }
                    }
                }
            } catch (\Throwable $e) {
                \Log::error('mobileSubmitSurvey: exception processing person_photo upload', [
                    'error' => $e->getMessage(),
                ]);
            }
        }
        if ($person_photo_blob) {
            $ext = 'jpg';
            if ($person_photo_type === 'image/png') {
                $ext = 'png';
            } elseif ($person_photo_type === 'image/gif') {
                $ext = 'gif';
            } elseif ($person_photo_type === 'image/jpg' || $person_photo_type === 'image/jpeg') {
                $ext = 'jpg';
            }
            if (! $person_photo_filename || strpos($person_photo_filename, '.') === false) {
                $person_photo_filename = 'survey_person_'.time().'_'.uniqid().'.'.$ext;
            }
            Storage::disk('public')->put('survey_photos/'.$person_photo_filename, $person_photo_blob);
            $person_photo_path = 'storage/survey_photos/'.$person_photo_filename;
        }

        // Prepare variables and handle 'Others' logic
        $classification = $val('classification');
        if (is_string($classification)) {
            $cNorm = trim($classification);
            if (strcasecmp($cNorm, 'Doubled-up') === 0) {
                $classification = 'Double-up';
            }
        }

        $subclass_displaced = $val('subclass_displaced') ?: $val('sub_class_displaced');
        if (is_string($subclass_displaced)) {
            $sdNorm = strtolower(trim($subclass_displaced));
            if ($sdNorm === 'infra-projects') {
                $subclass_displaced = 'Infra Projects';
            }
        }

        $subclass_doubleup = $val('subclass_doubleup') ?: $val('sub_class_double_up');
        $subclass_homeless = $val('subclass_homeless') ?: $val('sub_class_homeless');

        $housing_structure = $val('housing_structure');
        if ($housing_structure === 'Others') {
            $housing_structure = $val('other_housing_structure');
        }

        $type_of_toilet = $val('type_of_toilet');
        if ($type_of_toilet === 'Others') {
            $type_of_toilet = $val('other_type_of_toilet');
        }

        $source_of_water = $val('source_of_water');
        if ($source_of_water === 'Others') {
            $source_of_water = $val('other_source_of_water');
        }

        $source_of_electricity = $val('source_of_electricity');
        if ($source_of_electricity === 'Others') {
            $source_of_electricity = $val('other_source_of_electricity');
        }

        $main_income_source = $val('main_income_source');
        if (strtolower((string) $main_income_source) === 'others') {
            $main_income_source = $val('other_main_income_source');
        }

        $work_status = $val('work_status');
        if (strtolower((string) $work_status) === 'others') {
            $work_status = $val('other_work_status');
        }

        $skills_for_living = $val('skills_for_living');
        $specific_skill = '';
        if ($skills_for_living === 'Yes') {
            $specific_skill = $val('specific_skill');
            if (strtolower((string) $specific_skill) === 'others') {
                $specific_skill = $val('other_skill');
            }
            if ($specific_skill === null) {
                $specific_skill = '';
            }
        }

        $organization_member = $val('organization_member');
        $specific_organization = '';
        if ($organization_member === 'Yes') {
            $specific_organization = $val('specific_organization');
            if (strtolower((string) $specific_organization) === 'others') {
                $specific_organization = $val('other_organization');
            }
            if ($specific_organization === null) {
                $specific_organization = '';
            }
        }

        $marital_status = $val('marital_status');
        $allowSpouse = in_array($marital_status, ['Married', 'Live-in', 'Widow/Widower', 'Separated', 'Annulled']);
        $spouse_name = $allowSpouse ? $val('spouse_name') : null;
        $spouse_religion = $allowSpouse ? $val('spouse_religion') : null;
        $spouse_tribe = $allowSpouse ? $val('spouse_tribe') : null;
        $spouse_age = $allowSpouse ? $val('spouse_age') : null;
        $spouse_gender = $allowSpouse ? $val('spouse_gender') : null;

        $affiliationsRaw = $val('affiliations') ?: $val('affiliation');

        $result = DB::transaction(function () use ($data, $val, $classification, $subclass_displaced, $subclass_doubleup, $subclass_homeless, $housing_structure, $type_of_toilet, $source_of_water, $source_of_electricity, $main_income_source, $work_status, $skills_for_living, $specific_skill, $organization_member, $specific_organization, $house_photo_path, $person_photo_path, $marital_status, $spouse_name, $spouse_religion, $spouse_tribe, $spouse_age, $spouse_gender, $validator_signature, $respondent_signature, $affiliationsRaw) {
            $toInt = function ($v) {
                return is_numeric($v) ? (int) $v : null;
            };
            $yn = function ($v) {
                $s = is_string($v) ? strtolower(trim($v)) : $v;

                return ($s === 'yes' || $s === 1 || $s === '1') ? 1 : (($s === 'no' || $s === 0 || $s === '0') ? 0 : null);
            };
            $ynMayor = function ($v) {
                $s = is_string($v) ? strtolower(trim($v)) : $v;

                if ($s === 'yes' || $s === 1 || $s === '1') {
                    return 1;
                }
                if ($s === 'no' || $s === 2 || $s === '2' || $s === 0 || $s === '0') {
                    return 2;
                }

                return null;
            };
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
            $normalize = function ($v) {
                if (! is_string($v)) {
                    return null;
                }
                $t = trim($v);

                return $t === '' ? null : $t;
            };

            $classificationCode = $classMap[strtolower((string) $classification)] ?? null;
            $subDisplacedCode = $subclass_displaced ? ($displacedMap[strtolower((string) $subclass_displaced)] ?? null) : null;
            $subDoubleupCode = $subclass_doubleup ? ($doubleupMap[strtolower((string) $subclass_doubleup)] ?? null) : null;
            $subHomelessCode = $subclass_homeless ? ($homelessMap[strtolower((string) $subclass_homeless)] ?? null) : null;
            $prevClientCode = $yn($val('previous_client'));

            $spouseGenderStr = is_string($spouse_gender) ? $spouse_gender : null;

            $affiliationsStr = is_string($affiliationsRaw) ? trim($affiliationsRaw) : '';
            $affPrimary = null;
            if ($affiliationsStr !== '') {
                $parts = array_values(array_filter(array_map('trim', explode(',', $affiliationsStr)), function ($v) {
                    return $v !== '';
                }));
                if (! empty($parts)) {
                    $primary = $parts[0];
                    if (strcasecmp($primary, 'None') === 0 && count($parts) > 1) {
                        $primary = $parts[1];
                    }
                    $affPrimary = $normalize($primary);
                }
            }
            if ($affPrimary === null) {
                $affPrimary = $normalize($val('affiliation'));
            }

            $sid = DB::table('survey')->insertGetId([
                'validator_id' => (int) ($data['validator_id'] ?? 1),
                'interviewed_by' => $val('interviewed_by'),
                'date_interviewed' => $val('date_interviewed'),
                'is_submitted' => (int) ($data['is_submitted'] ?? 0),
                'validator_signature' => $validator_signature,
            ]);

            $barangayValue = (string) $val('barangay');
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
                'spouse_gender' => $spouseGenderStr,
                'affiliations' => $affiliationsStr,
                'endorsed_by_mayor' => $ynMayor($val('endorsed_by_mayor')),
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
            if (in_array('gender', $hmCols)) {
                $colSex = 'gender';
            } elseif (in_array('sex', $hmCols)) {
                $colSex = 'sex';
            }
            $colCode = in_array('code', $hmCols) ? 'code' : null;

            foreach ($members as $m) {
                $payload = [
                    'survey_id' => $survey_id,
                    'name' => $m['name'] ?? null,
                    'age' => isset($m['age']) ? (int) $m['age'] : null,
                    'relationship' => $m['relationship'] ?? null,
                    'occupation' => ($m['occupation'] ?? '') === '' ? 'N/A' : $m['occupation'],
                ];

                if ($colSex !== null) {
                    $payload[$colSex] = $m['gender'] ?? ($m['sex'] ?? null);
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
                if (in_array('gender', $hmCols)) {
                    $colSex = 'gender';
                } elseif (in_array('sex', $hmCols)) {
                    $colSex = 'sex';
                }
                $colCode = in_array('code', $hmCols) ? 'code' : null;

                $payload = [
                    'survey_id' => $survey_id,
                    'name' => $spouse_name,
                    'age' => isset($spouse_age) && is_numeric($spouse_age) ? (int) $spouse_age : null,
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

        // Calculate and save priority score
        try {
            $survey = Survey::find($survey_id);
            if ($survey) {
                $scoreService = new BeneficiaryScoreService();
                $scoreService->calculateAndSave($survey);
            }
        } catch (ScoreCalculationException $e) {
            // Log the error but don't fail the survey submission
            Log::error('Failed to calculate priority score for mobile survey', [
                'survey_id' => $survey_id,
                'error' => $e->getMessage(),
                'context' => $e->getContext()
            ]);
        }

        return response()->json(['success' => true, 'survey_id' => $survey_id, 'tag_number' => $tagNumber, 'message' => 'Survey submitted successfully']);
    }

    protected function getBarangayCode(string $barangay): string
    {
        $raw = trim((string) $barangay);
        $normalized = preg_replace('/\s+/', ' ', str_replace('_', ' ', $raw));
        $key = strtolower((string) $normalized);

        $map = [
            'aplya' => 'A',
            'aplaya' => 'A',
            'balabag' => 'B',
            'binaton' => 'C',
            'cogon' => 'D',
            'colorado' => 'E',
            'dawis' => 'F',
            'dulangan' => 'G',
            'goma' => 'H',
            'igpit' => 'I',
            'kapatagan' => 'J',
            'kiagot' => 'K',
            'lungag' => 'L',
            'mahayahay' => 'M',
            'mahatahay' => 'M',
            'matti' => 'N',
            'ruparan' => 'O',
            'san agustin' => 'P',
            'san jose' => 'Q',
            'san miguel' => 'R',
            'san roque' => 'S',
            'sinawilan' => 'T',
            'soong' => 'U',
            'tiguman' => 'V',
            'tres de mayo' => 'W',
            'zone 1' => 'X',
            'zone i' => 'X',
            'zone 2' => 'Y',
            'zone ii' => 'Y',
            'zone 3' => 'Z',
            'zone iii' => 'Z',
        ];

        return $map[$key] ?? 'Z';
    }

    protected function generateTagNumber(string $barangay): string
    {
        $code = $this->getBarangayCode($barangay);

        $maxTag = DB::table('demographic')
            ->where('tag_number', 'like', $code.'%')
            ->orderBy('tag_number', 'desc')
            ->lockForUpdate()
            ->value('tag_number');

        $nextSeq = 1;
        if ($maxTag) {
            $numericPart = substr($maxTag, 1);
            $parsed = (int) $numericPart;
            if ($parsed > 0) {
                $nextSeq = $parsed + 1;
            }
        }

        $seqStr = str_pad((string) $nextSeq, 3, '0', STR_PAD_LEFT);
        $tagNumber = $code.$seqStr;

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
