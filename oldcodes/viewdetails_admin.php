<?php
session_start();
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header("Location: admin.php"); // Redirect to login page if not logged in
    exit();
}
// Database connection
$servername = "localhost"; // Replace with your database server
$username = "root";        // Replace with your database username
$password = "";            // Replace with your database password
$dbname = "city_housing";  // Replace with your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Fetch data from survey_response table
$survey_id = isset($_GET['survey_id']) ? intval($_GET['survey_id']) : 0;

// Retrieve detailed data for the given survey_id
$sql = "SELECT * FROM survey_response WHERE survey_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $survey_id);
$stmt->execute();
$result = $stmt->get_result();
$data = $result->fetch_assoc();
$stmt->close();

// Fetch household members for this survey
$member_sql = "SELECT * FROM household_mem WHERE survey_id = ? ORDER BY id";
$member_stmt = $conn->prepare($member_sql);
$member_stmt->bind_param("i", $survey_id);
$member_stmt->execute();
$member_result = $member_stmt->get_result();
$household_members = [];
while ($member = $member_result->fetch_assoc()) {
    $household_members[] = $member;
}
$member_stmt->close();
$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Survey Details</title>
    <link rel="stylesheet" href="try.css"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>

</head>
<body>
    <div class="container">
        <h2>Survey Form Details</h2>
        <table class="demographic-table">
            <tr> 
                <td  >
                    <strong>Is this a previous client?:</strong>
                    <td class="empty-cell"><?= $data['previous_client'] ?? '' ?></td>
                </td>
                <td>
                    <strong>Year inhabited the Place:</strong>
                    <td class="empty-cell"><?= $data['year_inhabited'] ?? '' ?></td>
                </td>
            </tr>
        </table>
        <!-- Section 1: Classification -->
        <div class="section-title">I. Classification of Informal Settler Families</div>
        <table class="demographic-table">
            <tr> 
                <td  >
                    <strong >Classification: </strong>
                    <td class="empty-cell"><?= $data['classification'] ?? '' ?></td>
                </td>
                <td>
                    <strong>Sub-class:</strong>
                    <td class="empty-cell"><?= $data['subclass_displaced'] ?? $data['subclass_doubleup'] ?? ''?></td>
                </td>
            </tr>
        </table>
        <!-- Section 2: Demographic -->
        <div class="section-title">II. DEMOGRAPHIC INFORMATION</div>
