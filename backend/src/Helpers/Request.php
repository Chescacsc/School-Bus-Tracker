<?php

namespace App\Helpers;

class Request
{
    /**
     * Reads and decodes a JSON request body, stripping a UTF-8 BOM if
     * present. Windows tools (PowerShell's Set-Content, some editors)
     * add one by default, which otherwise makes json_decode() silently
     * return null. Returns [] if the body is empty or not valid JSON.
     */
    public static function jsonBody(): array
    {
        $raw = file_get_contents('php://input') ?: '';
        $raw = preg_replace('/^\xEF\xBB\xBF/', '', $raw);
        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : [];
    }
}