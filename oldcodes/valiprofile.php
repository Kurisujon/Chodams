<?php
session_start(); // Start the session

// Check if the user is logged in
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header("Location: log_in.html"); // Redirect to login page
    exit();
}

// Include your database connection file
$servername = "127.0.0.1"; // Replace with your XAMPP server's IP address
$username = "root"; // Default XAMPP username
$password = ""; // Default XAMPP password (usually empty)
$dbname = "city_housing"; // The name of your database

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}


// Fetch the validator_id from the session
$validator_id = $_SESSION['validator_id'];

// Prepare and execute the query to fetch user details
$sql = "SELECT name, email, password FROM validator WHERE validator_id = ?";
$stmt = $conn->prepare($sql); // Using prepared statements for security
$stmt->bind_param("i", $validator_id); // Bind the validator ID
$stmt->execute();
$result = $stmt->get_result();

// Check if the validator was found
if ($result->num_rows === 1) {
    // Fetch the user's data
    $row = $result->fetch_assoc();
    $name = $row['name'];
    $email = $row['email'];
    $password = $row['password']; // Note: Storing plain passwords is insecure; use hashed passwords.
} else {
    echo "User not found!";
    exit();
}

// Close the database connection
$stmt->close();
$conn->close();
?>


<!DOCTYPE html>
<html lang="en">
<head>
    
    <!-- Metadata and links for external stylesheets and icons -->
    <meta charset="UTF-8" />
    <title>Validator Profile</title>
    <link rel="stylesheet" href="valiprofile.css" />
  
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>

</head>
<body>

    <!-- Sidebar container -->
    <div class="sidebar">
        <br>
        <!-- Sidebar menu list -->
        <ul class="menu">
            <li>
                <a href="vdashboard.php">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Validator Dashboard</span>
                </a>
            </li> 
            <li>
                <a href="survey_form.php">
                    <i class="fas fa-file-alt"></i>
                    <span>Survey Form</span>
                </a>
            </li>
            <li>
                <a href="#">
                    <i class="fas fa-user"></i>
                    <span>Profile</span>
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
                <h2>Validator Profile</h2>
            </div>
            <img src="image/greenlogo1.jpg " alt=""/>
        </div>
        <br><br>
        <!-- Card container displaying demographics summary -->
        <div class="card--container">
            <h3 class="main--title">Edit Your Profile</h3>
            <form action="update_valiprofile.php" method="POST">
                <div class="form-content">
                    
                
                    <div class="editprofile-form">
                        
                        <div class="input-boxes">  
                            <div class="input-box">
                                <i class="fas fa-user"></i>
                                <input type="text" id="name" name="name" value="<?php echo htmlspecialchars($name); ?>" required>
                            </div>
        
                            <div class="input-box">
                                <i class="fas fa-envelope"></i>
                                <input type="text" id="email" name="email" value="<?php echo htmlspecialchars($email); ?>" required>
                            </div>
        
                            <div class="input-box">   
                                <i class="fas fa-lock"></i>
                                <input type="password" id="password" name="password" value="<?php echo htmlspecialchars($password); ?>" required> 
                            </div>    
                        </div>
        
                        <div class="button input-box">
                        <a href="update_valiprofile.php" class="button-link"></a>
                        </div>                      
                        
                    </div>
                </div> 
            </form> 
            
        </div>
        
    </div>   
   
</body>
</html>
