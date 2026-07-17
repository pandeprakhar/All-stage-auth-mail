<?php

namespace App\Models;

class OrderItem extends BaseModel
{
    private ?int $id;
    private int $orderId;
    private int $productId;
    private string $productName;
    private float $price;
    private int $quantity;
    private ?string $size;
    private ?string $createdAt;

    public function __construct(array $data = [])
    {
        $this->id = $data['id'] ?? null;
        $this->orderId = (int)($data['order_id'] ?? 0);
        $this->productId = (int)($data['product_id'] ?? 0);
        $this->productName = $data['product_name'] ?? '';
        $this->price = (float)($data['price'] ?? 0.00);
        $this->quantity = (int)($data['quantity'] ?? 0);
        $this->size = $data['size'] ?? null;
        $this->createdAt = $data['created_at'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->orderId,
            'product_id' => $this->productId,
            'product_name' => $this->productName,
            'price' => $this->price,
            'quantity' => $this->quantity,
            'size' => $this->size,
            'created_at' => $this->createdAt,
        ];
    }

    // Getters
    public function getId(): ?int { return $this->id; }
    public function getOrderId(): int { return $this->orderId; }
    public function getProductId(): int { return $this->productId; }
    public function getProductName(): string { return $this->productName; }
    public function getPrice(): float { return $this->price; }
    public function getQuantity(): int { return $this->quantity; }
    public function getSize(): ?string { return $this->size; }
    public function getCreatedAt(): ?string { return $this->createdAt; }

    // Setters
    public function setId(?int $id): void { $this->id = $id; }
    public function setOrderId(int $orderId): void { $this->orderId = $orderId; }
    public function setProductId(int $productId): void { $this->productId = $productId; }
    public function setProductName(string $productName): void { $this->productName = $productName; }
    public function setPrice(float $price): void { $this->price = $price; }
    public function setQuantity(int $quantity): void { $this->quantity = $quantity; }
    public function setSize(?string $size): void { $this->size = $size; }
}
