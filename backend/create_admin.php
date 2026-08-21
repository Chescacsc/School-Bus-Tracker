<?php
// One-off seed script — run once from the backend/ folder: php create_admin.php
// Safe to delete afterward; this isn't meant to be deployed or reused.

require __DIR__ . '/vendor/autoload.php';

use App\Config\Database;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$pdo = Database::connect();

$name = 'Admin User';
$email = 'admin@example.com';
$password = 'admin123'; // change this after your first login
$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
);
$stmt->execute([$name, $email, $hash, 'admin']);

echo "Admin created — log in with {$email} / {$password}" . PHP_EOL;
