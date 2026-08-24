<?php

namespace App\Controllers;

use App\Config\Database;

class PublicController
{
    /**
     * GET /api/routes
     * Lists all routes (id + name) — no authentication required.
     */
    public function routes(): void
    {
        $pdo = Database::connect();
        $rows = $pdo->query('SELECT id, name, description FROM routes ORDER BY name')->fetchAll();
        echo json_encode($rows);
    }

    /**
     * GET /api/routes/{id}/live
     * Returns stops, bus info, and the current GPS position for the
     * bus assigned to this route. Used by the parent tracking view.
     */
    public function routeLive(string $routeId): void
    {
        $pdo = Database::connect();

        // Route info
        $routeStmt = $pdo->prepare('SELECT id, name, description FROM routes WHERE id = ?');
        $routeStmt->execute([$routeId]);
        $route = $routeStmt->fetch();

        if (!$route) {
            http_response_code(404);
            echo json_encode(['error' => 'Route not found']);
            return;
        }

        // Stops in order
        $stopsStmt = $pdo->prepare(
            'SELECT id, name, latitude, longitude, stop_order
             FROM stops WHERE route_id = ? ORDER BY stop_order'
        );
        $stopsStmt->execute([$routeId]);
        $stops = $stopsStmt->fetchAll();

        // Bus assigned to this route
        $busStmt = $pdo->prepare(
            'SELECT b.id, b.plate_number, b.model, b.is_on_trip,
                    u.name AS driver_name
             FROM buses b
             LEFT JOIN users u ON u.id = b.driver_id
             WHERE b.route_id = ? AND b.status = "active"
             LIMIT 1'
        );
        $busStmt->execute([$routeId]);
        $bus = $busStmt->fetch();

        $location = null;

        if ($bus && $bus['is_on_trip']) {
            // Latest GPS ping from the current_bus_location view
            $locStmt = $pdo->prepare(
                'SELECT latitude, longitude, speed_kmh, recorded_at
                 FROM current_bus_location
                 WHERE bus_id = ?'
            );
            $locStmt->execute([$bus['id']]);
            $location = $locStmt->fetch() ?: null;
        }

        echo json_encode([
            'route'    => $route,
            'stops'    => $stops,
            'bus'      => $bus ?: null,
            'location' => $location,
        ]);
    }
}
