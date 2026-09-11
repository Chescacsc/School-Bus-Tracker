<?php

namespace App\Middleware;

use App\Helpers\Jwt;

class AuthMiddleware
{
    /**
     * Reads the Authorization header, verifies the JWT, and returns the
     * decoded payload. Sends a 401/403 and stops execution if the token
     * is missing, invalid, or (when $requiredRole is set) belongs to the
     * wrong role. Call this at the top of any controller method that
     * needs to be protected, e.g. AuthMiddleware::requireAuth('admin').
     */
    public static function requireAuth(?string $requiredRole = null): array
    {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

        if (!str_starts_with($authHeader, 'Bearer ')) {
            self::deny('Missing or malformed Authorization header');
        }

        $token = substr($authHeader, 7);
        $payload = Jwt::verify($token);

        if ($payload === null) {
            self::deny('Invalid or expired token');
        }

        if ($requiredRole !== null && ($payload['role'] ?? null) !== $requiredRole) {
            self::deny('Insufficient permissions', 403);
        }

        return $payload;
    }

    private static function deny(string $message, int $status = 401): void
    {
        http_response_code($status);
        echo json_encode(['error' => $message]);
        exit;
    }
}
