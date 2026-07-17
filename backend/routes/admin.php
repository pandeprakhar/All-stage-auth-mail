
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

$router->delete(
    '/api/admin/categories/{id}',
    [CategoryController::class, 'destroy']
);

use App\Controllers\SubcategoryController;

$router->get(
    '/api/admin/subcategories',
    [SubcategoryController::class, 'index']
);

$router->post(
    '/api/admin/subcategories',
    [SubcategoryController::class, 'store']
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

$router->post(
    '/api/admin/products/bulk-action',
    [ProductController::class, 'bulkAction']
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

use App\Controllers\DashboardController;

$router->get(
    '/api/admin/dashboard/stats',
    [DashboardController::class, 'stats']
);

$router->get(
    '/api/admin/dashboard/revenue',
    [DashboardController::class, 'revenue']
);

$router->get(
    '/api/admin/dashboard/categories',
    [DashboardController::class, 'categories']
);

use App\Controllers\OrderController;
use App\Controllers\CustomerController;

$router->get(
    '/api/admin/orders',
    [OrderController::class, 'index']
);

$router->get(
    '/api/admin/orders/{id}',
    [OrderController::class, 'show']
);

$router->put(
    '/api/admin/orders/{id}',
    [OrderController::class, 'update']
);

$router->get(
    '/api/admin/customers',
    [CustomerController::class, 'index']
);

$router->get(
    '/api/admin/products/low-cost_price',
    [DashboardController::class, 'lowStock']
);

use App\Controllers\ReportController;

$router->get(
    '/api/admin/reports/summary',
    [ReportController::class, 'summary']
);

$router->get(
    '/api/admin/reports/orders',
    [ReportController::class, 'orders']
);

$router->get(
    '/api/admin/reports/customers',
    [ReportController::class, 'customers']
);

$router->get(
    '/api/admin/reports/products',
    [ReportController::class, 'products']
);

$router->get(
    '/api/admin/reports/charts',
    [ReportController::class, 'charts']
);