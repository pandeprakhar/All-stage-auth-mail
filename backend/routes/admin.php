<?php

use App\Controllers\BrandController;

$router->get(
    '/api/admin/brands',
    [BrandController::class, 'index']
);

$router->post(
    '/api/admin/brands',
    [BrandController::class, 'store']
);

$router->delete(
    '/api/admin/brands',
    [BrandController::class, 'destroy']
);

use App\Controllers\CategoryController;

$router->get(
    '/api/admin/categories',
    [CategoryController::class, 'index']
);

$router->post(
    '/api/admin/categories',
    [CategoryController::class, 'store']
);