<?php

namespace App\Controllers;

use App\Core\Response;

class HealthController
{
    public function index(): void
    {
        Response::success(
            [
                "application" => "Allstag Ecommerce Backend",
                "version" => "1.0.0",
                "status" => "Running"
            ],
            "Backend is healthy."
        );
    }
}