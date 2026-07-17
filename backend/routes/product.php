<?php

use App\Controllers\ProductController;
use App\Controllers\OrderController;

$router->get(
    '/api/admin/products',
    [ProductController::class, 'index']
);

$router->post(
    '/api/admin/products',
    [ProductController::class, 'store']
);

$router->post(
    '/api/orders',
    [OrderController::class, 'store']
);