<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

try {
    // Get all approved validators WITH passwords for offline sync
    $sql = "SELECT CAST(validator_id AS UNSIGNED) as id, name, email, username, password, status, created_at as createdAt, updated_at as updatedAt FROM validator WHERE status = 'approved'";
    $result = $conn->query($sql);

    if ($result) {
        $validators = [];
        while ($row = $result->fetch_assoc()) {
            // Include password for offline authentication
            $validators[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'validators' => $validators,
            'count' => count($validators),
            'message' => 'Validators synced successfully for offline use'
        ]);
    } else {
        throw new Exception("Query failed: " . $conn->error);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>
