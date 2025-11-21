<?php
session_start();
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header("Location: admin_login.php");
    exit();
}

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "city_housing";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Function to calculate points based on classification and subclass
function calculatePoints($classification, $subclass_displaced, $subclass_doubleup, $subclass_homeless = null) {
    $points = 0;
    
    switch ($classification) {
        case 'Displaced':
            switch ($subclass_displaced) {
                case 'Coastal Areas':
                    $points = 1;
                    break;
                case 'Sea Level Rise':
                    $points = 1;
                    break;
                case 'Drought':
                    $points = 1;
                    break;
                case 'Earthquake Affected':
                    $points = 3;
                    break;
                case 'Landslide Affected':
                    $points = 3;
                    break;
                case 'Flood Affected':
                    $points = 3;
                    break;
                case 'Threat of Eviction':
                    $points = 1;
                    break;
                case 'Eviction/Demolition Order':
                    $points = 3;
                    break;
                case 'Human Induced Disaster':
                    $points = 4;
                    break;
                case 'Infra Projects':
                    $points = 4;
                    break;
                case 'Near Waterways':
                    $points = 1;
                    break;
                default:
                    $points = 0;
            }
            break;
            
        case 'Double-up':
        case 'Double-Up':
        case 'Doubled-up':
            switch ($subclass_doubleup) {
                case 'Renter/Tenant':
                    $points = 6;
                    break;
                case 'Rent-free/Sharer':
                    $points = 7;
                    break;
                case 'Caretaker':
                    $points = 3;
                    break;
                default:
                    $points = 0;
            }
            break;
            
        case 'Homeless':
            switch ($subclass_homeless) {
                case 'Public - living in tent':
                    $points = 30;
                    break;
                case 'Private - living in tent':
                    $points = 20;
                    break;
                default:
                    $points = 30; // Default to public living in tent (highest priority)
            }
            break;
            
        case 'Upgrading_of_Land_Tenure':
        case 'Upgrading of Land Tenure':
        case 'upgrading':
            $points = 10;
            break;
            
        default:
            $points = 0;
    }
    
    return $points;
}

$limit = 10;

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $limit;

$approvedPage = isset($_GET['approved_page']) ? (int)$_GET['approved_page'] : 1;
$approvedOffset = ($approvedPage - 1) * $limit;

// Fetch validated beneficiaries with points calculation
$searchQuery = isset($_GET['search']) ? $_GET['search'] : '';
$sql = "SELECT *, 
        CASE 
    WHEN classification = 'Displaced' THEN
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
    WHEN classification IN ('Double-up', 'Double-Up', 'Doubled-up') THEN
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
    WHEN classification IN ('Upgrading_of_Land_Tenure', 'Upgrading of Land Tenure', 'upgrading') THEN 10
    ELSE 0
END 
+
CASE 
    WHEN combine_monthly_income = '0 - 2,999 PHP' THEN 30
    WHEN combine_monthly_income = '3,000 - 5,999 PHP' THEN 25
    WHEN combine_monthly_income = '6,000 - 8,999 PHP' THEN 20
    WHEN combine_monthly_income = '9,000 - 12,999_PHP' THEN 15
    WHEN combine_monthly_income = '13,000 and above' THEN 10
    ELSE 0
END 
+
-- Household Information
CASE 
    -- Lot Ownership (20%)
    WHEN lot_ownership = 'Yes' THEN 20
    WHEN lot_ownership = 'No' THEN 0
    ELSE 0
END
+
CASE 
    -- House Ownership (30%)
    WHEN house_ownership = 'Yes' THEN 30
    WHEN house_ownership = 'No' THEN 0
    ELSE 0
END
+
CASE 
    -- Temporary Dwelling (50%)
    WHEN temporary_living_area = 'Yes' THEN 50
    WHEN temporary_living_area = 'No' THEN 0
    ELSE 0
END
+
CASE 
    -- Socialized Housing (0%)
    WHEN avail_socialized_housing = 'Yes' THEN 0
    WHEN avail_socialized_housing = 'No' THEN 0
    ELSE 0
END
+
CASE 
    -- Housing Structure
    WHEN housing_structure = 'Full_Concrete' THEN 3
    WHEN housing_structure = 'Made_of_wood_and_metal_roof' THEN 15
    WHEN housing_structure = 'Made_of_Amakan_and_Nipa' THEN 25
    WHEN housing_structure = 'Combination_of_concrete_and_wood' THEN 10
    WHEN housing_structure = 'Made_of_Amakan_and_metal_roof' THEN 15
    WHEN housing_structure = 'Others' THEN 2
    ELSE 0
END
+
CASE 
    -- Type of Toilet
    WHEN type_of_toilet = 'Water_Sealed' THEN 20
    WHEN type_of_toilet = 'Open_Pit/Antipolo' THEN 30
    WHEN type_of_toilet = 'No_Toilet' THEN 40
    WHEN type_of_toilet = 'Others' THEN 10
    ELSE 0
