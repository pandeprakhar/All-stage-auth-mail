<?php

namespace App\Controllers;

use App\Core\Request;
use App\Services\BrandService;
use App\Validators\BrandValidator;
use Exception;

class BrandController extends BaseController
{
    private BrandService $service;

    public function __construct()
    {
        $this->service = new BrandService();
    }

    /**
     * GET /api/admin/brands
     */
    public function index(): void
    {
        $brands = array_map(
    fn($brand) => $brand->toArray(),
    $this->service->getAll()
);

$this->success($brands);
    }

    /**
     * POST /api/admin/brands
     */
    public function store(): void
    {
        $data = Request::body();

        $validator = new BrandValidator();

        $validation = $validator->validate($data);

        if (!$validation['valid']) {

            $this->error(
                "Validation Failed",
                422,
                $validation['errors']
            );

        }

        try {

            $brand = $this->service->create($data);

            $this->success(

                $brand->toArray(),

                "Brand Created",

                201

            );

        } catch (Exception $e) {

            $this->error(
                $e->getMessage(),
                400
            );

        }
    }

    /**
     * DELETE /api/admin/brands/{id}
     */
    public function destroy(int $id): void
    {
        $this->service->delete($id);

        $this->success(
            [],
            "Brand Deleted"
        );
    }
}