<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "city_housing";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit();
}

function sanitize_input($data) {
    if (is_array($data)) {
        return array_map('sanitize_input', $data);
    } elseif (is_string($data)) {
        $data = trim($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
        return $data;
    } else {
        return $data;
    }
}

try {
    // Helper to normalize date to YYYY-MM-DD if sent as MM/DD/YYYY
    function normalize_date($value) {
        $value = trim((string)$value);
        if ($value === '') return '';
        if (strpos($value, '/') !== false) {
            $dt = DateTime::createFromFormat('m/d/Y', $value);
            if ($dt) return $dt->format('Y-m-d');
        }
        return $value; // assume already correct
    }

    // Extract and sanitize
    $validator_id = isset($data['validator_id']) ? (int)$data['validator_id'] : 1;
    $previous_client = sanitize_input($data['previous_client'] ?? '');
    $year_inhabited = sanitize_input($data['year_inhabited'] ?? '');
    $classification = sanitize_input($data['classification'] ?? '');
    $subclass_displaced = sanitize_input($data['subclass_displaced'] ?? '');
    $subclass_doubleup = sanitize_input($data['subclass_doubleup'] ?? '');
    $subclass_homeless = sanitize_input($data['subclass_homeless'] ?? '');
    $interview_person = sanitize_input($data['interview_person'] ?? '');
    $last_name = sanitize_input($data['last_name'] ?? '');
    $first_name = sanitize_input($data['first_name'] ?? '');
    $middle_name = sanitize_input($data['middle_name'] ?? '');
    $suffix = sanitize_input($data['suffix'] ?? '');
    $barangay = sanitize_input($data['barangay'] ?? '');
    $purok = sanitize_input($data['purok'] ?? '');
    $street = sanitize_input($data['street'] ?? '');
    $gender = sanitize_input($data['gender'] ?? '');
    $religion = sanitize_input($data['religion'] ?? '');
    $birth_place = sanitize_input($data['birth_place'] ?? '');
    $birth_date = normalize_date($data['birth_date'] ?? '');
    $person_age = isset($data['person_age']) ? (int)$data['person_age'] : 0;
    $marital_status = sanitize_input($data['marital_status'] ?? '');
    $contact_number = sanitize_input($data['contact_number'] ?? '');
    $language_spoken = sanitize_input($data['language_spoken'] ?? '');
    $tribe = sanitize_input($data['tribe'] ?? '');
    $highest_education = sanitize_input($data['highest_education'] ?? '');
    $last_school_name = sanitize_input($data['last_school_name'] ?? '');
    $year_graduated = sanitize_input($data['year_graduated'] ?? '');
    $spouse_name = sanitize_input($data['spouse_name'] ?? '');
    $spouse_religion = sanitize_input($data['spouse_religion'] ?? '');
    $spouse_tribe = sanitize_input($data['spouse_tribe'] ?? '');
    $spouse_age = isset($data['spouse_age']) ? (int)$data['spouse_age'] : 0;
    $spouse_gender = sanitize_input($data['spouse_gender'] ?? '');
    $affiliation = sanitize_input($data['affiliation'] ?? '');
    $lot_ownership = sanitize_input($data['lot_ownership'] ?? '');
    $house_ownership = sanitize_input($data['house_ownership'] ?? '');
    $avail_socialized_housing = sanitize_input($data['avail_socialized_housing'] ?? '');
    $temporary_living_area = sanitize_input($data['temporary_living_area'] ?? '');
    $housing_structure = sanitize_input($data['housing_structure'] ?? '');
    $type_of_toilet = sanitize_input($data['type_of_toilet'] ?? '');
    $source_of_water = sanitize_input($data['source_of_water'] ?? '');
    $source_of_electricity = sanitize_input($data['source_of_electricity'] ?? '');
    $main_income_source = sanitize_input($data['main_income_source'] ?? '');
    $work_status = sanitize_input($data['work_status'] ?? '');
    $work_location_head = sanitize_input($data['work_location_head'] ?? '');
    $monthly_salary = sanitize_input($data['monthly_salary'] ?? '');
    $combine_monthly_income = sanitize_input($data['combine_monthly_income'] ?? '');
    $skills_for_living = sanitize_input($data['skills_for_living'] ?? '');
    $specific_skill = sanitize_input($data['specific_skill'] ?? '');
    $organization_member = sanitize_input($data['organization_member'] ?? '');
    $specific_organization = sanitize_input($data['specific_organization'] ?? '');
    $wanttolearn = sanitize_input($data['wanttolearn'] ?? '');
    $house_photo = '';
    $house_photo_filename = '';
    $house_photo_type = '';
    $remarks = sanitize_input($data['remarks'] ?? '');
    $interviewed_by = sanitize_input($data['interviewed_by'] ?? '');
    $date_interviewed = normalize_date($data['date_interviewed'] ?? '');
    $is_submitted = isset($data['is_submitted']) ? (int)$data['is_submitted'] : 1;
    $latitude = isset($data['latitude']) ? (string)$data['latitude'] : null;
    $longitude = isset($data['longitude']) ? (string)$data['longitude'] : null;
    $validator_signature = sanitize_input($data['validator_signature'] ?? '');
    $respondent_signature = sanitize_input($data['respondent_signature'] ?? '');

    // Build columns and values dynamically to keep counts in sync
    $columns = [
        'validator_id','previous_client','year_inhabited','classification','subclass_displaced','subclass_doubleup','subclass_homeless',
        'interview_person','last_name','first_name','middle_name','suffix','barangay','purok','street','gender','religion','birth_place','birth_date','person_age',
        'marital_status','contact_number','language_spoken','tribe','highest_education','last_school_name','year_graduated','spouse_name',
        'spouse_religion','spouse_tribe','spouse_age','spouse_gender','affiliation','lot_ownership','house_ownership','avail_socialized_housing',
        'temporary_living_area','housing_structure','type_of_toilet','source_of_water','source_of_electricity','main_income_source',
        'work_status','work_location_head','monthly_salary','combine_monthly_income','skills_for_living','specific_skill','organization_member',
        'specific_organization','wanttolearn','house_photo','house_photo_filename','house_photo_type','remarks','interviewed_by','date_interviewed',
        'is_submitted','latitude','longitude','validator_signature','respondent_signature'
    ];

    $values = [
        $validator_id,$previous_client,$year_inhabited,$classification,$subclass_displaced,$subclass_doubleup,$subclass_homeless,
        $interview_person,$last_name,$first_name,$middle_name,$suffix,$barangay,$purok,$street,$gender,$religion,$birth_place,$birth_date,$person_age,
        $marital_status,$contact_number,$language_spoken,$tribe,$highest_education,$last_school_name,$year_graduated,$spouse_name,
        $spouse_religion,$spouse_tribe,$spouse_age,$spouse_gender,$affiliation,$lot_ownership,$house_ownership,$avail_socialized_housing,
        $temporary_living_area,$housing_structure,$type_of_toilet,$source_of_water,$source_of_electricity,$main_income_source,
        $work_status,$work_location_head,$monthly_salary,$combine_monthly_income,$skills_for_living,$specific_skill,$organization_member,
        $specific_organization,$wanttolearn,$house_photo,$house_photo_filename,$house_photo_type,$remarks,$interviewed_by,$date_interviewed,
        $is_submitted,$latitude,$longitude,$validator_signature,$respondent_signature
    ];

    $placeholders = implode(',', array_fill(0, count($columns), '?'));
    $sql = "INSERT INTO survey_response (" . implode(',', $columns) . ") VALUES ($placeholders)";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    // Build types string dynamically: i for int, s otherwise
    $types = '';
    foreach ($values as $v) {
        if (is_int($v)) { $types .= 'i'; }
        else { $types .= 's'; }
    }

    // bind_param requires references
    $bind_params = [];
    $bind_params[] = &$types;
    for ($i = 0; $i < count($values); $i++) {
        $bind_params[] = &$values[$i];
    }

    call_user_func_array([$stmt, 'bind_param'], $bind_params);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Survey submitted successfully']);
    } else {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
