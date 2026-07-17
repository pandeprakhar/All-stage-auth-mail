<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Repositories\OrderRepository;
use Exception;

class OrderService
{
    private OrderRepository $repository;
    private CustomerService $customerService;

    public function __construct()
    {
        $this->repository = new OrderRepository();
        $this->customerService = new CustomerService();
    }

    public function getAllPaginated(int $page, int $perPage, ?string $search = null, ?string $paymentStatus = null, ?string $orderStatus = null): array
    {
        return $this->repository->findAllPaginated($page, $perPage, $search, $paymentStatus, $orderStatus);
    }

    public function getById(int $id): ?Order
    {
        return $this->repository->findById($id);
    }

    public function createOrder(array $data): Order
    {
        $shipping = $data['shipping'] ?? [];
        $itemsData = $data['items'] ?? [];

        if (empty($itemsData)) {
            throw new Exception("Cannot place an order with empty items list.");
        }

        if (empty($shipping['name']) || empty($shipping['email']) || empty($shipping['phone'])) {
            throw new Exception("Shipping details (name, email, phone) are required.");
        }

        // Calculate total amount
        $totalAmount = 0.0;
        foreach ($itemsData as $item) {
            $price = (float)($item['price'] ?? 0.0);
            $qty = (int)($item['quantity'] ?? 1);
            $totalAmount += $price * $qty;
        }

        // Record customer stats (upsert)
        $customer = $this->customerService->recordOrder(
            $shipping['name'],
            $shipping['email'],
            $shipping['phone'],
            $totalAmount
        );

        // Build Order
        $order = new Order();
        $order->setCustomerId($customer->getId());
        $order->setOrderNumber('ORD-' . strtoupper(dechex(time())) . '-' . rand(1000, 9999));
        $order->setTotalAmount($totalAmount);
        $order->setPaymentStatus($data['payment_status'] ?? 'PENDING');
        $order->setOrderStatus($data['order_status'] ?? 'PENDING');
        $order->setShippingName($shipping['name']);
        $order->setShippingEmail($shipping['email']);
        $order->setShippingPhone($shipping['phone']);
        $order->setShippingAddress($shipping['address'] ?? '');
        $order->setShippingCity($shipping['city'] ?? '');
        $order->setShippingPincode($shipping['pincode'] ?? '');

        // Save order in database
        $orderId = $this->repository->create($order);
        $order->setId($orderId);

        $productRepo = new \App\Repositories\ProductRepository();

        // Save line items
        $orderItems = [];
        foreach ($itemsData as $item) {
            $product = null;
            if (!empty($item['handle'])) {
                $product = $productRepo->findBySlug($item['handle']);
            }

            $orderItem = new OrderItem();
            $orderItem->setOrderId($orderId);
            $orderItem->setProductId($product ? $product->getId() : (int)($item['product_id'] ?? 0));
            $orderItem->setProductName($product ? $product->getName() : ($item['product_name'] ?? 'Unknown Product'));
            $orderItem->setPrice($product ? (float)$product->getSellingPrice() : (float)($item['price'] ?? 0.0));
            $orderItem->setQuantity((int)($item['quantity'] ?? 1));
            $orderItem->setSize($item['size'] ?? null);

            $itemId = $this->repository->createItem($orderItem);
            $orderItem->setId($itemId);
            $orderItems[] = $orderItem;
        }

        $order->setItems($orderItems);
        return $order;
    }

    public function updateOrderStatus(int $id, string $orderStatus, string $paymentStatus): bool
    {
        return $this->repository->updateStatus($id, $orderStatus, $paymentStatus);
    }
}
