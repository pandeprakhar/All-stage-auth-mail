<?php

namespace App\Validators;

class BrandValidator extends BaseValidator
{
    public function validate(array $data): array
    {
        $this->required("name",$data["name"] ?? "");

        if(isset($data["website"])) {
            $this->url("website",$data["website"]);
        }

        return [

            "valid"=>$this->passes(),

            "errors"=>$this->errors()

        ];
    }
}