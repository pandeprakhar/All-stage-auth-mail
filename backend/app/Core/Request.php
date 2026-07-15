<?php

namespace App\Core;

class Request
{
    public static function method(): string
    {
        return $_SERVER['REQUEST_METHOD'];
    }

    public static function uri(): string
    {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        return rtrim($uri, '/');
    }

    public static function body(): array
    {
        $input = file_get_contents("php://input");

        if (!$input) {
            return [];
        }

        return json_decode($input, true) ?? [];
    }

    public static function query(string $key = null): mixed
    {
        if ($key === null) {
            return $_GET;
        }

        return $_GET[$key] ?? null;
    }

    public static function post(string $key = null): mixed
    {
        if ($key === null) {
            return $_POST;
        }

        return $_POST[$key] ?? null;
    }

    public static function files(): array
    {
        return $_FILES;
    }

    public static function header(string $name): ?string
    {
        $headers = getallheaders();

        return $headers[$name] ?? null;
    }
}