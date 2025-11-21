<?php
session_start();
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header("Location: admin_login.php"); // Redirect to login page if not logged in
    exit();
}

// Database connection
$servername = "localhost"; // Replace with your database server
$username = "root";        // Replace with your database username
$password = "";            // Replace with your database password
$dbname = "city_housing"; // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}


$sql = "SELECT COUNT(*) AS total_validated FROM survey_response WHERE is_submitted = 1";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
$totalValidated = $row['total_validated'];

$sqlApproved = "SELECT COUNT(*) AS total_approved FROM survey_response WHERE is_submitted = 2";
$resultApproved = $conn->query($sqlApproved);
$rowApproved = $resultApproved->fetch_assoc();
$totalApproved = $rowApproved['total_approved'];

$barangayData = [];
$sqlBarangay = "SELECT barangay, COUNT(*) AS count 
                FROM survey_response 
                WHERE is_submitted = 1 OR is_submitted = 2
                GROUP BY barangay";
$resultBarangay = $conn->query($sqlBarangay);
while ($row = $resultBarangay->fetch_assoc()) {
    $barangayData[] = $row;
}

$classifications = ['Homeless', 'Displaced', 'Double-up', 'Upgrading_of_Land_Tenure'];
$classificationData = [];
foreach ($classifications as $classification) {
    $sql = "SELECT barangay, COUNT(*) AS count 
            FROM survey_response 
            WHERE classification = '$classification' AND is_submitted = 1 OR is_submitted = 2   
            GROUP BY barangay";
    $result = $conn->query($sql);
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[$row['barangay']] = (int)$row['count'];
    }
    $classificationData[$classification] = $data;
}
// Fetch Subclass Displaced Data
$subclassDisplacedData = [];
$sqlSubclassDisplaced = "SELECT barangay, subclass_displaced, COUNT(*) AS count 
                        FROM survey_response 
                        WHERE subclass_displaced != '' AND is_submitted = 1 OR is_submitted = 2
                        GROUP BY barangay, subclass_displaced";
$resultSubclassDisplaced = $conn->query($sqlSubclassDisplaced);
while ($row = $resultSubclassDisplaced->fetch_assoc()) {
    $subclassDisplacedData[] = $row;
}

// Fetch Subclass Double-Up Data
$subclassDoubleUpData = [];
$sqlSubclassDoubleUp = "SELECT barangay, subclass_doubleup, COUNT(*) AS count 
                        FROM survey_response 
                        WHERE subclass_doubleup != '' AND is_submitted = 1 OR is_submitted = 2
                        GROUP BY barangay, subclass_doubleup";
$resultSubclassDoubleUp = $conn->query($sqlSubclassDoubleUp);
while ($row = $resultSubclassDoubleUp->fetch_assoc()) {
    $subclassDoubleUpData[] = $row;
}


// Pass data to JavaScript
echo "<script>
    const barangayData = " . json_encode($barangayData) . ";
    const classificationData = " . json_encode($classificationData) . ";
     const subclassDisplacedData = " . json_encode($subclassDisplacedData) . ";
    const subclassDoubleUpData = " . json_encode($subclassDoubleUpData) . ";
    console.log('classificationData:', classificationData); // Debugging line
</script>";
?>


<!DOCTYPE html>
<html lang="en">
<head>
    
    <!-- Metadata and links for external stylesheets and icons -->
    <meta charset="UTF-8" />
    <title>Dashboard</title>
    <link rel="stylesheet" href="dashboard.css"/>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>

</head>
<body>

    <!-- Sidebar container -->
    <div class="sidebar">
        <!-- Logo section -->
        <div class="logo"></div>
        <!-- Sidebar menu list -->
        <ul class="menu">

            <li class="active">
                <a href="#">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
            </li> 
            <li>
                <a href="beneficiaries_list.php">
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
                <span>ChoDaMs</span>
                <h2>Dashboard</h2>
            </div>
            <!-- User information section -->
            <div class="user--info"> 
            <!--<div class="notification-icon">
                    <i class="fas fa-bell"></i>
                    <span class="badge">3</span>
                </div>-->                
                <img src="images/cityhall.jpg" alt=""/>
            </div>
        </div>

        <!-- Card container displaying demographics summary -->
        <div class="report--container">
        <h3 class="main--title">Decriptive Report</h3>
            <div class="card--wrapper">
                <div class="payment--card light-red" id="barangayCard"> 
                    <div class="card--header">
                        <div class="amount">
                            <span class="title">
                                Barangay                            
                            </span>
                            <span class="amount--value">
                            </span>
                        </div>  
                        <i class="fas fa-people-roof icon"></i>
                    </div>
                    <span class="card-detail">...</span>
                </div>

                <div class="payment--card light-purple" id="classificationCard">
                    <div class="card--header">
                        <div class="amount">
                            <span class="title">
                                Classification of ISF                           
                            </span>
                            <span class="amount--value">
                            </span>
                        </div>
                        <i class="fas fa-users icon"> </i>
                    </div>
                    <span class="card-detail">
                        ...
                    </span>
                </div>

                <div class="payment--card light-blue">
                    <div class="card--header">
                        <div class="amount">
                            <span class="title">
                                Total Validated                               
                            </span>
                            <span class="amount--value">
                                <?php echo $totalValidated; ?>
                            </span>
                        </div>
                        <i class="fas fa-user-check icon"> </i>
                    </div>
                    <span class="card-detail">
                        ...
                    </span>
                </div>

                <div class="payment--card light-green">
                    <div class="card--header">
                        <div class="amount">
                            <span class="title">
                                Total Approved                            
                            </span>
                            <span class="amount--value">
                            <?php echo $totalApproved; ?> 
                            </span>
                        </div>
                        <i class="fas fa-user-check icon"> </i>
                    </div>
                    <span class="card-detail">
                        ...
                    </span>
                </div>
                <!-- Additional cards omitted for brevity -->
                
            </div>
        </div>   
       
        <!-- Graphs --> 
        <div class="graph--container">
            <div class="firstGraph">
                <div class= "box">  
                    <canvas id="barangayGraph"></canvas>
                    <div class="chart-legend" id="barangayLegend"></div> <!-- Legend container -->
                    <p id="barangayDescription">Report will appear here...</p>
                </div>
            </div>
        </div>
        
        <div class="graph--container">
            <div class="secondGraph" id="graphContainer" style="display: none;"> 
                    <div class= "box">
                        <canvas id="classificationGraph"></canvas>
                    </div>
            </div>
        </div>
        <div class="graph--container" id="graph">
            <div class="thirdGraph"> 
                <canvas id="subclass_displacedGraph"></canvas>
            </div>
        </div>

        <div class="graph--container" id="graph">
            <div class="fourthGraph"> 
                <canvas id="subclass_doubleupGraph"></canvas>
            </div>
        </div>
        
    </div>  
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
    <script src = "dashboard.js"></script>
</body>
</html>