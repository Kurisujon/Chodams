<?php
session_start();
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header("Location: validator_login.html"); // Redirect to login page if not logged in
    exit();
}
// Database connection
$servername = "localhost";
$username = "root";
$password = ""; // Default password for XAMPP
$dbname = "city_housing";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Sanitize input data
function sanitize_input($data) {
    if (is_array($data)) {
        return array_map('sanitize_input', $data);
    } elseif (is_string($data)) {
        $data = trim($data);                     // Trim spaces
        $data = str_replace('_', ' ', $data);    // Replace underscores with spaces
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8'); // Convert special characters
        return $data;
    } else {
        return $data;
    }
}
$validator_id = $_SESSION['validator_id']; // Validator ID from session
$interviewed_by = $_SESSION['name']; // Validator name from session
if (!$validator_id || !$interviewed_by) {
    echo "Error: You must be logged in as a validator to submit a survey.";
    exit();
}
$house_photo_blob = null;
$house_photo_filename = '';
$latitude = sanitize_input($_POST['latitude']);
$longitude = sanitize_input($_POST['longitude']);

// Handle house photo upload - store as BLOB
if (isset($_FILES['house_photo']) && $_FILES['house_photo']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['house_photo'];
    $file_name = basename($file["name"]);
    $file_size = $file["size"];
    $file_type = $file["type"];
    
    // Check file size (limit to 5MB)
    if ($file_size > 5 * 1024 * 1024) {
        echo "Error: File size too large. Maximum size is 5MB.";
        exit();
    }
    
    // Check file type
    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!in_array($file_type, $allowed_types)) {
        echo "Error: Invalid file type. Only JPG, PNG, and GIF are allowed.";
        exit();
    }
    
    // Read file content for BLOB storage
    $house_photo_blob = file_get_contents($file["tmp_name"]);
    $house_photo_filename = $file_name;
    
    if ($house_photo_blob === false) {
        echo "Error reading house photo file.";
        exit();
    }
}

// Save e-signatures as images if provided
function save_signature($base64_string, $filename) {
    $data = explode(',', $base64_string);
    if (count($data) == 2) {
        $decoded = base64_decode($data[1]);
        file_put_contents($filename, $decoded);
    }
}

$validator_signature_path = null;
$respondent_signature_path = null;

if (!empty($_POST['validator_signature'])) {
    $validator_filename = 'uploads/validator_signature_' . time() . '.png';
    save_signature($_POST['validator_signature'], $validator_filename);
    $validator_signature_path = $validator_filename;
}

if (!empty($_POST['respondent_signature'])) {
    $respondent_filename = 'uploads/respondent_signature_' . time() . '.png';
    save_signature($_POST['respondent_signature'], $respondent_filename);
    $respondent_signature_path = $respondent_filename;
}

// Prepare variables from POST data
$previous_client = sanitize_input($_POST['previous_client']);
$year_inhabited = sanitize_input($_POST['year_inhabited']);
$classification = sanitize_input($_POST['classification']);
$subclass_displaced = isset($_POST['sub_class_displaced']) ? sanitize_input($_POST['sub_class_displaced']) : '';
$subclass_doubleup = isset($_POST['sub_class_double_up']) ? sanitize_input($_POST['sub_class_double_up']) : '';
$subclass_homeless = isset($_POST['sub_class_homeless']) ? sanitize_input($_POST['sub_class_homeless']) : '';

if ($classification === 'Homeless') {
    $subclass_displaced = null;
    $subclass_doubleup = null;
} elseif ($classification === 'Upgrading_of_Land_Tenure') {
    $subclass_displaced = null;
    $subclass_doubleup = null;
    $subclass_homeless = null;
} elseif ($classification === 'Displaced') {
    $subclass_doubleup = null; // Only Displaced subclass is relevant
    $subclass_homeless = null;
} elseif ($classification === 'Double-up') {
    $subclass_displaced = null; // Only Double-up subclass is relevant
    $subclass_homeless = null;
}

