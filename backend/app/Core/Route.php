<?php

namespace App\Core;

class Route
{
    public function __construct(
        public string $method,
        public string $uri,
        public mixed $handler
    ) {
    }
}