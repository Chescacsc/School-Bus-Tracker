<?php

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$dbname = $_ENV['DB_NAME'] ?? 'school_bus_tracker';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';

echo "Connecting to MySQL server at {$host}..." . PHP_EOL;

try {
    $pdo = new PDO("mysql:host={$host};charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "Connected successfully to MySQL server." . PHP_EOL;

    echo "Importing schema from database/schoolBus.sql..." . PHP_EOL;
    $sql = file_get_contents(__DIR__ . '/database/schoolBus.sql');
    $pdo->exec($sql);
    echo "Schema imported successfully!" . PHP_EOL;

    // Switch to database and check tables
    $pdo->exec("USE `{$dbname}`");
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables in '{$dbname}': " . implode(', ', $tables) . PHP_EOL;

    // Check if admin user exists
    $adminStmt = $pdo->prepare("SELECT id, email, role FROM users WHERE email = ?");
    $adminStmt->execute(['admin@example.com']);
    $admin = $adminStmt->fetch();

    if ($admin) {
        echo "Admin user already exists: {$admin['email']} (Role: {$admin['role']})" . PHP_EOL;
    } else {
        $name = 'Admin User';
        $email = 'admin@example.com';
        $password = 'admin123';
        $hash = password_hash($password, PASSWORD_DEFAULT);

        $insertStmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
        $insertStmt->execute([$name, $email, $hash, 'admin']);
        echo "Default admin user created! Email: {$email} / Password: {$password}" . PHP_EOL;
    }

} catch (Exception $e) {
    echo "Database setup failed: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
