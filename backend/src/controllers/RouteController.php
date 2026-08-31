<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Request;
use App\Middleware\AuthMiddleware;
use Exception;

class RouteController
{
    public function index(): void
    {
        AuthMiddleware::requireAuth('admin');

        $pdo = Database::connect();
        $routes = $pdo->query('SELECT id, name, description FROM routes ORDER BY name')->fetchAll();

        $stopsStmt = $pdo->prepare(
            'SELECT id, name, latitude, longitude, stop_order
             FROM stops WHERE route_id = ? ORDER BY stop_order'
        );

        foreach ($routes as &$route) {
            $stopsStmt->execute([$route['id']]);
            $route['stops'] = $stopsStmt->fetchAll();
        }

        echo json_encode($routes);
    }

    public function store(): void
    {
        AuthMiddleware::requireAuth('admin');

        $body = Request::jsonBody();
        $name = trim($body['name'] ?? '');
        $description = $body['description'] ?? null;
        $stops = $body['stops'] ?? [];

        if ($name === '') {
            http_response_code(422);
            echo json_encode(['error' => 'Route name is required']);
            return;
        }

        $pdo = Database::connect();
        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare('INSERT INTO routes (name, description) VALUES (?, ?)');
            $stmt->execute([$name, $description]);
            $routeId = $pdo->lastInsertId();

            $stopStmt = $pdo->prepare(
                'INSERT INTO stops (route_id, name, latitude, longitude, stop_order)
                 VALUES (?, ?, ?, ?, ?)'
            );

            foreach ($stops as $index => $stop) {
                $stopStmt->execute([
                    $routeId,
                    $stop['name'] ?? ('Stop ' . ($index + 1)),
                    $stop['latitude'],
                    $stop['longitude'],
                    $index + 1,
                ]);
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Could not create route', 'detail' => $e->getMessage()]);
            return;
        }

        http_response_code(201);
        echo json_encode(['id' => (int) $routeId, 'name' => $name]);
    }

    public function destroy(string $id): void
    {
        AuthMiddleware::requireAuth('admin');

        // ON DELETE CASCADE on stops.route_id handles removing its stops too.
        $pdo = Database::connect();
        $stmt = $pdo->prepare('DELETE FROM routes WHERE id = ?');
        $stmt->execute([$id]);

        echo json_encode(['deleted' => (bool) $stmt->rowCount()]);
    }
}