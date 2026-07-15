<?php

namespace App\Middleware;

use App\Core\Response;

class AuthMiddleware
{
    public function handle(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['admin'])) {

            Response::error(
                "Unauthorized",
                401
            );

        }
    }
}