<table>
    <!-- Header Row -->
    <tr>
        <td class="label-cell">Last Name</td>
        <td class="label-cell">First Name</td>
        <td class="label-cell">Middle Name</td>
        <td class="label-cell">Suffix</td>
    </tr>
    <!-- Row 1 -->
    <tr>
        <td class="empty-cell"><?= $data['last_name'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['first_name'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['middle_name'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['suffix'] ?? '' ?></td>
    </tr>
    <!-- Address Row -->
    <tr>
        <td class="label-cell">House Number/Lot/Block/Street</td>
        <td class="label-cell">Sitio/Purok</td>
        <td class="label-cell">Barangay</td>
        <td class="label-cell">Sex</td>
    </tr>
    <tr>
        <td class="empty-cell"><?= $data['street'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['purok'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['barangay'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['gender'] ?? '' ?></td>
    </tr>
    <!-- Additional Info Row -->
    <tr>
        <td class="label-cell">Religion</td>
        <td class="label-cell">Place of Birth</td>
        <td class="label-cell">Date of Birth</td>
        <td class="label-cell">Age</td>
    </tr>
    <tr>
        <td class="empty-cell"><?= $data['religion'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['birth_place'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['birth_date'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['person_age'] ?? '' ?></td>
    </tr>
    <tr>
        <td class="label-cell">Marital Status</td>
        <td class="label-cell">Contact Number</td>
        <td class="label-cell">Language Spoken</td>
        <td class="label-cell">Tribe</td>
    </tr>
    <tr>
        <td class="empty-cell"><?= $data['marital_status'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['contact_number'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['language_spoken'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['tribe'] ?? '' ?></td>
    </tr>
    <tr>
        <td class="label-cell">Highest Educational Attainment</td>
        <td class="label-cell">Name of the School Last Attended</td>
        <td class="label-cell">Year Graduated</td>
        <td class="label-cell"></td>
    </tr>
    <tr>
        <td class="empty-cell"><?= $data['highest_education'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['last_school_name'] ?? '' ?></td>
        <td class="empty-cell"><?= $data['year_graduated'] ?? '' ?></td>
    </tr>
</table>

    
        <!-- Spouse Information -->
        <div class="spouse-section">
            <div class="section-title">SPOUSE INFORMATION</div>
            <table>
                <tr>
                    <td class="label-cell">Spouse Name</td>
                    <td class="label-cell">Religion</td>
                    <td class="label-cell">Ethnicity/Tribe</td>
                    <td class="label-cell">Age</td>
                    <td class="label-cell">Sex</td>
                </tr>
                <tr>
                    <td class="empty-cell"><?= $data['spouse_name'] ?? '' ?></td>
                    <td class="empty-cell"><?= $data['spouse_religion'] ?? '' ?></td>
                    <td class="empty-cell"><?= $data['spouse_tribe'] ?? '' ?></td>
                    <td class="empty-cell"><?= $data['spouse_age'] ?? '' ?></td>   
                    <td class="empty-cell"><?= $data['spouse_gender'] ?? '' ?></td>
                </tr>
            </table>
        </div>

        <!-- Affiliation Section -->
        <div class="affiliation">
            <div class="section-title">AFFILIATION</div>
            <table>
                <tr>
                    <td class="empty-cell"><?= $data['affiliation'] ?? '' ?></td>
                </tr>   
            </table>
        </div>

        <!-- Members of the Household Table -->
        <div class="section-title">MEMBERS OF THE HOUSEHOLD 
            <?php if (!empty($household_members)): ?>
                <span style="font-size: 14px; color: #666;">(<?= count($household_members) ?> member<?= count($household_members) > 1 ? 's' : '' ?>)</span>
            <?php endif; ?>
        </div>
        <table class="demographic-table">
            <tr>
                <th>Name (First, M.I, Last)</th>
                <th>Age</th>
                <th>Relationship to the Head of Household</th>
                <th>Civil Status</th>
                <th>Educational Attainment</th>
                <th>Occupation</th>
                <th>Monthly Income</th>
            </tr>
            <?php if (!empty($household_members)): ?>
                <?php foreach ($household_members as $member): ?>
                <tr>
                    <td class="empty-cell"><?= htmlspecialchars($member['name'] ?? '') ?></td>
                    <td class="empty-cell"><?= htmlspecialchars($member['age'] ?? '') ?></td>
                    <td class="empty-cell"><?= htmlspecialchars($member['relationship'] ?? '') ?></td>
                    <td class="empty-cell"><?= htmlspecialchars($member['civil_status'] ?? '') ?></td>
                    <td class="empty-cell"><?= htmlspecialchars($member['educational_attainment'] ?? '') ?></td>
                    <td class="empty-cell"><?= htmlspecialchars($member['occupation'] ?? '') ?></td>
                    <td class="empty-cell"><?= htmlspecialchars($member['monthly_income'] ?? '') ?></td>
                </tr>
                <?php endforeach; ?>
            <?php else: ?>
                <tr>
                    <td class="empty-cell" colspan="7">No household members found.</td>
                </tr>
            <?php endif; ?>
        </table>

        <!-- Household Information Section -->
        <div class="section-title">III. HOUSEHOLD INFORMATION</div>
            <table class="demographic-table">
                <!-- Ownership and Structure -->
                <tr>
                    <!-- Column Headers -->
                    <td class="label-cell">Do you own the lot where your house is situated? (Yes/No)</td>
                    <td class="label-cell">Do you live in a temporary dwelling? (e.g., tent, cart)(Yes/No)</td>
                    <td class="label-cell">Do you own the house that you are living in? (Yes/No)</td>
                    <td class="label-cell">Did you previously avail of socialized housing? (Yes/No)</td>
                </tr>
                <tr>
                    <!-- Checkboxes Row -->
                    <td class="empty-cell">
                    <?= $data['lot_ownership'] ?? '' ?>
                    </td>
                    <td class="empty-cell">
                    <?= $data['house_ownership'] ?? '' ?>
                    </td>
                    <td class="empty-cell">
                    <?= $data['avail_socialized_housing'] ?? '' ?>
                    </td>
                    <td class="empty-cell">
                    <?= $data['temporary_living_area'] ?? '' ?>
                    </td>
                </tr>
                <!-- House Structure -->
                <table>
                    <tr>
                        <td class="label-cell">House Structure</td>
                        <td class="label-cell">Type of Toilet</td>
                        <td class="label-cell">Source of Water</td>
                        <td class="label-cell">Source of Electricity</td>
                    </tr>
                    <tr>
                        <td class="empty-cell">
                        <?= $data['housing_structure'] ?? '' ?>
                        </td>
                        <td class="empty-cell">
                        <?= $data['type_of_toilet'] ?? '' ?>
                        </td>
                        <td class="empty-cell">
                        <?= $data['source_of_water'] ?? '' ?>
                        </td> 
                        <td class="empty-cell">
                        <?= $data['source_of_electricity'] ?? '' ?>
                        </td> 
                    </tr>
                 </table> 
            </table> 
            
        <!-- Economic Aspect Section -->
        <div class="section-title">IV. ECONOMIC ASPECT</div>
        <table class="demographic-table">
            <!-- Column Headers -->
            <tr>
                <td class="label-cell">Household Head Main Source of Income</td>
                <td class="label-cell">Work Status</td>
                <td class="label-cell">Work Location (Household Head)</td>
                <td class="label-cell">Household Head Monthly Salary/Income(Numbers Only)</td>
                <td class="label-cell">Combined Household Income (Numbers Only)</td>
            </tr>
            <!-- Input Fields and Checkboxes Row -->
            <tr>
                <!-- Main Source of Income -->
                <td class="empty-cell">
                <?= $data['main_income_source'] ?? '' ?>
                </td>

                <!-- Work Status -->
                <td class="empty-cell">
                <?= $data['work_status'] ?? '' ?>
                </td>

                <!-- Work Location -->
                <td class="empty-cell">
                <?= $data['work_location_head'] ?? '' ?>
                </td>

                <!-- Monthly Salary -->
                <td class="empty-cell">
                <?= $data['monthly_salary'] ?? '' ?>
                </td>

                <!-- Combined Household Income -->
                <td class="empty-cell">
                <?= $data['combine_monthly_income'] ?? '' ?>
                </td>
            </tr>
        </table>


        <!-- Training Needs Assessment and Organization Membership Section -->
        <div class="section-title">V. TRAINING NEEDS ASSESSMENT AND ORGANIZATION MEMBERSHIP</div>
        <table class="demographic-table">
            <!-- Column Headers -->
            <tr>
                <td class="label-cell">Is there any skill that can be used for a living? (Yes/No)</td>
                <td class="label-cell">If there is any, what is it?</td>
                <td class="label-cell">What are the skills you want to learn?</td>
                <td class="label-cell">Are you a member of any organization/association in your community? (Yes/No)</td>
                <td class="label-cell">If member, what organization/association is it?</td>
            </tr>
            <!-- Input Fields and Checkboxes Row -->
            <tr>
                <!-- Skill for Living -->
                <td class="empty-cell"><?= $data['skills_for_living'] ?? '' ?></td>
                <td class="empty-cell"><?= $data['specific_skill'] ?? '' ?></td>
                <td class="empty-cell"><?= $data['wanttolearn'] ?? '' ?></td>
                <td class="empty-cell"><?= $data['organization_member'] ?? '' ?></td>
                <td class="empty-cell"><?= $data['specific_organization'] ?? '' ?></td>
            </tr>
        </table>

        <!-- Remarks Section -->
        <div class="section-title">Remarks</div>
        <table style="width: 100%; border: 1px solid #000; border-collapse: collapse;">
            <tr>
                <td style="height: 80px; padding: 10px; vertical-align: top;">
                <?= $data['remarks'] ?? '' ?>
                    <span id="remarksContent"></span>
                </td>
            </tr>
        </table>

        <!-- Certification Section -->
        <table>
            <tr>
                <td colspan="4">
                    <em>    
                        I hereby certify that the above statement and information 
                        are true and correct to the best of my knowledge. I further 
                        understand that any misrepresentation and/or deliberate omission 
                        of facts and information contained herein shall constitute ground 
                        for my disqualification. I voluntarily and freely consent to the collection 
                        and processing of the above personal information only in relation to the Data Privacy Act.
                    </em>
                </td>
            </tr>
        </table>
        <table class="demographic-table">
            <tr> 
                <td  >
                    <strong>Interviewed by:</strong>
                    <td class="empty-cell"><?= $data['interviewed_by'] ?? '' ?></td>
                </td>
                <td>
                    <strong>Date Interviewed:</strong>
                    <td class="empty-cell"><?= $data['date_interviewed'] ?? '' ?></td>
                </td>
            </tr>
        </table>

        <!-- Note -->
        <div class="note">
            Note: Ask the respondent if he/she has existing property or housing loan.
        </div>
    </div>
    <div class="btn-container">
        <a href="approve_survey.php?survey_id=<?php echo $survey_id; ?>" class="btn">Approve</a>
            <a href="beneficiaries_list.php" class="btn">Back to Survey List</a>
            <button class="btn btn-print" onclick="window.print()">Print</button>
            <button class="btn" onclick="toggleHouseInfo()">
                <i class="fas fa-home"></i> Show House Picture & Location
            </button>
        </div>
        <div id="houseInfo" style="display: none; margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">
    <?php if (!empty($data['house_photo'])): ?>
        <p><strong>House Photo:</strong></p>
        <img src="display_image.php?id=<?= $survey_id ?>" alt="House Photo" style="width: 100%; max-width: 500px; border: 1px solid #ccc; padding: 5px;"><br><br>
        <?php if (!empty($data['house_photo_filename'])): ?>
            <p><strong>Filename:</strong> <?= htmlspecialchars($data['house_photo_filename']) ?></p>
        <?php endif; ?>
    <?php else: ?>
        <p><i class="fas fa-image" style="color: #6c757d;"></i> No house photo uploaded.</p>
    <?php endif; ?>

    <?php if (!empty($data['latitude']) && !empty($data['longitude'])): ?>
    <p><strong>House Location:</strong></p>
    <p><strong>Coordinates:</strong> <?= number_format($data['latitude'], 6) ?>, <?= number_format($data['longitude'], 6) ?></p>
    <p><a href="https://www.google.com/maps?q=<?= $data['latitude'] ?>,<?= $data['longitude'] ?>" target="_blank" style="color: #007bff; text-decoration: none;">
        <i class="fas fa-external-link-alt"></i> Open in Google Maps
    </a></p>
    <div id="map" style="height: 400px; width: 100%; max-width: 600px; border: 1px solid #ccc;"></div>

    <!-- Leaflet CSS and JS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <script>
        document.addEventListener("DOMContentLoaded", function () {
            const location = [<?= $data['latitude'] ?>, <?= $data['longitude'] ?>];
            const map = L.map('map').setView(location, 18); // Zoom 18 for street level
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            L.marker(location).addTo(map).bindPopup("House Location").openPopup();
        });
    </script>
<?php else: ?>
    <p><i class="fas fa-map-marker-alt" style="color: #6c757d;"></i> Location not available.</p>
<?php endif; ?>
</div>
    </div>
    <script>
    function toggleHouseInfo() {
        const info = document.getElementById("houseInfo");
        if (info.style.display === "none") {
            info.style.display = "block";
        } else {
            info.style.display = "none";
        }
    }
</script>
</body>
</html>