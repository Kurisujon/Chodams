<?php
session_start();
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header("Location: admin_login.php"); // Redirect to login page if not logged in
    exit();
}

// Database connection
$servername = "localhost";  // Change if necessary
$username = "root";         // Database username
$password = "";             // Database password
$dbname = "city_housing";  // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Fetch pending validators
$id = 1; 
$admin_query = "SELECT username, email FROM admin WHERE id = $id";
$admin_result = $conn->query(query: $admin_query);
$admin = $admin_result->fetch_assoc();

// Fetch Validators (Employees) Data
$validator_query = "SELECT username, email, name FROM validator";
$validator_result = $conn->query($validator_query);
?>
<!DOCTYPE html>
    <html lang="en">
    <head>
        
        <!-- Metadata and links for external stylesheets and icons -->
        <meta charset="UTF-8" />
        <title>Validators</title>
        <link rel="stylesheet" href="validators_applications.css" />

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
                <li>
                    <a href="beneficiaries_list.php">
                        <i class="fas fa-clipboard-list"></i>
                        <span>Benificaries</span>
                    </a>
                </li>   
                <li class="active">
                    <a href="#">
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
                    <h2>Profile</h2>
                </div>
                
                <!-- User information section -->
                <div class="user--info">   
                    <img src="images/greenlogo1.jpg" alt=""/>
                </div>
            </div>

            <!-- Card container displaying demographics summary -->
            <div class="profile--container">
                <div class="profile-card">
                    <div class="profile-header">
                    <h2><?php echo htmlspecialchars($admin['username']); ?></h2>
                    </div>
                    <div class="contact-options">
                        <strong class="label">Email</strong>
                        <div class="contact-option">
                            <div class="icon email-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="contact-info">
                            <p><?php echo htmlspecialchars($admin['email']); ?></p>
                            </div>
                        </div>
                        <strong class="label">Password</strong>
                        <div class="contact-option">
                            <div class="icon facebook-icon">
                                <i class="fas fa-lock"></i>
                            </div>
                            <div class="contact-info">
                                <p>********</p>
                            </div>
                        </div>
                        <div>
                           <!-- Edit Profile Button -->
                            <a href="editadminprofile.php">
                            <button>Edit Profile</button>
                        </div>
                    </div>
                </div>
            </div>
            
            
            <div class="card--container">
            <h1>Employees</h1>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Username</th>
                            <th>E-mail</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while ($validator = $validator_result->fetch_assoc()) { ?>
                            <tr>
                                <td class="name-cell"><?php echo htmlspecialchars($validator['name']); ?></td>
                                <td><?php echo htmlspecialchars($validator['username']); ?></td>
                                <td><?php echo htmlspecialchars($validator['email']); ?></td>
                            </tr>
                        <?php } ?>
                    </tbody>
                </table>    
            </div>
            <br>
            <div>
                 <!-- Edit Profile Button -->
                <a href="validator_signup.html">
                <div>Create Account</div>
            </div>
        </div> 
           
            
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
        <script src = "validators_applications.js"></script>
    </body>
    </html>