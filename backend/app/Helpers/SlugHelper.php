<?php

namespace App\Helpers;

class SlugHelper
{
    public static function generate(string $text): string
    {
        $text = strtolower(trim($text));

        $text = preg_replace('/[^a-z0-9]+/', '-', $text);

        $text = trim($text, '-');

        return $text;
    }
}