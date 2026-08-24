<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Request;
use App\Middleware\AuthMiddleware;

class DriverController
{
    /**
     * GET /api/driver/me
     * Returns the driver's assigned bus, route, stops, and riders.
     */
    public function me(): void
    {
        $payload = AuthMiddleware::requireAuth('driver');
        $driverId = $payload['sub'];

        $pdo = Database::connect();

        // Find the bus assigned to this driver
        $busStmt = $pdo->prepare(
            'SELECT b.id, b.plate_number, b.model, b.route_id, b.is_on_trip,
                    r.name AS route_name, r.description AS route_description
             FROM buses b
             LEFT JOIN routes r ON r.id = b.route_id
             WHERE b.driver_id = ?'
        );
        $busStmt->execute([$driverId]);
        $bus = $busStmt->fetch();

        if (!$bus) {
            echo json_encode([
                'bus'    => null,
                'route'  => null,
                'roster' => [],
            ]);
            return;
        }

        $route = null;
        $roster = [];

        if ($bus['route_id']) {
            $route = [
                'id'          => (int) $bus['route_id'],
                'name'        => $bus['route_name'],
                'description' => $bus['route_description'],
            ];

            // Use the route_roster view for a nicely grouped result
            $rosterStmt = $pdo->prepare(
                'SELECT stop_id, stop_name, stop_order, rider_id, rider_name, rider_type
                 FROM route_roster
                 WHERE route_id = ?
                 ORDER BY stop_order'
            );
            $rosterStmt->execute([$bus['route_id']]);
            $rows = $rosterStmt->fetchAll();

            // Group riders by stop
            $stopsMap = [];
            foreach ($rows as $row) {
                $sid = $row['stop_id'];
                if (!isset($stopsMap[$sid])) {
                    $stopsMap[$sid] = [
                        'stop_id'    => (int) $sid,
                        'stop_name'  => $row['stop_name'],
                        'stop_order' => (int) $row['stop_order'],
                        'riders'     => [],
                    ];
                }
                if ($row['rider_id']) {
                    $stopsMap[$sid]['riders'][] = [
                        'id'   => (int) $row['rider_id'],
                        'name' => $row['rider_name'],
                        'type' => $row['rider_type'],
                    ];
                }
            }

            $roster = array_values($stopsMap);
        }

        echo json_encode([
            'bus' => [
                'id'           => (int) $bus['id'],
                'plate_number' => $bus['plate_number'],
                'model'        => $bus['model'],
                'is_on_trip'   => (bool) $bus['is_on_trip'],
            ],
            'route'  => $route,
            'roster' => $roster,
        ]);
    }

    /**
     * POST /api/driver/trip/start
     * Sets is_on_trip = TRUE on the driver's bus.
     */
    public function startTrip(): void
    {
        $payload = AuthMiddleware::requireAuth('driver');
        $driverId = $payload['sub'];

        $pdo = Database::connect();
        $stmt = $pdo->prepare('UPDATE buses SET is_on_trip = TRUE WHERE driver_id = ?');
        $stmt->execute([$driverId]);

        echo json_encode(['is_on_trip' => true, 'updated' => (bool) $stmt->rowCount()]);
    }

    /**
     * POST /api/driver/trip/end
     * Sets is_on_trip = FALSE on the driver's bus.
     */
    public function endTrip(): void
    {
        $payload = AuthMiddleware::requireAuth('driver');
        $driverId = $payload['sub'];

        $pdo = Database::connect();
        $stmt = $pdo->prepare('UPDATE buses SET is_on_trip = FALSE WHERE driver_id = ?');
        $stmt->execute([$driverId]);

        echo json_encode(['is_on_trip' => false, 'updated' => (bool) $stmt->rowCount()]);
    }

    /**
     * POST /api/driver/location
     * Inserts a GPS ping into bus_locations.
     * Body: { latitude, longitude, speed_kmh? }
     */
    public function sendLocation(): void
    {
        $payload = AuthMiddleware::requireAuth('driver');
        $driverId = $payload['sub'];

        $body = Request::jsonBody();
        $lat   = $body['latitude'] ?? null;
        $lng   = $body['longitude'] ?? null;
        $speed = $body['speed_kmh'] ?? null;

        if ($lat === null || $lng === null) {
            http_response_code(422);
            echo json_encode(['error' => 'latitude and longitude are required']);
            return;
        }

        $pdo = Database::connect();

        // Look up the bus assigned to this driver
        $busStmt = $pdo->prepare('SELECT id FROM buses WHERE driver_id = ?');
        $busStmt->execute([$driverId]);
        $bus = $busStmt->fetch();

        if (!$bus) {
            http_response_code(404);
            echo json_encode(['error' => 'No bus assigned to this driver']);
            return;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO bus_locations (bus_id, latitude, longitude, speed_kmh)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$bus['id'], $lat, $lng, $speed]);

        echo json_encode(['recorded' => true]);
    }
}
