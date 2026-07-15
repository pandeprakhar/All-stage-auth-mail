<?php

namespace App\Models;

abstract class BaseModel
{
    /**
     * Convert model to array
     */
    public function toArray(): array
    {
        return get_object_vars($this);
    }

    /**
     * Hydrate model from database row
     */
    public function fill(array $data): static
    {
        foreach ($data as $key => $value) {

            $property = lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $key))));

            if (property_exists($this, $property)) {
                $this->$property = $value;
            }
        }

        return $this;
    }
}