<?php

namespace App\Controllers;

use App\Core\Request;
use App\Services\CustomerService;
use Exception;

class CustomerController extends BaseController
{
    private CustomerService $service;

    public function __construct()
    {
        $this->service = new CustomerService();
    }

    /**
     * GET /api/admin/customers
     */
    public function index(): void
    {
        $page = (int)Request::query('page', 1);
        $perPage = (int)Request::query('per_page', 25);
        $search = Request::query('search');

        try {
            $result = $this->service->getAllPaginated($page, $perPage, $search);
            
            $formatted = array_map(
                fn($customer) => $customer->toArray(),
                $result['data']
            );

            $this->success([
                'data' => $formatted,
                'total' => $result['total'],
                'page' => $page,
                'per_page' => $perPage
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }
}
