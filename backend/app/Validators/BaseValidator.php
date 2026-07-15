<?php

namespace App\Validators;

abstract class BaseValidator
{
    protected array $errors = [];

    protected function required(string $field, mixed $value): void
    {
        if ($value === null || trim((string)$value) === '') {
            $this->errors[$field] = ucfirst($field)." is required.";
        }
    }

    protected function email(string $field, mixed $value): void
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = "Invalid email.";
        }
    }

    protected function url(string $field, mixed $value): void
    {
        if ($value && !filter_var($value, FILTER_VALIDATE_URL)) {
            $this->errors[$field] = "Invalid URL.";
        }
    }

    protected function minLength(string $field, string $value, int $min): void
    {
        if (strlen($value) < $min) {
            $this->errors[$field] =
                ucfirst($field)." must be at least {$min} characters.";
        }
    }

    protected function maxLength(string $field, string $value, int $max): void
    {
        if (strlen($value) > $max) {
            $this->errors[$field] =
                ucfirst($field)." must not exceed {$max} characters.";
        }
    }

    public function passes(): bool
    {
        return empty($this->errors);
    }

    public function errors(): array
    {
        return $this->errors;
    }
}