<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Env;
use App\Core\Router;

Env::load(dirname(__DIR__));

$router = new Router();

require_once __DIR__ . '/../routes/public.php';
require_once __DIR__ . '/../routes/auth.php';
require_once __DIR__ . '/../routes/admin.php';

$router->dispatch();