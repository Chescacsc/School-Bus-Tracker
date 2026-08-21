<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Controllers\AuthController;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // fine for local dev; restrict before deploying
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Simple exact-match router. Grows as we add each endpoint from the plan —
// admin/buses, admin/routes, driver/location, routes/{id}/eta, etc.
$routes = [
    'POST /api/auth/login' => [AuthController::class, 'login'],
];

$key = "{$method} {$path}";

if (!isset($routes[$key])) {
    http_response_code(404);
    echo json_encode(['error' => 'Not found', 'path' => $path]);
    exit;
}

[$controllerClass, $action] = $routes[$key];
(new $controllerClass())->$action();
