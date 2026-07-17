<?php

namespace App\Controllers;

use App\Core\Request;
use App\Services\OrderService;
use Exception;

class OrderController extends BaseController
{
    private OrderService $service;

    public function __construct()
    {
        $this->service = new OrderService();
    }

    /**
     * GET /api/admin/orders
     */
    public function index(): void
    {
        $page = (int)Request::query('page', 1);
        $perPage = (int)Request::query('per_page', 25);
        $search = Request::query('search');
        $paymentStatus = Request::query('payment_status');
        $orderStatus = Request::query('order_status');

        try {
            $result = $this->service->getAllPaginated($page, $perPage, $search, $paymentStatus, $orderStatus);

            $formatted = array_map(
                fn($order) => $order->toArray(),
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

    /**
     * GET /api/admin/orders/{id}
     */
    public function show(): void
    {
        $id = (int)Request::param('id');

        try {
            $order = $this->service->getById($id);
            if (!$order) {
                $this->error("Order not found.", 404);
                return;
            }
            $this->success($order->toArray());
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    /**
     * POST /api/admin/orders
     */
    public function store(): void
    {
        $data = Request::body();

        try {
            $order = $this->service->createOrder($data);
            $this->success($order->toArray(), "Order placed successfully.", 201);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/admin/orders/{id}
     */
    public function update(): void
    {
        $id = (int)Request::param('id');
        $data = Request::body();

        try {
            $orderStatus = $data['order_status'] ?? 'PENDING';
            $paymentStatus = $data['payment_status'] ?? 'PENDING';
            $success = $this->service->updateOrderStatus($id, $orderStatus, $paymentStatus);
            if ($success) {
                $this->success([], "Order status updated.");
            } else {
                $this->error("Failed to update order status.", 400);
            }
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }
}
