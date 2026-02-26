<?php

namespace App\Console\Commands;

use App\Exceptions\ScoreCalculationException;
use App\Models\Survey;
use App\Models\Validator;
use App\Services\BeneficiaryScoreService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Services\FileStorageService;

class GenerateDummySurveys extends Command
{
    protected $signature = 'surveys:generate-dummy';

    protected $description = 'Generate dummy survey records for testing and validation dashboards';

    public function handle(): int
    {
        // Cris = validator_id 1, Kent = validator_id 2
        $cris = Validator::find(1);
        $kent = Validator::find(2);

        if (!$cris || !$kent) {
            $this->error('Required validator accounts not found. Make sure validator_id 1 (Cris) and 2 (Kent) exist.');
            return 1;
        }

        $validators = [
            'Cris' => $cris,
            'Kent' => $kent,
        ];

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
            'Zone_I',
            'Zone_II',
            'Zone_III',
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
            'Zone_I' => ['lat' => '6.749720', 'lon' => '125.357220'],
            'Zone_II' => ['lat' => '6.752000', 'lon' => '125.359000'],
            'Zone_III' => ['lat' => '6.747000', 'lon' => '125.355000'],
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

        // Expanded diverse Filipino names - no repetition
        $maleFirstNames = [
            'Adrian', 'Albert', 'Alfredo', 'Angelo', 'Antonio', 'Ariel', 'Arnold', 'Benjamin', 'Bernard', 'Carlos',
            'Cesar', 'Christian', 'Christopher', 'Daniel', 'David', 'Edgar', 'Eduardo', 'Edwin', 'Elmer', 'Emmanuel',
            'Enrique', 'Eric', 'Ernesto', 'Ferdinand', 'Fernando', 'Francis', 'Francisco', 'Gabriel', 'George', 'Gerald',
            'Gilbert', 'Gregorio', 'Harold', 'Henry', 'Herbert', 'Ignacio', 'Isidro', 'Jaime', 'James', 'Jason',
            'Jeffrey', 'Jerome', 'Jesus', 'Joel', 'John', 'Jonathan', 'Jorge', 'Jose', 'Joseph', 'Joshua',
            'Juan', 'Julian', 'Julio', 'Kenneth', 'Kevin', 'Leonardo', 'Lorenzo', 'Luis', 'Manuel', 'Marco',
            'Mario', 'Mark', 'Martin', 'Marvin', 'Michael', 'Miguel', 'Nelson', 'Nestor', 'Oscar', 'Pablo',
            'Patrick', 'Paul', 'Pedro', 'Peter', 'Philip', 'Rafael', 'Ramon', 'Raul', 'Raymond', 'Rene',
            'Ricardo', 'Richard', 'Robert', 'Roberto', 'Rodolfo', 'Roger', 'Roland', 'Romeo', 'Ronald', 'Roy',
            'Ruben', 'Salvador', 'Samuel', 'Santiago', 'Sergio', 'Stephen', 'Teodoro', 'Thomas', 'Victor', 'Vincent',
        ];

        $femaleFirstNames = [
            'Abigail', 'Agnes', 'Aileen', 'Alexandra', 'Alice', 'Alma', 'Amanda', 'Ana', 'Andrea', 'Angela',
            'Angelica', 'Anita', 'Anna', 'Annabelle', 'Antonia', 'April', 'Aurora', 'Barbara', 'Beatrice', 'Bella',
            'Bernadette', 'Betty', 'Carmela', 'Carmen', 'Carol', 'Carolina', 'Catherine', 'Cecilia', 'Celia', 'Charmaine',
            'Christina', 'Christine', 'Clara', 'Clarissa', 'Claudia', 'Concepcion', 'Cristina', 'Cynthia', 'Daisy', 'Delia',
            'Diana', 'Dolores', 'Donna', 'Dora', 'Dorothy', 'Elena', 'Elizabeth', 'Elvira', 'Emily', 'Emma',
            'Erlinda', 'Esmeralda', 'Esperanza', 'Estela', 'Esther', 'Eva', 'Evelyn', 'Fe', 'Felicidad', 'Felisa',
            'Flora', 'Florence', 'Francisca', 'Gemma', 'Gloria', 'Grace', 'Gregoria', 'Helen', 'Imelda', 'Irene',
            'Isabel', 'Jacqueline', 'Janet', 'Jasmine', 'Jennifer', 'Jessica', 'Joanna', 'Josefa', 'Josephine', 'Joyce',
            'Judith', 'Julia', 'Juliana', 'Karen', 'Katherine', 'Laura', 'Leonora', 'Leticia', 'Lilia', 'Linda',
            'Lourdes', 'Lucia', 'Luisa', 'Luz', 'Lydia', 'Magdalena', 'Margarita', 'Maria', 'Marilyn', 'Marina',
            'Martha', 'Mary', 'Mercedes', 'Michelle', 'Milagros', 'Monica', 'Nancy', 'Natalia', 'Nicole', 'Nora',
            'Norma', 'Olivia', 'Patricia', 'Paula', 'Paz', 'Perla', 'Pilar', 'Priscilla', 'Rachel', 'Rebecca',
            'Regina', 'Remedios', 'Rita', 'Rosa', 'Rosalie', 'Rosario', 'Rose', 'Rowena', 'Ruby', 'Ruth',
            'Sandra', 'Sara', 'Sharon', 'Sofia', 'Soledad', 'Stella', 'Susan', 'Susana', 'Teresa', 'Teresita',
            'Thelma', 'Theresa', 'Trinidad', 'Valentina', 'Veronica', 'Victoria', 'Vilma', 'Virginia', 'Vivian', 'Yolanda',
        ];

        $lastNames = [
            'Abad', 'Abella', 'Acosta', 'Aguilar', 'Alcaraz', 'Alcantara', 'Alejandro', 'Alfonso', 'Alvarez', 'Andres',
            'Angeles', 'Aquino', 'Arellano', 'Arias', 'Asuncion', 'Austria', 'Avila', 'Ayala', 'Bautista', 'Benitez',
            'Bernardo', 'Blanco', 'Bravo', 'Buenaventura', 'Cabrera', 'Calderon', 'Camacho', 'Campos', 'Canlas', 'Capistrano',
            'Cardenas', 'Carlos', 'Carrillo', 'Castillo', 'Castro', 'Cervantes', 'Chavez', 'Concepcion', 'Contreras', 'Cordero',
            'Corona', 'Cortez', 'Cruz', 'Cuevas', 'Dalisay', 'David', 'De Guzman', 'De Jesus', 'De La Cruz', 'De Leon',
            'De Los Reyes', 'De Los Santos', 'Del Rosario', 'Delgado', 'Diaz', 'Domingo', 'Dominguez', 'Duran', 'Enriquez', 'Escobar',
            'Espinosa', 'Estrada', 'Evangelista', 'Fernandez', 'Ferrer', 'Figueroa', 'Flores', 'Francisco', 'Fuentes', 'Galang',
            'Galvez', 'Garcia', 'Gomez', 'Gonzales', 'Gonzalez', 'Guerrero', 'Gutierrez', 'Guzman', 'Hernandez', 'Herrera',
            'Hidalgo', 'Ignacio', 'Jimenez', 'Lacson', 'Lara', 'Laurel', 'Leon', 'Lim', 'Lopez', 'Lorenzo',
            'Luna', 'Magno', 'Manalang', 'Manalo', 'Mangubat', 'Manuel', 'Marquez', 'Martin', 'Martinez', 'Medina',
            'Mejia', 'Mendez', 'Mendoza', 'Miranda', 'Molina', 'Montero', 'Morales', 'Moreno', 'Muñoz', 'Navarro',
            'Ocampo', 'Olivares', 'Ortega', 'Ortiz', 'Padilla', 'Palma', 'Pascual', 'Pena', 'Perez', 'Pineda',
            'Ponce', 'Prieto', 'Quijano', 'Quintana', 'Quirino', 'Ramirez', 'Ramos', 'Reyes', 'Rivera', 'Robles',
            'Rodriguez', 'Rojas', 'Romero', 'Rosales', 'Rosario', 'Ruiz', 'Salazar', 'Salcedo', 'Sanchez', 'Sandoval',
            'Santiago', 'Santos', 'Sarmiento', 'Silva', 'Solis', 'Soriano', 'Suarez', 'Tan', 'Tolentino', 'Torres',
            'Trinidad', 'Valdez', 'Valencia', 'Valenzuela', 'Vargas', 'Vasquez', 'Vega', 'Velasco', 'Velasquez', 'Vera',
            'Vicente', 'Villa', 'Villanueva', 'Villar', 'Villegas', 'Zamora', 'Zapata',
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
            'Construction Worker',
            'Factory Worker',
            'Security Guard',
            'Sales Clerk',
            'Jeepney Driver',
            'Habal-habal Driver',
            'Carpenter',
            'Electrician',
            'Plumber',
            'Seamstress',
            'Cook',
            'Waiter/Waitress',
            'Janitor',
            'Laundry Worker',
            'Delivery Rider',
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

        $housePhotoPath = 'pics/house.png';
        $personPhotoPath = 'pics/person.png';

        // Housing structure options
        $housingStructureOptions = [
            'Full Concrete',
            'Made of wood and metal roof',
            'Made of Amakan and Nipa',
            'Made of Amakan and metal roof',
            'Combination of concrete and wood',
            'Makeshift/Salvaged/Improvised material',
        ];

        // Toilet options
        $toiletOptions = ['Water Sealed', 'Open Pit/Antipolo', 'No Toilet'];

        // Water sources
        $waterSources = [
            'Community Water System (NAWASA)',
            'Deep Well',
            'Spring',
            'Rainwater',
            'Surface water (river, lake, dam)',
        ];

        // Electricity sources
        $electricitySources = [
            'With own meter',
            'Solar Panel',
            'Candle/Lamp',
            'Tapping to the neighbor',
        ];

        $totalCreated = 0;
        $createdSurveyIds = [];
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
            $civilStatusChoices,
            $relationshipChoices,
            $occupationChoices,
            $housingStructureOptions,
            $toiletOptions,
            $waterSources,
            $electricitySources,
            $mainIncomeOptions,
            $workStatusOptions,
            $skillOptions,
            $organizationOptions,
            $workLocationOptions,
            $housePhotoPath,
            $personPhotoPath,
            &$totalCreated,
            &$createdSurveyIds
        ) {
            $cris = $validators['Cris'] ?? null;
            $kent = $validators['Kent'] ?? null;

            $crisId = 1; // Cris is always validator_id 1
            $kentId = 2; // Kent is always validator_id 2

            $crisName = trim((string) ($cris->name ?? $cris->username ?? 'Cris'));
            $kentName = trim((string) ($kent->name ?? $kent->username ?? 'Kent'));

            $totalTarget = 200;
            $perValidatorTarget = 100;

            // Kapatagan gets the highest number of surveys (30% of total)
            // Remaining barangays get distributed unevenly
            $kapataganQuota = (int) ($totalTarget * 0.30); // 60 surveys for Kapatagan
            $remainingTarget = $totalTarget - $kapataganQuota;
            
            // Create uneven distribution for other barangays
            $otherBarangays = array_filter($barangays, fn($b) => $b !== 'Kapatagan');
            $barangayQuotas = ['Kapatagan' => $kapataganQuota];
            
            // Assign random quotas to other barangays (between 2-10 surveys each)
            $remainingCount = $remainingTarget;
            $otherBarangayCount = count($otherBarangays);
            
            foreach ($otherBarangays as $idx => $barangay) {
                if ($idx === $otherBarangayCount - 1) {
                    // Last barangay gets whatever is left
                    $barangayQuotas[$barangay] = $remainingCount;
                } else {
                    // Random allocation between 2-10
                    $maxAllocation = min(10, $remainingCount - ($otherBarangayCount - $idx - 1) * 2);
                    $allocation = random_int(2, max(2, $maxAllocation));
                    $barangayQuotas[$barangay] = $allocation;
                    $remainingCount -= $allocation;
                }
            }

            $kentCount = 0;
            $crisCount = 0;
            $surveyCounter = 0;

            $existingSurveyIds = DB::table('survey')
                ->whereIn('validator_id', [1, 2]) // Cris (1) and Kent (2)
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
                    $createdSurveyIds[] = (int) $surveyId;

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

                    // Derive housing and income details based on the household classification
                    $lotOwnership = random_int(0, 1) === 1 ? 'Owned' : 'Rented';
                    $houseOwnership = random_int(0, 1) === 1 ? 'Owned' : 'Rented';
                    $availSocializedHousing = random_int(0, 1) === 1 ? 'Yes' : 'No';
                    $temporaryLivingArea = random_int(0, 1) === 1 ? 'Yes' : 'No';
                    
                    // Select housing structure from predefined options
                    $housingStructure = $housingStructureOptions[array_rand($housingStructureOptions)];
                    
                    // Select toilet type from predefined options
                    $typeOfToilet = $toiletOptions[array_rand($toiletOptions)];
                    
                    // Select water source from predefined options
                    $sourceOfWater = $waterSources[array_rand($waterSources)];
                    
                    // Select electricity source from predefined options
                    $sourceOfElectricity = $electricitySources[array_rand($electricitySources)];

                    // Generate realistic income for household head based on classification
                    $headMonthlyIncome = 0;
                    
                    if ($class['code'] === 3) {
                        // Homeless: very low income, no ownership, temporary shelter
                        $lotOwnership = 'None';
                        $houseOwnership = 'None';
                        $temporaryLivingArea = 'Yes';
                        $housingStructure = 'Makeshift/Salvaged/Improvised material';
                        $typeOfToilet = 'No Toilet';
                        $sourceOfWater = random_int(0, 1) ? 'Surface water (river, lake, dam)' : 'Rainwater';
                        $sourceOfElectricity = 'Candle/Lamp';
                        $headMonthlyIncome = random_int(500, 2500); // Very low income
                    } elseif ($class['code'] === 2) {
                        // Double-up: no house ownership, low to mid income
                        $houseOwnership = 'Shared';
                        $temporaryLivingArea = 'Yes';
                        $housingStructure = random_int(0, 1) ? 'Made of Amakan and Nipa' : 'Made of wood and metal roof';
                        $typeOfToilet = random_int(0, 1) ? 'Open Pit/Antipolo' : 'Water Sealed';
                        $sourceOfWater = random_int(0, 1) ? 'Deep Well' : 'Spring';
                        $sourceOfElectricity = random_int(0, 1) ? 'Tapping to the neighbor' : 'With own meter';
                        $headMonthlyIncome = random_int(2000, 5500); // Low to mid income
                    } elseif ($class['code'] === 1) {
                        // Displaced: more likely to avail socialized housing, lower income
                        $availSocializedHousing = random_int(1, 100) <= 70 ? 'Yes' : 'No';
                        $housingStructure = random_int(0, 1) ? 'Made of Amakan and metal roof' : 'Combination of concrete and wood';
                        $typeOfToilet = random_int(0, 1) ? 'Open Pit/Antipolo' : 'Water Sealed';
                        $sourceOfWater = random_int(0, 1) ? 'Deep Well' : 'Community Water System (NAWASA)';
                        $sourceOfElectricity = random_int(0, 1) ? 'Tapping to the neighbor' : 'With own meter';
                        $headMonthlyIncome = random_int(3000, 8000); // Low to moderate income
                    } elseif ($class['code'] === 4) {
                        // Upgrading of Land Tenure: has ownership, higher income
                        $lotOwnership = 'Owned';
                        $houseOwnership = 'Owned';
                        $housingStructure = random_int(0, 1) ? 'Combination of concrete and wood' : 'Full Concrete';
                        $typeOfToilet = 'Water Sealed';
                        $sourceOfWater = random_int(0, 1) ? 'Community Water System (NAWASA)' : 'Deep Well';
                        $sourceOfElectricity = 'With own meter';
                        $headMonthlyIncome = random_int(7000, 15000); // Moderate to higher income
                    }

                    // Store head income for later calculation
                    $householdHeadIncome = $headMonthlyIncome;

                    DB::table('household')->insert([
                        'survey_id' => $surveyId,
                        'lot_ownership' => $lotOwnership,
                        'house_ownership' => $houseOwnership,
                        'avail_socialized_housing' => $availSocializedHousing,
                        'temporary_living_area' => $temporaryLivingArea,
                        'housing_structure' => $housingStructure,
                        'type_of_toilet' => $typeOfToilet,
                        'source_of_water' => $sourceOfWater,
                        'source_of_electricity' => $sourceOfElectricity,
                    ]);

                    // Placeholder for economic data - will be updated after calculating combined income
                    $economicId = DB::table('economic')->insertGetId([
                        'survey_id' => $surveyId,
                        'main_income_source' => $mainIncomeOptions[array_rand($mainIncomeOptions)],
                        'work_status' => $workStatusOptions[array_rand($workStatusOptions)],
                        'work_location_head' => $workLocationOptions[array_rand($workLocationOptions)],
                        'monthly_salary' => '0 - 2,999 PHP', // Temporary, will update
                        'combine_monthly_income' => 0, // Will calculate after adding members
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
                        'respondent_signature' => $this->getDummySignaturePath(),
                    ]);

                    $memberCount = random_int(2, 6);
                    $members = [];
                    $totalHouseholdIncome = $householdHeadIncome; // Start with head's income
                    
                    // Generate spouse income based on classification
                    $spouseIncome = 0;
                    if ($class['code'] === 3) {
                        // Homeless: spouse may have very low or no income
                        $spouseIncome = random_int(0, 2000);
                    } elseif ($class['code'] === 2) {
                        // Double-up: spouse may have low income
                        $spouseIncome = random_int(0, 4000);
                    } elseif ($class['code'] === 1) {
                        // Displaced: spouse may have low to moderate income
                        $spouseIncome = random_int(1000, 5000);
                    } elseif ($class['code'] === 4) {
                        // Upgrading: spouse may have moderate income
                        $spouseIncome = random_int(2000, 8000);
                    }
                    
                    $totalHouseholdIncome += $spouseIncome;

                    $members[] = [
                        'survey_id' => $surveyId,
                        'name' => $spouseName,
                        'age' => $spouseAge,
                        'relationship' => 'Spouse',
                        'occupation' => $spouseIncome > 0 ? $occupationChoices[array_rand($occupationChoices)] : 'Housekeeper',
                        'gender' => $spouseGenderText,
                        'civil_status' => 'Married',
                        'educational_attainment' => $educationChoices[array_rand($educationChoices)],
                        'monthly_income' => $spouseIncome,
                        'code' => '',
                    ];

                    $remainingSlots = max(0, $memberCount - 1);
                    $childSlots = random_int(1, max(1, $remainingSlots));
                    $otherSlots = max(0, $remainingSlots - $childSlots);

                    // Track used names to avoid repetition
                    $usedNames = [$respondentName, $spouseName];

                    for ($i = 0; $i < $childSlots; $i++) {
                        $memberGender = $i % 2 === 0 ? 'Male' : 'Female';
                        $relationship = $memberGender === 'Male' ? 'Son' : 'Daughter';
                        
                        // Get unique name
                        do {
                            $memberFirstName = $memberGender === 'Male'
                                ? $maleFirstNames[array_rand($maleFirstNames)]
                                : $femaleFirstNames[array_rand($femaleFirstNames)];
                            $memberName = $memberFirstName.' '.$lastName;
                        } while (in_array($memberName, $usedNames));
                        $usedNames[] = $memberName;

                        $memberAge = random_int(1, 21);
                        $civilStatus = 'Single';
                        $memberEducation = $memberAge < 7 ? 'none' : $educationChoices[array_rand($educationChoices)];
                        
                        // Children income: students have no income, working age may have part-time income
                        $memberIncome = 0;
                        $memberOccupation = 'Student';
                        if ($memberAge >= 18) {
                            // Working age children may contribute
                            $memberIncome = random_int(0, 4000);
                            if ($memberIncome > 0) {
                                $memberOccupation = $occupationChoices[array_rand($occupationChoices)];
                            }
                            $totalHouseholdIncome += $memberIncome;
                        }

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

                        // Get unique name
                        do {
                            $memberFirstName = $memberGender === 'Male'
                                ? $maleFirstNames[array_rand($maleFirstNames)]
                                : $femaleFirstNames[array_rand($femaleFirstNames)];
                            $memberLastName = $lastNames[array_rand($lastNames)];
                            $memberName = $memberFirstName.' '.$memberLastName;
                        } while (in_array($memberName, $usedNames));
                        $usedNames[] = $memberName;

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
                        
                        // Other relatives may contribute income if working age
                        $memberIncome = 0;
                        $memberOccupation = 'Student';
                        if ($memberAge >= 18 && $memberAge < 65) {
                            // Working age may contribute
                            $memberIncome = random_int(0, 6000);
                            if ($memberIncome > 0) {
                                $memberOccupation = $occupationChoices[array_rand($occupationChoices)];
                            }
                            $totalHouseholdIncome += $memberIncome;
                        } elseif ($memberAge >= 65) {
                            $memberOccupation = 'Retired';
                        }

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
                    
                    // Now update the economic table with the calculated combined income
                    DB::table('economic')
                        ->where('survey_id', $surveyId)
                        ->update([
                            'monthly_salary' => $this->getIncomeRangeLabel($householdHeadIncome),
                            'combine_monthly_income' => $totalHouseholdIncome,
                        ]);

                    $totalCreated++;
                    $surveyCounter++;
                }
            }
        });

        // After inserting dummy surveys, calculate priority scores using the new scoring system
        if (! empty($createdSurveyIds)) {
            $this->info('Calculating priority scores for dummy surveys...');

            $scoreService = new BeneficiaryScoreService();
            $surveys = Survey::whereIn('survey_id', $createdSurveyIds)->get();

            foreach ($surveys as $survey) {
                try {
                    $scoreService->calculateAndSave($survey);
                } catch (ScoreCalculationException $e) {
                    $this->error('Failed to calculate score for survey ID '.$survey->survey_id.': '.$e->getMessage());
                }
            }
        }

        $this->info('Dummy surveys created: '.$totalCreated.' (200 total, Kapatagan has highest count, split between Cris and Kent, all is_submitted = 0, scores calculated using new scoring system with realistic combined household income).');

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
            'Zone_I' => 'X',
            'Zone_II' => 'Y',
            'Zone_III' => 'Z',
        ];

        return $map[$barangay] ?? 'X';
    }

    /**
     * Get the dummy signature path by copying the dummy_esign.png to signatures directory
     */
    private function getDummySignaturePath(): ?string
    {
        $dummySignaturePath = public_path('pics/dummy_esign.png');
        
        if (!file_exists($dummySignaturePath)) {
            $this->warn('Dummy signature file not found at: ' . $dummySignaturePath);
            return null;
        }
        
        // Read the dummy signature file
        $signatureData = file_get_contents($dummySignaturePath);
        if ($signatureData === false) {
            $this->warn('Failed to read dummy signature file');
            return null;
        }
        
        // Generate unique filename
        $filename = 'dummy_sig_' . uniqid() . '.png';
        
        // Store in Laravel storage
        Storage::disk('public')->put('signatures/' . $filename, $signatureData);
        
        // Also copy to public directory using FileStorageService
        try {
            FileStorageService::copyToPublicDirectory('signatures', $filename);
        } catch (\Exception $e) {
            $this->warn('Failed to copy signature to public directory: ' . $e->getMessage());
        }
        
        return 'signatures/' . $filename;
    }
    
    /**
     * Convert numeric income to income range label
     */
    private function getIncomeRangeLabel(int $income): string
    {
        if ($income < 3000) {
            return '0 - 2,999 PHP';
        } elseif ($income < 6000) {
            return '3,000 - 5,999 PHP';
        } elseif ($income < 9000) {
            return '6,000 - 8,999 PHP';
        } elseif ($income < 13000) {
            return '9,000 - 12,999_PHP';
        } else {
            return '13,000 and above';
        }
    }
}
