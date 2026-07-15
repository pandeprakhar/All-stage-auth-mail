
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

use App\Controllers\ProductController;

/*
|--------------------------------------------------------------------------
| Products
|--------------------------------------------------------------------------
*/

$router->get(
    '/api/admin/products',
    [ProductController::class, 'index']
);

$router->get(
    '/api/admin/products/{id}',
    [ProductController::class, 'show']
);

$router->post(
    '/api/admin/products',
    [ProductController::class, 'store']
);

$router->put(
    '/api/admin/products/{id}',
    [ProductController::class, 'update']
);

$router->delete(
    '/api/admin/products/{id}',
    [ProductController::class, 'destroy']
);
use App\Controllers\ProductImageController;

$router->post(
    '/api/admin/products/images',
    [ProductImageController::class,'upload']
);