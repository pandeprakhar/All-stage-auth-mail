<?php

namespace App\Core;

class Response
{
    /**
     * Send JSON response
     */
    public static function json(
        bool $success,
        string $message = '',
        mixed $data = null,
        int $statusCode = 200,
        array $errors = []
    ): never
    {
        http_response_code($statusCode);

        header('Content-Type: application/json');

        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data'    => $data,
            'errors'  => $errors
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        exit;
    }

    public static function success(
        mixed $data = null,
        string $message = 'Success',
        int $statusCode = 200
    ): never
    {
        self::json(true, $message, $data, $statusCode);
    }

    public static function error(
        string $message = 'Something went wrong',
        int $statusCode = 500,
        array $errors = []
    ): never
    {
        self::json(false, $message, null, $statusCode, $errors);
    }
}