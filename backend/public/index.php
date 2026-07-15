<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Env;
use App\Core\Router;

Env::load(dirname(__DIR__));

date_default_timezone_set(
    $_ENV['TIMEZONE'] ?? 'UTC'
);

$router = new Router();

require_once __DIR__ . '/../routes/auth.php';
require_once __DIR__ . '/../routes/admin.php';
require_once __DIR__ . '/../routes/product.php';

try {
    $router->dispatch();
} catch (\Throwable $e) {
    http_response_code(500);

    echo "<pre>";
    echo "Message: " . $e->getMessage() . PHP_EOL;
    echo "File: " . $e->getFile() . PHP_EOL;
    echo "Line: " . $e->getLine() . PHP_EOL;
    echo PHP_EOL;
    echo $e->getTraceAsString();

    exit;
}