// Validate classification
if (empty($classification)) {
    die("Classification is required.");
}
$interview_person = sanitize_input($_POST['interview_person']);
$last_name = sanitize_input($_POST['last_name']);
$first_name = sanitize_input($_POST['first_name']);
$middle_name = sanitize_input($_POST['middle_name']);
$suffix = sanitize_input($_POST['suffix']);
$barangay = sanitize_input($_POST['barangay']);
$purok = sanitize_input($_POST['purok']);
$street = sanitize_input($_POST['street']);
$gender = sanitize_input($_POST['gender']);
$religion = sanitize_input($_POST['religion']);
$birth_place = sanitize_input($_POST['birth_place']);
$birth_date = sanitize_input($_POST['birth_date']);
$person_age = sanitize_input($_POST['person_age']);
$marital_status = sanitize_input($_POST['marital_status']);
$contact_number = sanitize_input($_POST['contact_number']);
$language_spoken = sanitize_input($_POST['language_spoken']);
$tribe = sanitize_input($_POST['tribe']);
$highest_education = sanitize_input($_POST['highest_education']);
$last_school_name = sanitize_input($_POST['last_school_attended']);
$year_graduated = sanitize_input($_POST['year_graduated']);
$spouse_name = sanitize_input($_POST['spouse_name']);
$spouse_religion = sanitize_input($_POST['spouse_religion']);
$spouse_tribe = sanitize_input($_POST['spouse_tribe']);
$spouse_age = sanitize_input($_POST['spouse_age']);
$spouse_gender = sanitize_input($_POST['spouse_gender']);
$affiliation = sanitize_input($_POST['affiliation']);
$lot_ownership = sanitize_input($_POST['lot_ownership']);
$house_ownership = sanitize_input($_POST['house_ownership']);
$avail_socialized_housing = sanitize_input($_POST['avail_socialized_housing']);
$temporary_living_area = sanitize_input($_POST['temporary_living_area']);
$housing_structure = sanitize_input($_POST['housing_structure']);
if ($housing_structure === "Others") {
    $housing_structure = sanitize_input($_POST['other_housing_structure']);
}
$type_of_toilet = sanitize_input($_POST['type_of_toilet']);
if ($type_of_toilet === "Others") {
    $type_of_toilet = sanitize_input($_POST['other_type_of_toilet']);
}
$source_of_water = sanitize_input($_POST['source_of_water']);
if ($source_of_water === "Others") {
    $source_of_water = sanitize_input($_POST['other_source_of_water']);
}
$source_of_electricity = sanitize_input($_POST['source_of_electricity']);
if ($source_of_electricity === "Others") {
    $source_of_electricity = sanitize_input($_POST['other_source_of_electricity']);
}
$main_income_source = sanitize_input($_POST['main_income_source']);
if ($main_income_source === "others") {
    $main_income_source = sanitize_input($_POST['other_main_income_source']);
}
$work_status = sanitize_input($_POST['work_status']);
if ($work_status === "others") {
    $work_status = sanitize_input($_POST["other_work_status"]);
}
$work_location_head = sanitize_input($_POST["work_location_head"]);
$monthly_salary = sanitize_input($_POST["monthly_salary"]);
$combine_monthly_income = sanitize_input($_POST["combine_monthly_income"]);
$skills_for_living = sanitize_input($_POST["skills_for_living"]);
$specific_skill = '';
if ($skills_for_living === 'Yes') {
    $specific_skill = sanitize_input($_POST["specific_skill"]);
    if ($specific_skill === 'others') {
        $specific_skill = sanitize_input($_POST["other_skill"]);
    }
}

$organization_member = sanitize_input($_POST["organization_member"]);
$specific_organization = '';
if ($organization_member === 'Yes') {
    $specific_organization = sanitize_input($_POST["specific_organization"]);
    if ($specific_organization === 'others') {
        $specific_organization = sanitize_input($_POST["other_organization"]);
    }
}
if (empty($skills_for_living)) {
    die("The 'skills for living' field is required.");
}
if (empty($organization_member)) {
    die("The 'organization member' field is required.");
}
$wanttolearn = sanitize_input($_POST["wanttolearn"]);
$remarks = sanitize_input($_POST["remarks"]);
$date_interviewed = sanitize_input($_POST["date_interviewed"]);

