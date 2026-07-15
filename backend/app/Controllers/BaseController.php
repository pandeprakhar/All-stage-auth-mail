<?php

namespace App\Controllers;

use App\Core\Response;

abstract class BaseController
{
    protected function success(
        mixed $data=[],
        string $message="Success",
        int $status=200
    ): never
    {
        Response::success($data,$message,$status);
    }

    protected function error(
        string $message,
        int $status=400,
        array $errors=[]
    ): never
    {
        Response::error($message,$status,$errors);
    }
}