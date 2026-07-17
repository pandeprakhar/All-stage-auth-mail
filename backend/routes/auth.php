<?php

use App\Controllers\AuthController;

$router->post('/api/auth/login', [AuthController::class, 'login']);

$router->post('/api/auth/logout', [AuthController::class, 'logout']);

$router->get('/api/auth/me', [AuthController::class, 'me']);

$router->post('/api/auth/verify-otp', [AuthController::class, 'verifyOtp']);

$router->post(
    '/api/auth/forgot-password',
    [AuthController::class, 'forgotPassword']
);
$router->post(
    '/api/auth/verify-forgot-otp',
    [AuthController::class, 'verifyForgotOtp']
);
$router->post(
    '/api/auth/reset-password',
    [AuthController::class, 'resetPassword']
);