// Insert data into the database
$sql = "INSERT INTO survey_response (
    validator_id, previous_client, year_inhabited, classification, subclass_displaced, subclass_doubleup, subclass_homeless,
    interview_person, last_name, first_name, middle_name, suffix, barangay, purok, street, gender, 
    religion, birth_place, birth_date, person_age, marital_status, contact_number, language_spoken, tribe, 
    highest_education, last_school_name, year_graduated, spouse_name, spouse_religion, spouse_tribe, spouse_age, 
    spouse_gender, affiliation, lot_ownership, house_ownership, avail_socialized_housing, temporary_living_area,
    housing_structure, type_of_toilet, source_of_water, source_of_electricity, main_income_source, work_status, work_location_head,
    monthly_salary, combine_monthly_income, skills_for_living, specific_skill, organization_member, specific_organization,
    wanttolearn, house_photo, house_photo_filename, house_photo_type, remarks, interviewed_by, date_interviewed, latitude, longitude,
    validator_signature, respondent_signature
) VALUES (
    '$validator_id', '$previous_client', '$year_inhabited', '$classification', '$subclass_displaced', 
    '$subclass_doubleup', '$subclass_homeless', '$interview_person', '$last_name', '$first_name', '$middle_name', '$suffix',
    '$barangay', '$purok', '$street', '$gender', '$religion', '$birth_place', '$birth_date', '$person_age', 
    '$marital_status', '$contact_number', '$language_spoken', '$tribe', '$highest_education', 
    '$last_school_name','$year_graduated', '$spouse_name', '$spouse_religion', '$spouse_tribe', '$spouse_age', 
    '$spouse_gender', '$affiliation', '$lot_ownership', '$house_ownership', '$avail_socialized_housing', 
    '$temporary_living_area', '$housing_structure', '$type_of_toilet', '$source_of_water', '$source_of_electricity',
    '$main_income_source', '$work_status', '$work_location_head', '$monthly_salary', '$combine_monthly_income',
    '$skills_for_living', '$specific_skill', '$organization_member', '$specific_organization', '$wanttolearn', ?, '$house_photo_filename', '$file_type', '$remarks',
    '$interviewed_by', '$date_interviewed', '$latitude', '$longitude',
    '$validator_signature_path', '$respondent_signature_path'
)";

// Use prepared statement for BLOB handling
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $house_photo_blob);

if ($stmt->execute()) {
    $survey_id = $stmt->insert_id;

    // Insert household members
    // Debug: Check what's being received
    error_log("POST data for household members: " . print_r($_POST, true));
    
    if (isset($_POST['name']) && is_array($_POST['name'])) {
        $names = $_POST['name'];
        $relationships = $_POST['relationship'];
        $ages = $_POST['age'];
        $civil_statuses = $_POST['civil_status'];
        $educational_attainments = $_POST['educational_attainment'];
        $occupations = $_POST['occupation'];
        $monthly_incomes = $_POST['monthly_income'];
        
        // Debug: Log the household member data
        error_log("Household members found: " . count($names));

        $sql_members = "INSERT INTO household_mem (
            survey_id, name, relationship, age, civil_status, educational_attainment, occupation, monthly_income
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt_members = $conn->prepare($sql_members);

        for ($i = 0; $i < count($names); $i++) {
            $name = sanitize_input($names[$i]);
            $relationship = sanitize_input($relationships[$i]);
            $age = sanitize_input($ages[$i]);
            $civil_status = sanitize_input($civil_statuses[$i]);
            $educational_attainment = sanitize_input($educational_attainments[$i]);
            $occupation = sanitize_input($occupations[$i]);
            $monthly_income = sanitize_input($monthly_incomes[$i]);
            
            // Skip empty entries
            if (empty($name) && empty($relationship) && empty($age)) {
                continue;
            }
            
            // Convert age to integer, default to 0 if empty
            $age = !empty($age) ? (int)$age : 0;

            $stmt_members->bind_param(
                "ississss",
                $survey_id,
                $name,
                $relationship,
                $age,
                $civil_status,
                $educational_attainment,
                $occupation,
                $monthly_income
            );
            $stmt_members->execute();
            if ($stmt_members->error) {
                error_log("Error inserting household member: " . $stmt_members->error);
                echo "Error inserting household member: " . $stmt_members->error;
            } else {
                error_log("Successfully inserted household member: " . $name);
            }
        }
    } 

    header("Location: vdashboard.php");
    exit();
} else {
    echo "Error: " . $stmt->error;
}

$conn->close();
?>
