<?php
session_start();
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header("Location: admin_login.php"); // Redirect to login page if not logged in
    exit();
}
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

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = $_POST['name'];
    $username = $_POST['username'];
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Check if email or username already exists
    $checkUser = "SELECT * FROM validator WHERE email = ? OR username = ?";
    $stmt = $conn->prepare($checkUser);
    $stmt->bind_param("ss", $email, $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo "<script>alert('Email or Username already exists!'); window.history.back();</script>";
    } else {
        // Insert the validator details directly into the database
        $insertValidator = "INSERT INTO validator (name, username, email, password) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($insertValidator);
        $stmt->bind_param("ssss", $name, $username, $email, $hashedPassword);

        if ($stmt->execute()) {
            echo "<script>alert('Validator account created successfully!'); window.location.href = 'validators_applications.php';</script>";
        } else {
            echo "<script>alert('Error: " . $stmt->error . "'); window.history.back();</script>";
        }
    }
    $stmt->close();
}

$conn->close();
?>
