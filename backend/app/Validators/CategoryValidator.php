<?php

namespace App\Validators;

class CategoryValidator extends BaseValidator
{
    public function validate(array $data): array
    {
        $this->required('name', $data['name'] ?? '');

        if (isset($data['description'])) {
            $this->maxLength('description', $data['description'], 1000);
        }

        return [
            'valid' => $this->passes(),
            'errors' => $this->errors()
        ];
    }
}