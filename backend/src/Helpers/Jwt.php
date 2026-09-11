<?php

namespace App\Helpers;

use Firebase\JWT\JWT as FirebaseJWT;
use Firebase\JWT\Key;
use Exception;

class Jwt
{
    private static function secret(): string
    {
        return $_ENV['JWT_SECRET'] ?? 'insecure-default-change-me';
    }

    public static function issue(array $payload, int $expiresInSeconds = 28800): string
    {
        // 28800s = 8 hours, roughly a school day
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiresInSeconds;

        return FirebaseJWT::encode($payload, self::secret(), 'HS256');
    }

    public static function verify(string $token): ?array
    {
        try {
            $decoded = FirebaseJWT::decode($token, new Key(self::secret(), 'HS256'));
            return (array) $decoded;
        } catch (Exception $e) {
            return null;
        }
    }
}