END
+
CASE 
    -- Source of Water
    WHEN source_of_water = 'NAWASA' THEN 4
    WHEN source_of_water = 'Deep_Well' THEN 15
    WHEN source_of_water = 'Spring' THEN 20
    WHEN source_of_water = 'Rainwater' THEN 25
    WHEN source_of_water = 'Surface_Water' THEN 30
    WHEN source_of_water = 'Others' THEN 6
    ELSE 0
END
+
CASE 
    -- Source of Electricity
    WHEN source_of_electricity = 'With_own_meter' THEN 15
    WHEN source_of_electricity = 'Tapping_to_the_neighbor' THEN 25
    WHEN source_of_electricity = 'Solar_Panel' THEN 20
    WHEN source_of_electricity = 'Candle/Lamp' THEN 30
    WHEN source_of_electricity = 'Others' THEN 10
    ELSE 0
END

AS points

        FROM survey_response WHERE is_submitted = 1";

if (!empty($searchQuery)) {
    $sql .= " AND (last_name LIKE '%$searchQuery%' OR barangay LIKE '%$searchQuery%' OR classification LIKE '%$searchQuery%')";
}
$sql .= " ORDER BY points DESC, 
    CASE classification
        WHEN 'Homeless' THEN 1
        WHEN 'Displaced' THEN 2
        WHEN 'Double-up' OR 'Double-Up' OR 'Doubled-up' THEN 3
        WHEN 'Upgrading_of_Land_Tenure' OR 'Upgrading of Land Tenure' OR 'upgrading' THEN 4
        ELSE 5
    END 
    LIMIT $limit OFFSET $offset";

$result = $conn->query($sql);
$beneficiaries = $result->fetch_all(MYSQLI_ASSOC);

// Fetch approved beneficiaries with points calculation
$approvedSearchQuery = isset($_GET['approved_search']) ? $_GET['approved_search'] : '';
$approvedSql = "SELECT *, 
        CASE 
            WHEN classification = 'Displaced' THEN
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
            WHEN classification = 'Double-up' OR classification = 'Double-Up' OR classification = 'Doubled-up' THEN
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
            WHEN classification = 'Upgrading_of_Land_Tenure' OR classification = 'Upgrading of Land Tenure' OR classification = 'upgrading' THEN 10
            ELSE 0
        END as points
        FROM survey_response WHERE is_submitted = 2";

if (!empty($approvedSearchQuery)) {
    $approvedSql .= " AND (last_name LIKE '%$approvedSearchQuery%' OR barangay LIKE '%$approvedSearchQuery%' OR classification LIKE '%$approvedSearchQuery%')";
}
$approvedSql .= " ORDER BY points DESC, 
    CASE classification
        WHEN 'Homeless' THEN 1
        WHEN 'Displaced' THEN 2
        WHEN 'Double-up' OR 'Double-Up' OR 'Doubled-up' THEN 3
        WHEN 'Upgrading_of_Land_Tenure' OR 'Upgrading of Land Tenure' OR 'upgrading' THEN 4
        ELSE 5
    END 
    LIMIT $limit OFFSET $approvedOffset";

$approvedResult = $conn->query($approvedSql);
$approvedBeneficiaries = $approvedResult->fetch_all(MYSQLI_ASSOC);

$totalValidated = $conn->query("SELECT COUNT(*) as count FROM survey_response WHERE is_submitted = 1")->fetch_assoc()['count'];
$totalApproved = $conn->query("SELECT COUNT(*) as count FROM survey_response WHERE is_submitted = 2")->fetch_assoc()['count'];

$totalPagesValidated = ceil($totalValidated / $limit);
$totalPagesApproved = ceil($totalApproved / $limit);
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    
    <!-- Metadata and links for external stylesheets and icons -->
    <meta charset="UTF-8" />
    <title>Beneficiaries</title>
    <link rel="stylesheet" href="beneficiaries.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
