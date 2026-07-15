<?php

use App\Controllers\HealthController;

$router->get('/api/health', [HealthController::class, 'index']);