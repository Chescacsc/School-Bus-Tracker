<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Request;
use App\Middleware\AuthMiddleware;

class UserController
{
    /**
     * GET /api/admin/users?role=driver
     * Lists all users, optionally filtered by role.
     */
    public function index(): void
    {
        AuthMiddleware::requireAuth('admin');

        $pdo = Database::connect();

        $role = $_GET['role'] ?? null;

        if ($role && in_array($role, ['admin', 'driver', 'parent'], true)) {
            $stmt = $pdo->prepare(
                'SELECT id, name, email, role, phone, created_at
                 FROM users WHERE role = ? ORDER BY name'
            );
            $stmt->execute([$role]);
        } else {
            $stmt = $pdo->query(
                'SELECT id, name, email, role, phone, created_at
                 FROM users ORDER BY name'
            );
        }

        echo json_encode($stmt->fetchAll());
    }

    /**
     * POST /api/admin/users
     * Creates a new user (driver or parent).
     */
    public function store(): void
    {
        AuthMiddleware::requireAuth('admin');

        $body = Request::jsonBody();
        $name     = trim($body['name'] ?? '');
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $role     = $body['role'] ?? '';
        $phone    = $body['phone'] ?? null;

        if ($name === '' || $email === '' || $password === '') {
            http_response_code(422);
            echo json_encode(['error' => 'Name, email, and password are required']);
            return;
        }

        if (!in_array($role, ['admin', 'driver', 'parent'], true)) {
            http_response_code(422);
            echo json_encode(['error' => 'Role must be admin, driver, or parent']);
            return;
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        $pdo = Database::connect();

        // Check for duplicate email
        $check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $check->execute([$email]);
        if ($check->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'A user with this email already exists']);
            return;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$name, $email, $hash, $role, $phone]);

        http_response_code(201);
        echo json_encode([
            'id'    => (int) $pdo->lastInsertId(),
            'name'  => $name,
            'email' => $email,
            'role'  => $role,
        ]);
    }

    /**
     * DELETE /api/admin/users/{id}
     */
    public function destroy(string $id): void
    {
        AuthMiddleware::requireAuth('admin');

        $pdo = Database::connect();
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);

        echo json_encode(['deleted' => (bool) $stmt->rowCount()]);
    }
}
