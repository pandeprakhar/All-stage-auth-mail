<?php

namespace App\Core;

use Throwable;

class ExceptionHandler
{
    public static function handle(Throwable $e): void
    {
        Response::error(

            $e->getMessage(),

            500,

            [

                'file'=>$e->getFile(),

                'line'=>$e->getLine()

            ]

        );
    }
}