</head>
<body>

    <!-- Sidebar container -->
    <div class="sidebar">
        <!-- Logo section -->
        <div class="logo"></div>
        <!-- Sidebar menu list -->
        <ul class="menu">

            <li>
                <a href="dashboard.php">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
            </li> 
            <li class="active">
                <a href="#">
                    <i class="fas fa-clipboard-list"></i>
                    <span>Benificaries</span>
                </a>
            </li>   
            <li>
                <a href="validators_applications.php">
                    <i class="fas fa-user"></i>
                    <span>Profile</span>
                </a>
            </li>   
            <li>
                <a href="about.html">
                    <i class="fas fa-question-circle"></i>
                    <span>About</span>
                </a>
            </li>     
            <li class="logout">
                <a href="logout.php">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Log Out</span>
                </a>
            </li>                       
        </ul>

    </div>

    <!-- Main content container -->
    <div class="main--content">
        <!-- Header section -->
        <div class="header--wrapper">
            <div class="header--title">
                <h2>Beneficaries</h2>
            </div>
            <!-- User information section -->
            <div class="user--info">    
                <div class="user--info">   
                    <img src="images/greenlogo1.jpg" alt=""/>
                </div>
                
            </div>
        </div>  

        <!-- Point System Legend -->
        <div class="point-system-legend">
            <h3>Point System Guide</h3>
            <div class="legend-grid">
                <div class="legend-section">
                    <h4>Displaced (25% total)</h4>
                    <ul>
                        <li>Coastal Areas, Sea Level Rise, Drought, Threat of Eviction, Near Waterways: 1 point</li>
                        <li>Earthquake Affected, Landslide Affected, Flood Affected, Eviction/Demolition Order: 3 points</li>
                        <li>Human Induced Disaster, Infra Projects: 4 points</li>
                    </ul>
                </div>
                <div class="legend-section">
                    <h4>Double-up (15% total)</h4>
                    <ul>
                        <li>Renter/Tenant: 6 points</li>
                        <li>Rent-free/Sharer: 7 points</li>
                        <li>Caretaker: 3 points</li>
                    </ul>
                </div>
                <div class="legend-section">
                    <h4>Homeless (50% total)</h4>
                    <ul>
                        <li>Public - living in tent: 30 points</li>
                        <li>Private - living in tent: 20 points</li>
                    </ul>
                </div>
                <div class="legend-section">
                    <h4>Upgrading of Land Tenure (10%)</h4>
                    <ul>
                        <li>Upgrading of Land Tenure: 10 points</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Table section for displaying finance data -->
        <div class="tabular--wrapper">
        <form class="search--box" method="get" action="">
            <i class="fa-solid fa-search"></i>
            <input type="text" name="search" placeholder="Search" value="<?php echo htmlspecialchars($searchQuery); ?>">
            <button type="submit">Search</button>
        </form>
        <h3 class="main--title">Validated Beneficiaries</h3>
        <div class="table--container">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Barangay</th>
                        <th>Surname</th>
                        <th>Classification of ISF</th>
                        <th>Sub-Class Displaced</th>
                        <th>Sub-Class Double Up</th>
                        <th>Sub-Class Homeless</th>
                        <th>Points</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                <?php if (count($beneficiaries) > 0): ?>
                    <?php foreach ($beneficiaries as $beneficiary): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($beneficiary['date_interviewed']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['barangay']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['last_name']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['classification']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['subclass_displaced']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['subclass_doubleup']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['subclass_homeless']); ?></td>
                            <td class="points-cell"><?php echo $beneficiary['points']; ?></td>
                            <td><a href="viewdetails_admin.php?survey_id=<?php echo $beneficiary['survey_id']; ?>" class="view-btn">View Details</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="9">No results found.</td>
                    </tr>
                <?php endif; ?>
                </tbody>
            </table>
            <div class="pagination">
    <?php for ($i = 1; $i <= $totalPagesValidated; $i++): ?>
        <a href="?page=<?php echo $i; ?><?php echo !empty($searchQuery) ? '&search=' . urlencode($searchQuery) : ''; ?>" 
           class="<?php echo $i == $page ? 'active' : ''; ?>">
            <?php echo $i; ?>
        </a>
    <?php endfor; ?>
</div>
        </div>
    </div>


    <div class="tabular--wrapper">
    <form class="search--box" method="get" action="">
        <i class="fa-solid fa-search"></i>
        <input type="text" name="approved_search" placeholder="Search Approved" value="<?php echo htmlspecialchars($approvedSearchQuery); ?>">
        <button type="submit">Search</button>
    </form>
    <h3 class="main--title">Approved Beneficiaries</h3>
    <div class="table--container">
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Barangay</th>
                    <th>Surname</th>
                    <th>Classification of ISF</th>
                    <th>Sub-Class Displaced</th>
                    <th>Sub-Class Double Up</th>
                    <th>Sub-Class Homeless</th>
                    <th>Points</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php if (count($approvedBeneficiaries) > 0): ?>
                    <?php foreach ($approvedBeneficiaries as $beneficiary): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($beneficiary['date_interviewed']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['barangay']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['last_name']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['classification']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['subclass_displaced']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['subclass_doubleup']); ?></td>
                            <td><?php echo htmlspecialchars($beneficiary['subclass_homeless']); ?></td>
                            <td class="points-cell"><?php echo $beneficiary['points']; ?></td>
                            <td><a href="viewdetails_admin.php?survey_id=<?php echo $beneficiary['survey_id']; ?>" class="view-btn">View Details</a></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="9">No approved beneficiaries found.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
        <div class="pagination">
    <?php for ($i = 1; $i <= $totalPagesApproved; $i++): ?>
        <a href="?approved_page=<?php echo $i; ?><?php echo !empty($approvedSearchQuery) ? '&approved_search=' . urlencode($approvedSearchQuery) : ''; ?>" 
           class="<?php echo $i == $approvedPage ? 'active' : ''; ?>">
            <?php echo $i; ?>
        </a>
    <?php endfor; ?>
</div>
    </div>
</div>

        
    </div>  
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
    <script src = "beneficiaries.js"></script>
</body>
</html> 