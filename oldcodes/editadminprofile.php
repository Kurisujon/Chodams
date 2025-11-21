<?php
session_start();
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header("Location: admin_login.php"); // Redirect to login page if not logged in
    exit();
}
// Database connection
$conn = new mysqli("localhost", "root", "", "city_housing");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$id = 1; // Hardcoded admin_id for this example

// Fetch existing admin data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT username, email FROM admin_acc WHERE id = $id";
    $result = $conn->query($query);
    $admin = $result->fetch_assoc();
}

// Update admin details
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT); // Hash the new password

    $update_query = "UPDATE admin_acc SET email = ?, password = ? WHERE id = ?";
    $stmt = $conn->prepare($update_query);
    $stmt->bind_param("ssi", $email, $password, $id);

    if ($stmt->execute()) {
        echo "<script>alert('Profile updated successfully'); window.location='validators_applications.php';</script>";
    } else {
        echo "Error: " . $stmt->error;
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Admin Profile</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { width: 50%; margin: 50px auto; padding: 20px; background: #fff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
        h2 { text-align: center; margin-bottom: 20px; }
        label { display: block; margin: 10px 0 5px; }
        input { width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 5px; }
        button { background-color: #28a745; color: white; padding: 10px 15px; border: none; cursor: pointer; }
        button:hover { background-color: #218838; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Edit Profile</h2>
        <form method="POST" action="editadminprofile.php">
            <label>Admin ID</label>
            <input type="text" value="<?php echo $id; ?>" disabled>
            <label>Email</label>
            <input type="email" name="email" value="<?php echo htmlspecialchars($admin['email']); ?>" required>
            <label>New Password</label>
            <input type="password" name="password" placeholder="Enter new password" required>
            <button type="submit">Update Profile</button>
        </form>
    </div>
</body>
</html>

<?php $conn->close(); ?>
