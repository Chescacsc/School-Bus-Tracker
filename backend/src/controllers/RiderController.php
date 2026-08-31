<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Request;
use App\Middleware\AuthMiddleware;

class RiderController
{
    /**
     * GET /api/admin/riders
     * Lists all riders with their stop name and parent name.
     */
    public function index(): void
    {
        AuthMiddleware::requireAuth('admin');

        $pdo = Database::connect();
        $rows = $pdo->query(
            'SELECT r.id, r.name, r.rider_type,
                    r.stop_id, s.name AS stop_name,
                    s.route_id, ro.name AS route_name,
                    r.parent_user_id, u.name AS parent_name
             FROM riders r
             LEFT JOIN stops s  ON s.id  = r.stop_id
             LEFT JOIN routes ro ON ro.id = s.route_id
             LEFT JOIN users u  ON u.id  = r.parent_user_id
             ORDER BY r.name'
        )->fetchAll();

        echo json_encode($rows);
    }

    /**
     * POST /api/admin/riders
     * Creates a new rider.
     */
    public function store(): void
    {
        AuthMiddleware::requireAuth('admin');

        $body = Request::jsonBody();
        $name         = trim($body['name'] ?? '');
        $riderType    = $body['rider_type'] ?? '';
        $stopId       = $body['stop_id'] ?? null;
        $parentUserId = $body['parent_user_id'] ?? null;

        if ($name === '') {
            http_response_code(422);
            echo json_encode(['error' => 'Rider name is required']);
            return;
        }

        if (!in_array($riderType, ['student', 'teacher', 'staff'], true)) {
            http_response_code(422);
            echo json_encode(['error' => 'rider_type must be student, teacher, or staff']);
            return;
        }

        if (!$stopId) {
            http_response_code(422);
            echo json_encode(['error' => 'stop_id is required']);
            return;
        }

        $pdo = Database::connect();
        $stmt = $pdo->prepare(
            'INSERT INTO riders (name, rider_type, stop_id, parent_user_id)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$name, $riderType, (int) $stopId, $parentUserId ?: null]);

        http_response_code(201);
        echo json_encode([
            'id'   => (int) $pdo->lastInsertId(),
            'name' => $name,
        ]);
    }

    /**
     * DELETE /api/admin/riders/{id}
     */
    public function destroy(string $id): void
    {
        AuthMiddleware::requireAuth('admin');

        $pdo = Database::connect();
        $stmt = $pdo->prepare('DELETE FROM riders WHERE id = ?');
        $stmt->execute([$id]);

        echo json_encode(['deleted' => (bool) $stmt->rowCount()]);
    }
}
