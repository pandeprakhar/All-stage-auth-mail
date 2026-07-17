<?php

namespace App\Models;

class Order extends BaseModel
{
    private ?int $id;
    private ?int $customerId;
    private string $orderNumber;
    private float $totalAmount;
    private string $paymentStatus;
    private string $orderStatus;
    private string $shippingName;
    private string $shippingEmail;
    private string $shippingPhone;
    private string $shippingAddress;
    private string $shippingCity;
    private string $shippingPincode;
    private ?string $createdAt;
    private ?string $updatedAt;

    // Joins & relationships
    private ?string $customerName = null;
    private array $items = [];

    public function __construct(array $data = [])
    {
        $this->id = $data['id'] ?? null;
        $this->customerId = isset($data['customer_id']) ? (int)$data['customer_id'] : null;
        $this->orderNumber = $data['order_number'] ?? '';
        $this->totalAmount = (float)($data['total_amount'] ?? 0.00);
        $this->paymentStatus = $data['payment_status'] ?? 'PENDING';
        $this->orderStatus = $data['order_status'] ?? 'PENDING';
        $this->shippingName = $data['shipping_name'] ?? '';
        $this->shippingEmail = $data['shipping_email'] ?? '';
        $this->shippingPhone = $data['shipping_phone'] ?? '';
        $this->shippingAddress = $data['shipping_address'] ?? '';
        $this->shippingCity = $data['shipping_city'] ?? '';
        $this->shippingPincode = $data['shipping_pincode'] ?? '';
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
        $this->customerName = $data['customer_name'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customerId,
            'customer_name' => $this->customerName,
            'order_number' => $this->orderNumber,
            'total_amount' => $this->totalAmount,
            'payment_status' => $this->paymentStatus,
            'order_status' => $this->orderStatus,
            'shipping_name' => $this->shippingName,
            'shipping_email' => $this->shippingEmail,
            'shipping_phone' => $this->shippingPhone,
            'shipping_address' => $this->shippingAddress,
            'shipping_city' => $this->shippingCity,
            'shipping_pincode' => $this->shippingPincode,
            'items' => array_map(fn($item) => $item instanceof OrderItem ? $item->toArray() : $item, $this->items),
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }

    // Getters
    public function getId(): ?int { return $this->id; }
    public function getCustomerId(): ?int { return $this->customerId; }
    public function getOrderNumber(): string { return $this->orderNumber; }
    public function getTotalAmount(): float { return $this->totalAmount; }
    public function getPaymentStatus(): string { return $this->paymentStatus; }
    public function getOrderStatus(): string { return $this->orderStatus; }
    public function getShippingName(): string { return $this->shippingName; }
    public function getShippingEmail(): string { return $this->shippingEmail; }
    public function getShippingPhone(): string { return $this->shippingPhone; }
    public function getShippingAddress(): string { return $this->shippingAddress; }
    public function getShippingCity(): string { return $this->shippingCity; }
    public function getShippingPincode(): string { return $this->shippingPincode; }
    public function getCreatedAt(): ?string { return $this->createdAt; }
    public function getUpdatedAt(): ?string { return $this->updatedAt; }
    public function getCustomerName(): ?string { return $this->customerName; }
    public function getItems(): array { return $this->items; }

    // Setters
    public function setId(?int $id): void { $this->id = $id; }
    public function setCustomerId(?int $customerId): void { $this->customerId = $customerId; }
    public function setOrderNumber(string $orderNumber): void { $this->orderNumber = $orderNumber; }
    public function setTotalAmount(float $totalAmount): void { $this->totalAmount = $totalAmount; }
    public function setPaymentStatus(string $paymentStatus): void { $this->paymentStatus = $paymentStatus; }
    public function setOrderStatus(string $orderStatus): void { $this->orderStatus = $orderStatus; }
    public function setShippingName(string $shippingName): void { $this->shippingName = $shippingName; }
    public function setShippingEmail(string $shippingEmail): void { $this->shippingEmail = $shippingEmail; }
    public function setShippingPhone(string $shippingPhone): void { $this->shippingPhone = $shippingPhone; }
    public function setShippingAddress(string $shippingAddress): void { $this->shippingAddress = $shippingAddress; }
    public function setShippingCity(string $shippingCity): void { $this->shippingCity = $shippingCity; }
    public function setShippingPincode(string $shippingPincode): void { $this->shippingPincode = $shippingPincode; }
    public function setCustomerName(?string $customerName): void { $this->customerName = $customerName; }
    public function setItems(array $items): void { $this->items = $items; }
}
