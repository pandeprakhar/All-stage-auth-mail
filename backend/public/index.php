<?php

declare(strict_types=1);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (!empty($origin)) {
    if (preg_match('/^http:\/\/localhost(:\d+)?$/', $origin)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        $allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:8081",
            "http://localhost:8082",
        ];
        if (in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: $origin");
        }
    }
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}



require_once __DIR__ . '/../vendor/autoload.php';


$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();



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

<<<<<<< HEAD
    echo "<pre>";
    echo "Message: " . $e->getMessage() . PHP_EOL;
    echo "File: " . $e->getFile() . PHP_EOL;
    echo "Line: " . $e->getLine() . PHP_EOL;
    echo PHP_EOL;
    echo $e->getTraceAsString();

    exit;
}
=======
$router->dispatch();
>>>>>>> origin/main
