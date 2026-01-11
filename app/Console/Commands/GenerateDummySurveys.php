<?php

namespace App\Console\Commands;

use App\Models\Validator;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateDummySurveys extends Command
{
    protected $signature = 'surveys:generate-dummy';

    protected $description = 'Generate dummy survey records for testing and validation dashboards';

    public function handle(): int
    {
        $validatorUsernames = ['Kent Andrey', 'Cris John'];

        $validators = Validator::query()
            ->whereIn('username', $validatorUsernames)
            ->get()
            ->keyBy('username');

        if ($validators->count() < 2) {
            $this->error('Required validator accounts not found. Make sure "Kent Andrey" and "Cris John" exist.');

            return 1;
        }

        $barangays = [
            'Aplaya',
            'Balabag',
            'Binaton',
            'Cogon',
            'Colorado',
            'Dawis',
            'Dulangan',
            'Goma',
            'Igpit',
            'Kapatagan',
            'Kiagot',
            'Lungag',
            'Mahayahay',
            'Matti',
            'Ruparan',
            'San_Agustin',
            'San_Jose',
            'San_Miguel',
            'San_Roque',
            'Sinawilan',
            'Soong',
            'Tiguman',
            'Tres_De_Mayo',
            'Zone_1',
            'Zone_2',
            'Zone_3',
        ];

        $classifications = [
            ['code' => 1, 'label' => 'Displaced'],
            ['code' => 2, 'label' => 'Double-up'],
            ['code' => 3, 'label' => 'Homeless'],
            ['code' => 4, 'label' => 'Upgrading of Land Tenure'],
        ];

        $displacedMax = 11;
        $doubleUpMax = 3;
        $homelessMax = 2;

        $barangayCoords = [
            'Aplaya' => ['lat' => '6.744000', 'lon' => '125.365000'],
            'Balabag' => ['lat' => '6.764000', 'lon' => '125.340000'],
            'Binaton' => ['lat' => '6.770000', 'lon' => '125.330000'],
            'Cogon' => ['lat' => '6.753000', 'lon' => '125.350000'],
            'Colorado' => ['lat' => '6.760000', 'lon' => '125.360000'],
            'Dawis' => ['lat' => '6.745000', 'lon' => '125.370000'],
            'Dulangan' => ['lat' => '6.735000', 'lon' => '125.345000'],
            'Goma' => ['lat' => '6.730000', 'lon' => '125.335000'],
            'Igpit' => ['lat' => '6.755000', 'lon' => '125.365000'],
            'Kapatagan' => ['lat' => '6.720000', 'lon' => '125.320000'],
            'Kiagot' => ['lat' => '6.760000', 'lon' => '125.350000'],
            'Lungag' => ['lat' => '6.770000', 'lon' => '125.360000'],
            'Mahayahay' => ['lat' => '6.742000', 'lon' => '125.355000'],
            'Matti' => ['lat' => '6.748000', 'lon' => '125.348000'],
            'Ruparan' => ['lat' => '6.725000', 'lon' => '125.340000'],
            'San_Agustin' => ['lat' => '6.752000', 'lon' => '125.360000'],
            'San_Jose' => ['lat' => '6.754000', 'lon' => '125.345000'],
            'San_Miguel' => ['lat' => '6.747000', 'lon' => '125.352000'],
            'San_Roque' => ['lat' => '6.751000', 'lon' => '125.365000'],
            'Sinawilan' => ['lat' => '6.730000', 'lon' => '125.355000'],
            'Soong' => ['lat' => '6.735000', 'lon' => '125.365000'],
            'Tiguman' => ['lat' => '6.722000', 'lon' => '125.332000'],
            'Tres_De_Mayo' => ['lat' => '6.745000', 'lon' => '125.347000'],
            'Zone_1' => ['lat' => '6.749720', 'lon' => '125.357220'],
            'Zone_2' => ['lat' => '6.752000', 'lon' => '125.359000'],
            'Zone_3' => ['lat' => '6.747000', 'lon' => '125.355000'],
        ];

        $affiliationOptions = [
            'None',
            'SSS',
            'GSIS',
            'PhilHealth',
            'PagIbig',
            'PWD',
            'Senior_Citizen',
            'Solo_Parent',
            '4Ps',
        ];

        $maleFirstNames = [
            'Juan',
            'Jose',
            'Mark',
            'Christian',
            'Michael',
            'John Paul',
            'Carlo',
            'Jerome',
            'Joshua',
            'Raymond',
            'Paolo',
            'Rafael',
            'Jomar',
            'Emmanuel',
            'Allan',
        ];

        $femaleFirstNames = [
            'Maria',
            'Ana',
            'Angelica',
            'Christine',
            'Nicole',
            'Rose Ann',
            'Joanna',
            'Jasmine',
            'Clarissa',
            'May',
            'Shiela',
            'Diana',
            'Patricia',
            'Catherine',
            'Michelle',
        ];

        $lastNames = [
            'Dela Cruz',
            'Santos',
            'Reyes',
            'Garcia',
            'Mendoza',
            'Flores',
            'Gonzales',
            'Torres',
            'Ramos',
            'Aquino',
            'Domingo',
            'Castillo',
            'Navarro',
            'Villanueva',
            'Jimenez',
        ];

        $educationChoices = [
            'none',
            'Elementary_Level_(Incomplete)',
            'Elementary_Graduate',
            'High_School_Level_(Incomplete)',
            'High_School_Graduate',
            'Vocational/Technical_Education',
            'College_Level_(Incomplete)',
            'College_Graduate',
            'Postgraduate_Level',
            'ALS',
        ];

        $incomeChoices = [
            '0 - 2,999 PHP',
            '3,000 - 5,999 PHP',
            '6,000 - 8,999 PHP',
            '9,000 - 12,999_PHP',
            '13,000 and above',
        ];

        $civilStatusChoices = [
            'Single',
            'Married',
            'Live-in',
            'Widow/Widower',
            'Annulled',
            'Separated',
        ];

        $relationshipChoices = [
            'Household Head',
            'Spouse of Head',
            'Never-Married Child',
            'Other Relative',
            'Non-Relative',
        ];

        $occupationChoices = [
            'Student',
            'Laborer',
            'Tricycle Driver',
            'Vendor',
            'Government Employee',
            'Private Employee',
            'Farmer',
            'Fisherfolk',
            'Housekeeper',
        ];

        $housingStructureOptions = [
            'Full_Concrete',
            'Made_of_wood_and_metal_roof',
            'Made_of_Amakan_and_Nipa',
            'Combination_of_concrete_and_wood',
            'Made_of_Amakan_and_metal_roof',
        ];

        $toiletOptions = [
            'Water-sealed',
            'Pit',
            'None',
        ];

        $mainIncomeOptions = [
            'Public_Employee',
            'Private_Employee',
            'Self_Employed',
            'Casual',
        ];

        $workStatusOptions = [
            'Regular',
            'Contractual',
        ];

        $skillOptions = [
            'Handicrafts',
            'Wood_Works_and_Furnitures',
            'Food_Processing',
        ];

        $organizationOptions = [
            'HOA',
            'Youth_Organization',
            'Dayong',
            'Womens_Organization',
        ];

        $workLocationOptions = [
            'Within the Barangay',
            'Within the City/Municipality',
            'Within the Province',
            'Within the Country',
        ];

        $housePhotoPath = 'pics/Redirect Notice.jpg';
        $personPhotoPath = 'pics/passport.jpg';

        $totalCreated = 0;
        $now = Carbon::now()->toDateString();

        DB::transaction(function () use (
            $barangays,
            $classifications,
            $displacedMax,
            $doubleUpMax,
            $homelessMax,
            $barangayCoords,
            $validators,
            $now,
            $affiliationOptions,
            $maleFirstNames,
            $femaleFirstNames,
            $lastNames,
            $educationChoices,
            $incomeChoices,
            $civilStatusChoices,
            $relationshipChoices,
            $occupationChoices,
            $housingStructureOptions,
            $toiletOptions,
            $mainIncomeOptions,
            $workStatusOptions,
            $skillOptions,
            $organizationOptions,
            $workLocationOptions,
            $housePhotoPath,
            $personPhotoPath,
            &$totalCreated
        ) {
            $kent = $validators['Kent Andrey'] ?? null;
            $cris = $validators['Cris John'] ?? null;

            $kentId = (int) ($kent->validator_id ?? 0);
            $crisId = (int) ($cris->validator_id ?? 0);

            $kentName = trim((string) ($kent->name ?? $kent->username ?? 'Kent Andrey'));
            $crisName = trim((string) ($cris->name ?? $cris->username ?? 'Cris John'));

            $totalTarget = 100;
            $perValidatorTarget = 50;

            $barangayCount = count($barangays);
            $basePerBarangay = intdiv($totalTarget, max($barangayCount, 1));
            $extraPerBarangay = $totalTarget % max($barangayCount, 1);

            $barangayQuotas = [];
            foreach ($barangays as $idx => $b) {
                $barangayQuotas[$b] = $basePerBarangay + ($idx < $extraPerBarangay ? 1 : 0);
            }

            $kentCount = 0;
            $crisCount = 0;
            $surveyCounter = 0;

            $existingSurveyIds = DB::table('survey')
                ->whereIn('validator_id', [$kentId, $crisId])
                ->where('is_submitted', 0)
                ->pluck('survey_id');

            if ($existingSurveyIds->isNotEmpty()) {
                DB::table('household_mem')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('training')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('economic')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('household')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('demographic')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('classification')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('assignments')->whereIn('survey_id', $existingSurveyIds)->delete();
                DB::table('survey')->whereIn('survey_id', $existingSurveyIds)->delete();
            }

            foreach ($barangays as $barangay) {
                $quota = $barangayQuotas[$barangay] ?? 0;

                for ($j = 0; $j < $quota; $j++) {
                    if ($surveyCounter >= $totalTarget) {
                        break 2;
                    }

                    if (
                        ($kentCount < $perValidatorTarget && $crisCount < $perValidatorTarget && $kentCount <= $crisCount) ||
                        ($kentCount < $perValidatorTarget && $crisCount >= $perValidatorTarget)
                    ) {
                        $validatorId = $kentId;
                        $interviewerName = $kentName;
                        $kentCount++;
                    } else {
                        $validatorId = $crisId;
                        $interviewerName = $crisName;
                        $crisCount++;
                    }

                    $class = $classifications[array_rand($classifications)];
                    $coord = $barangayCoords[$barangay] ?? ['lat' => '6.749720', 'lon' => '125.357220'];

                    $subDisplaced = null;
                    $subDoubleUp = null;
                    $subHomeless = null;

                    if ($class['code'] === 1) {
                        $subDisplaced = random_int(1, $displacedMax);
                    } elseif ($class['code'] === 2) {
                        $subDoubleUp = random_int(1, $doubleUpMax);
                    } elseif ($class['code'] === 3) {
                        $subHomeless = random_int(1, $homelessMax);
                    }

                    $gender = $surveyCounter % 2 === 0 ? 'Male' : 'Female';
                    $lastName = $lastNames[array_rand($lastNames)];
                    $firstName = $gender === 'Male'
                        ? $maleFirstNames[array_rand($maleFirstNames)]
                        : $femaleFirstNames[array_rand($femaleFirstNames)];
                    $respondentName = $firstName.' '.$lastName;

                    $spouseGenderCode = $gender === 'Male' ? 2 : 1;
                    $spouseFirstName = $gender === 'Male'
                        ? $femaleFirstNames[array_rand($femaleFirstNames)]
                        : $maleFirstNames[array_rand($maleFirstNames)];
                    $spouseName = $spouseFirstName.' '.$lastName;

                    $spouseGenderText = $gender === 'Male' ? 'Female' : 'Male';

                    $personAge = random_int(25, 65);
                    $birthDate = Carbon::now()
                        ->subYears($personAge)
                        ->subDays(random_int(0, 365))
                        ->toDateString();

                    $spouseAge = max(21, $personAge + random_int(-5, 5));

                    $interviewRoll = random_int(1, 100);
                    if ($interviewRoll <= 60) {
                        $interviewPersonType = 'Household_Head';
                    } elseif ($interviewRoll <= 85) {
                        $interviewPersonType = 'Spouse_Head';
                    } else {
                        $otherInterviewTypes = ['Never-Married', 'Other_Relative', 'Non_Relative'];
                        $interviewPersonType = $otherInterviewTypes[array_rand($otherInterviewTypes)];
                    }

                    $surveyId = DB::table('survey')->insertGetId([
                        'validator_id' => $validatorId,
                        'interviewed_by' => $interviewerName,
                        'date_interviewed' => Carbon::now()->subDays(random_int(0, 120))->toDateString(),
                        'is_submitted' => 0,
                        'validator_signature' => null,
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);

                    DB::table('classification')->insert([
                        'survey_id' => $surveyId,
                        'previous_client' => random_int(0, 1),
                        'year_inhabited' => random_int(1990, (int) date('Y')),
                        'classification' => $class['code'],
                        'subclass_displaced' => $subDisplaced,
                        'subclass_doubleup' => $subDoubleUp,
                        'subclass_homeless' => $subHomeless,
                    ]);

                    $tagNumber = $this->generateUniqueTagNumber($barangay);

                    $affiliations = [];
                    $affRoll = random_int(0, 2);
                    if ($affRoll === 0) {
                        $affiliations = ['None'];
                    } elseif ($affRoll === 1) {
                        $affiliations = [$affiliationOptions[random_int(1, count($affiliationOptions) - 1)]];
                    } else {
                        $pool = array_slice($affiliationOptions, 1);
                        shuffle($pool);
                        $count = random_int(1, min(3, count($pool)));
                        $affiliations = array_slice($pool, 0, $count);
                    }

                    $affiliationsStr = implode(',', $affiliations);

                    DB::table('demographic')->insert([
                        'survey_id' => $surveyId,
                        'interview_person' => $interviewPersonType,
                        'last_name' => $lastName,
                        'first_name' => $firstName,
                        'middle_name' => 'A',
                        'suffix' => null,
                        'barangay' => $barangay,
                        'purok' => 'Purok '.random_int(1, 5),
                        'street' => 'Sitio '.random_int(1, 10),
                        'gender' => $gender,
                        'religion' => 'Roman_Catholic',
                        'birth_place' => 'Digos City',
                        'birth_date' => $birthDate,
                        'person_age' => $personAge,
                        'marital_status' => 'Married',
                        'contact_number' => '09'.random_int(100000000, 999999999),
                        'language_spoken' => 'Cebuano (Bisaya)',
                        'tribe' => 'Cebuano/Bisaya',
                        'highest_education' => $educationChoices[array_rand($educationChoices)],
                        'last_school_name' => 'Digos City National High School',
                        'year_graduated' => random_int(1990, (int) date('Y')),
                        'spouse_name' => $spouseName,
                        'spouse_religion' => 'Roman_Catholic',
                        'spouse_tribe' => 'Cebuano/Bisaya',
                        'spouse_age' => $spouseAge,
                        'spouse_gender' => $spouseGenderCode,
                        'endorsed_by_mayor' => 0,
                        'affiliations' => $affiliationsStr,
                        'tag_number' => $tagNumber,
                    ]);

                    DB::table('household')->insert([
                        'survey_id' => $surveyId,
                        'lot_ownership' => random_int(0, 1) === 1 ? 'Yes' : 'No',
                        'house_ownership' => random_int(0, 1) === 1 ? 'Yes' : 'No',
                        'avail_socialized_housing' => random_int(0, 1) === 1 ? 'Yes' : 'No',
                        'temporary_living_area' => random_int(0, 1) === 1 ? 'Yes' : 'No',
                        'housing_structure' => $housingStructureOptions[array_rand($housingStructureOptions)],
                        'type_of_toilet' => $toiletOptions[array_rand($toiletOptions)],
                        'source_of_water' => 'NAWASA',
                        'source_of_electricity' => 'With_own_meter',
                    ]);

                    DB::table('economic')->insert([
                        'survey_id' => $surveyId,
                        'main_income_source' => $mainIncomeOptions[array_rand($mainIncomeOptions)],
                        'work_status' => $workStatusOptions[array_rand($workStatusOptions)],
                        'work_location_head' => $workLocationOptions[array_rand($workLocationOptions)],
                        'monthly_salary' => $incomeChoices[array_rand($incomeChoices)],
                        'combine_monthly_income' => $incomeChoices[array_rand($incomeChoices)],
                    ]);

                    DB::table('training')->insert([
                        'survey_id' => $surveyId,
                        'skills_for_living' => random_int(0, 1) === 1 ? 'Yes' : 'No',
                        'specific_skill' => $skillOptions[array_rand($skillOptions)],
                        'organization_member' => random_int(0, 1) === 1 ? 'Yes' : 'No',
                        'specific_organization' => $organizationOptions[array_rand($organizationOptions)],
                        'house_photo' => $housePhotoPath,
                        'person_photo' => $personPhotoPath,
                        'wanttolearn' => $skillOptions[array_rand($skillOptions)],
                        'remarks' => 'No additional remarks.',
                        'latitude' => $coord['lat'],
                        'longitude' => $coord['lon'],
                        'respondent_signature' => null,
                    ]);

                    $memberCount = random_int(2, 6);
                    $members = [];

                    $members[] = [
                        'survey_id' => $surveyId,
                        'name' => $spouseName,
                        'age' => $spouseAge,
                        'relationship' => 'Spouse',
                        'occupation' => $occupationChoices[array_rand($occupationChoices)],
                        'gender' => $spouseGenderText,
                        'civil_status' => 'Married',
                        'educational_attainment' => $educationChoices[array_rand($educationChoices)],
                        'monthly_income' => $incomeChoices[array_rand($incomeChoices)],
                        'code' => '',
                    ];

                    $remainingSlots = max(0, $memberCount - 1);
                    $childSlots = random_int(1, max(1, $remainingSlots));
                    $otherSlots = max(0, $remainingSlots - $childSlots);

                    for ($i = 0; $i < $childSlots; $i++) {
                        $memberGender = $i % 2 === 0 ? 'Male' : 'Female';
                        $relationship = $memberGender === 'Male' ? 'Son' : 'Daughter';
                        $memberFirstName = $memberGender === 'Male'
                            ? $maleFirstNames[array_rand($maleFirstNames)]
                            : $femaleFirstNames[array_rand($femaleFirstNames)];
                        $memberName = $memberFirstName.' '.$lastName;

                        $memberAge = random_int(1, 21);
                        $civilStatus = 'Single';
                        $memberEducation = $memberAge < 7 ? 'none' : $educationChoices[array_rand($educationChoices)];
                        $memberIncome = '0 - 2,999 PHP';
                        $memberOccupation = 'Student';

                        $members[] = [
                            'survey_id' => $surveyId,
                            'name' => $memberName,
                            'age' => $memberAge,
                            'relationship' => $relationship,
                            'occupation' => $memberOccupation,
                            'gender' => $memberGender,
                            'civil_status' => $civilStatus,
                            'educational_attainment' => $memberEducation,
                            'monthly_income' => $memberIncome,
                            'code' => '',
                        ];
                    }

                    $otherRelationships = [
                        'Father',
                        'Mother',
                        'Brother',
                        'Sister',
                        'Uncle',
                        'Aunt',
                        'Nephew',
                        'Niece',
                        'Grandson',
                        'Granddaughter',
                    ];

                    for ($i = 0; $i < $otherSlots; $i++) {
                        $relationship = $otherRelationships[array_rand($otherRelationships)];

                        if ($relationship === 'Father' || $relationship === 'Brother' || $relationship === 'Uncle' || $relationship === 'Nephew' || $relationship === 'Grandson') {
                            $memberGender = 'Male';
                        } elseif ($relationship === 'Mother' || $relationship === 'Sister' || $relationship === 'Aunt' || $relationship === 'Niece' || $relationship === 'Granddaughter') {
                            $memberGender = 'Female';
                        } else {
                            $memberGender = $i % 2 === 0 ? 'Male' : 'Female';
                        }

                        $memberFirstName = $memberGender === 'Male'
                            ? $maleFirstNames[array_rand($maleFirstNames)]
                            : $femaleFirstNames[array_rand($femaleFirstNames)];
                        $memberName = $memberFirstName.' '.$lastName;

                        if ($relationship === 'Grandson' || $relationship === 'Granddaughter' || $relationship === 'Nephew' || $relationship === 'Niece') {
                            $memberAge = random_int(1, 25);
                        } elseif ($relationship === 'Father' || $relationship === 'Mother' || $relationship === 'Uncle' || $relationship === 'Aunt') {
                            $memberAge = max($personAge + random_int(10, 30), $personAge + 5);
                        } else {
                            $memberAge = random_int(18, 75);
                        }

                        $civilStatus = $memberAge < 18
                            ? 'Single'
                            : $civilStatusChoices[array_rand($civilStatusChoices)];

                        $memberEducation = $memberAge < 7 ? 'none' : $educationChoices[array_rand($educationChoices)];
                        $memberIncome = $memberAge < 18
                            ? '0 - 2,999 PHP'
                            : $incomeChoices[array_rand($incomeChoices)];
                        $memberOccupation = $memberAge < 18 ? 'Student' : $occupationChoices[array_rand($occupationChoices)];

                        $members[] = [
                            'survey_id' => $surveyId,
                            'name' => $memberName,
                            'age' => $memberAge,
                            'relationship' => $relationship,
                            'occupation' => $memberOccupation,
                            'gender' => $memberGender,
                            'civil_status' => $civilStatus,
                            'educational_attainment' => $memberEducation,
                            'monthly_income' => $memberIncome,
                            'code' => '',
                        ];
                    }

                    DB::table('household_mem')->insert($members);

                    $totalCreated++;
                    $surveyCounter++;
                }
            }
        });

        $this->info('Dummy surveys created: '.$totalCreated.' (27 barangays x 4 classifications each, all is_submitted = 0).');

        return 0;
    }

    private function generateUniqueTagNumber(string $barangay): string
    {
        $prefix = $this->getBarangayTagPrefix($barangay);

        $existing = DB::table('demographic')
            ->where('barangay', $barangay)
            ->where('tag_number', 'like', $prefix.'%')
            ->pluck('tag_number');

        $max = 0;
        foreach ($existing as $tag) {
            $numPart = (int) substr((string) $tag, strlen($prefix));
            if ($numPart > $max) {
                $max = $numPart;
            }
        }

        $next = $max + 1;

        return $prefix.str_pad((string) $next, 3, '0', STR_PAD_LEFT);
    }

    private function getBarangayTagPrefix(string $barangay): string
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
            'Mahayahay' => 'M',
            'Matti' => 'N',
            'Ruparan' => 'O',
            'San_Agustin' => 'P',
            'San_Jose' => 'Q',
            'San_Miguel' => 'R',
            'San_Roque' => 'S',
            'Sinawilan' => 'T',
            'Soong' => 'U',
            'Tiguman' => 'V',
            'Tres_De_Mayo' => 'W',
            'Zone_1' => 'X',
            'Zone_2' => 'Y',
            'Zone_3' => 'Z',
        ];

        return $map[$barangay] ?? 'X';
    }
}
