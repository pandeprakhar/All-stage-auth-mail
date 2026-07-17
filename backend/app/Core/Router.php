<?php

namespace App\Core;

class Router
{
    private array $routes = [];

    public function get(string $uri, callable|array $handler): void
    {
        $this->register('GET', $uri, $handler);
    }

    public function post(string $uri, callable|array $handler): void
    {
        $this->register('POST', $uri, $handler);
    }

    public function put(string $uri, callable|array $handler): void
    {
        $this->register('PUT', $uri, $handler);
    }

    public function delete(string $uri, callable|array $handler): void
    {
        $this->register('DELETE', $uri, $handler);
    }

    private function register(string $method, string $uri, callable|array $handler): void
    {

        $this->routes[$method][rtrim($uri, '/')] = $handler;
    }

   public function dispatch(): void
{
    $method = Request::method();
    $uri = trim(Request::uri());

    $handler = null;
    $params = [];

    if (isset($this->routes[$method][$uri])) {
        Request::setParams([]);
        $handler = $this->routes[$method][$uri];
    } else {
        foreach ($this->routes[$method] ?? [] as $route => $routeHandler) {
            // Find placeholder parameter names (e.g., 'id' from '{id}')
            preg_match_all('/\{([a-zA-Z_]+)\}/', $route, $paramNamesMatches);
            $paramNames = $paramNamesMatches[1] ?? [];

            $pattern = preg_replace(
                '/\{[a-zA-Z_]+\}/',
                '([^/]+)',
                $route
            );

            $pattern = '#^' . $pattern . '$#';

            if (preg_match($pattern, $uri, $matches)) {
                array_shift($matches);
                $params = $matches;
                
                // Pair variable names with matches
                $namedParams = [];
                foreach ($paramNames as $index => $name) {
                    if (isset($params[$index])) {
                        $namedParams[$name] = $params[$index];
                    }
                }
                Request::setParams($namedParams);

                $handler = $routeHandler;
                break;
            }
        }
    }

    if (!$handler) {
        Response::error("Route not found", 404);
        return;
    }

    if (is_callable($handler)) {

        call_user_func_array(
            $handler,
            $params
        );

        return;
    }

    if (is_array($handler)) {

        [$controller, $action] = $handler;

        $controller = new $controller();

        call_user_func_array(
            [$controller, $action],
            $params
        );

        return;
    }

    Response::error(
        "Invalid Route Handler",
        500
    );
}
}