<?php

namespace App\Models;

class Customer extends BaseModel
{
    private ?int $id;
    private string $name;
    private string $email;
    private ?string $phone;
    private int $ordersCount;
    private float $totalSpent;
    private ?string $createdAt;
    private ?string $updatedAt;

    public function __construct(array $data = [])
    {
        $this->id = $data['id'] ?? null;
        $this->name = $data['name'] ?? '';
        $this->email = $data['email'] ?? '';
        $this->phone = $data['phone'] ?? null;
        $this->ordersCount = (int)($data['orders_count'] ?? 0);
        $this->totalSpent = (float)($data['total_spent'] ?? 0.00);
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'orders_count' => $this->ordersCount,
            'total_spent' => $this->totalSpent,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }

    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getEmail(): string { return $this->email; }
    public function getPhone(): ?string { return $this->phone; }
    public function getOrdersCount(): int { return $this->ordersCount; }
    public function getTotalSpent(): float { return $this->totalSpent; }
    public function getCreatedAt(): ?string { return $this->createdAt; }
    public function getUpdatedAt(): ?string { return $this->updatedAt; }

    public function setId(?int $id): void { $this->id = $id; }
    public function setName(string $name): void { $this->name = $name; }
    public function setEmail(string $email): void { $this->email = $email; }
    public function setPhone(?string $phone): void { $this->phone = $phone; }
    public function setOrdersCount(int $ordersCount): void { $this->ordersCount = $ordersCount; }
    public function setTotalSpent(float $totalSpent): void { $this->totalSpent = $totalSpent; }
}
