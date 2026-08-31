<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Controllers\AuthController;
use App\Controllers\RouteController;
use App\Controllers\UserController;
use App\Controllers\BusController;
use App\Controllers\RiderController;
use App\Controllers\DriverController;
use App\Controllers\PublicController;

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

// Router supports {param} placeholders — needed for anything with an
// id in the path (DELETE /api/admin/routes/5, and every resource after this).
$routes = [
    // Auth
    'POST /api/auth/login' => [AuthController::class, 'login'],

    // Admin — Routes
    'GET /api/admin/routes'          => [RouteController::class, 'index'],
    'POST /api/admin/routes'         => [RouteController::class, 'store'],
    'DELETE /api/admin/routes/{id}'  => [RouteController::class, 'destroy'],

    // Admin — Users
    'GET /api/admin/users'           => [UserController::class, 'index'],
    'POST /api/admin/users'          => [UserController::class, 'store'],
    'DELETE /api/admin/users/{id}'   => [UserController::class, 'destroy'],

    // Admin — Buses
    'GET /api/admin/buses'           => [BusController::class, 'index'],
    'POST /api/admin/buses'          => [BusController::class, 'store'],
    'PUT /api/admin/buses/{id}'      => [BusController::class, 'update'],
    'DELETE /api/admin/buses/{id}'   => [BusController::class, 'destroy'],

    // Admin — Riders
    'GET /api/admin/riders'          => [RiderController::class, 'index'],
    'POST /api/admin/riders'         => [RiderController::class, 'store'],
    'DELETE /api/admin/riders/{id}'  => [RiderController::class, 'destroy'],

    // Driver
    'GET /api/driver/me'             => [DriverController::class, 'me'],
    'POST /api/driver/trip/start'    => [DriverController::class, 'startTrip'],
    'POST /api/driver/trip/end'      => [DriverController::class, 'endTrip'],
    'POST /api/driver/location'      => [DriverController::class, 'sendLocation'],

    // Public (no auth)
    'GET /api/routes'                => [PublicController::class, 'routes'],
    'GET /api/routes/{id}/live'      => [PublicController::class, 'routeLive'],
];

$handler = null;
$params = [];

foreach ($routes as $pattern => $target) {
    [$patternMethod, $patternPath] = explode(' ', $pattern, 2);
    if ($patternMethod !== $method) {
        continue;
    }

    $regex = '#^' . preg_replace('/\{[a-zA-Z_]+\}/', '([^/]+)', $patternPath) . '$#';

    if (preg_match($regex, $path, $matches)) {
        array_shift($matches);
        $params = $matches;
        $handler = $target;
        break;
    }
}

if (!$handler) {
    http_response_code(404);
    echo json_encode(['error' => 'Not found', 'path' => $path]);
    exit;
}

[$controllerClass, $action] = $handler;
(new $controllerClass())->$action(...$params);