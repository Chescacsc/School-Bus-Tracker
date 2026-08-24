<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Request;
use App\Middleware\AuthMiddleware;

class BusController
{
    /**
     * GET /api/admin/buses
     * Lists all buses with their assigned route and driver names.
     */
    public function index(): void
    {
        AuthMiddleware::requireAuth('admin');

        $pdo = Database::connect();
        $rows = $pdo->query(
            'SELECT b.id, b.plate_number, b.model, b.capacity,
                    b.route_id, r.name AS route_name,
                    b.driver_id, u.name AS driver_name,
                    b.status, b.is_on_trip
             FROM buses b
             LEFT JOIN routes r ON r.id = b.route_id
             LEFT JOIN users  u ON u.id = b.driver_id
             ORDER BY b.plate_number'
        )->fetchAll();

        echo json_encode($rows);
    }

    /**
     * POST /api/admin/buses
     * Creates a new bus.
     */
    public function store(): void
    {
        AuthMiddleware::requireAuth('admin');

        $body = Request::jsonBody();
        $plate    = trim($body['plate_number'] ?? '');
        $model    = $body['model'] ?? null;
        $capacity = $body['capacity'] ?? null;
        $routeId  = $body['route_id'] ?? null;
        $driverId = $body['driver_id'] ?? null;
        $status   = $body['status'] ?? 'active';

        if ($plate === '') {
            http_response_code(422);
            echo json_encode(['error' => 'Plate number is required']);
            return;
        }

        $pdo = Database::connect();

        // Check duplicate plate
        $check = $pdo->prepare('SELECT id FROM buses WHERE plate_number = ?');
        $check->execute([$plate]);
        if ($check->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'A bus with this plate number already exists']);
            return;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO buses (plate_number, model, capacity, route_id, driver_id, status)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $plate,
            $model,
            $capacity ? (int) $capacity : null,
            $routeId ?: null,
            $driverId ?: null,
            $status,
        ]);

        http_response_code(201);
        echo json_encode([
            'id'           => (int) $pdo->lastInsertId(),
            'plate_number' => $plate,
        ]);
    }

    /**
     * PUT /api/admin/buses/{id}
     * Updates a bus (route assignment, driver assignment, status).
     */
    public function update(string $id): void
    {
        AuthMiddleware::requireAuth('admin');

        $body = Request::jsonBody();

        $fields = [];
        $values = [];

        foreach (['plate_number', 'model', 'status'] as $col) {
            if (isset($body[$col])) {
                $fields[] = "{$col} = ?";
                $values[] = $body[$col];
            }
        }

        if (isset($body['capacity'])) {
            $fields[] = 'capacity = ?';
            $values[] = (int) $body['capacity'];
        }

        // Allow explicitly setting to null (un-assign)
        if (array_key_exists('route_id', $body)) {
            $fields[] = 'route_id = ?';
            $values[] = $body['route_id'] ?: null;
        }

        if (array_key_exists('driver_id', $body)) {
            $fields[] = 'driver_id = ?';
            $values[] = $body['driver_id'] ?: null;
        }

        if (empty($fields)) {
            http_response_code(422);
            echo json_encode(['error' => 'Nothing to update']);
            return;
        }

        $values[] = $id;

        $pdo = Database::connect();
        $stmt = $pdo->prepare('UPDATE buses SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($values);

        echo json_encode(['updated' => (bool) $stmt->rowCount()]);
    }

    /**
     * DELETE /api/admin/buses/{id}
     */
    public function destroy(string $id): void
    {
        AuthMiddleware::requireAuth('admin');

        $pdo = Database::connect();
        $stmt = $pdo->prepare('DELETE FROM buses WHERE id = ?');
        $stmt->execute([$id]);

        echo json_encode(['deleted' => (bool) $stmt->rowCount()]);
    }
}
