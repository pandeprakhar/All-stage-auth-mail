<?php

namespace App\Core;

use Dotenv\Dotenv;

class Env
{
    public static function load(string $basePath): void
    {
        if (!file_exists($basePath . '/.env')) {
            throw new \Exception('.env file not found.');
        }

        $dotenv = Dotenv::createImmutable($basePath);
        $dotenv->load();
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return $_ENV[$key] ?? $default;
    }
}