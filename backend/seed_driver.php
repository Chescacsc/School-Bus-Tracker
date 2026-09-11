<?php

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$pdo = App\Config\Database::connect();

// Create demo driver if not exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute(['driver@example.com']);
$driver = $stmt->fetch();

if (!$driver) {
    $hash = password_hash('driver123', PASSWORD_DEFAULT);
    $ins = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)");
    $ins->execute(['John Driver', 'driver@example.com', $hash, 'driver', '+1234567890']);
    $driverId = $pdo->lastInsertId();
    echo "Created driver account: driver@example.com / driver123 (ID: {$driverId})" . PHP_EOL;
} else {
    $driverId = $driver['id'];
    echo "Driver account already exists: driver@example.com (ID: {$driverId})" . PHP_EOL;
}

// Check or create demo route
$stmt = $pdo->prepare("SELECT id FROM routes WHERE name = ?");
$stmt->execute(['North Campus Express']);
$route = $stmt->fetch();

if (!$route) {
    $ins = $pdo->prepare("INSERT INTO routes (name, description) VALUES (?, ?)");
    $ins->execute(['North Campus Express', 'Morning and afternoon route covering North District']);
    $routeId = $pdo->lastInsertId();

    // Create 3 sample stops
    $stops = [
        ['stop_name' => 'Oak Avenue & 1st St', 'lat' => 37.7749, 'lng' => -122.4194, 'order' => 1],
        ['stop_name' => 'Maple Blvd Community Center', 'lat' => 37.7849, 'lng' => -122.4094, 'order' => 2],
        ['stop_name' => 'High School Main Gate', 'lat' => 37.7949, 'lng' => -122.3994, 'order' => 3],
    ];

    $insStop = $pdo->prepare("INSERT INTO stops (route_id, name, latitude, longitude, stop_order) VALUES (?, ?, ?, ?, ?)");
    foreach ($stops as $s) {
        $insStop->execute([$routeId, $s['stop_name'], $s['lat'], $s['lng'], $s['order']]);
        $stopId = $pdo->lastInsertId();

        // Add a rider to each stop
        $insRider = $pdo->prepare("INSERT INTO riders (name, rider_type, stop_id) VALUES (?, ?, ?)");
        $insRider->execute(["Student for Stop {$s['order']}", 'student', $stopId]);
    }
    echo "Created sample route with 3 stops and riders." . PHP_EOL;
} else {
    $routeId = $route['id'];
}

// Check or create demo bus
$stmt = $pdo->prepare("SELECT id FROM buses WHERE plate_number = ?");
$stmt->execute(['BUS-204']);
$bus = $stmt->fetch();

if (!$bus) {
    $ins = $pdo->prepare("INSERT INTO buses (plate_number, model, capacity, route_id, driver_id, status) VALUES (?, ?, ?, ?, ?, ?)");
    $ins->execute(['BUS-204', 'Blue Bird All American', 48, $routeId, $driverId, 'active']);
    echo "Created bus BUS-204 assigned to driver and route." . PHP_EOL;
} else {
    $upd = $pdo->prepare("UPDATE buses SET driver_id = ?, route_id = ? WHERE id = ?");
    $upd->execute([$driverId, $routeId, $bus['id']]);
    echo "Assigned BUS-204 to driver and route." . PHP_EOL;
}
