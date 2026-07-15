<?php

namespace App\Models;

class Admin extends BaseModel
{
    private ?int $id;
    private string $name;
    private string $email;
    private string $password;
    private string $role;
    private string $status;
    private ?string $lastLogin;
    private ?string $createdAt;
    private ?string $updatedAt;

    public function __construct(array $data = [])
    {
        $this->id         = $data['id'] ?? null;
        $this->name       = $data['name'] ?? '';
        $this->email      = $data['email'] ?? '';
        $this->password   = $data['password'] ?? '';
        $this->role       = $data['role'] ?? 'ADMIN';
        $this->status     = $data['status'] ?? 'ACTIVE';
        $this->lastLogin  = $data['last_login'] ?? null;
        $this->createdAt  = $data['created_at'] ?? null;
        $this->updatedAt  = $data['updated_at'] ?? null;
    }

    /*
    |--------------------------------------------------------------------------
    | Getters
    |--------------------------------------------------------------------------
    */

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getLastLogin(): ?string
    {
        return $this->lastLogin;
    }

    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?string
    {
        return $this->updatedAt;
    }

    /*
    |--------------------------------------------------------------------------
    | Setters
    |--------------------------------------------------------------------------
    */

    public function setName(string $name): void
    {
        $this->name = trim($name);
    }

    public function setEmail(string $email): void
    {
        $this->email = strtolower(trim($email));
    }

    public function setPassword(string $password): void
    {
        $this->password = $password;
    }

    public function setRole(string $role): void
    {
        $this->role = $role;
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
    }

    public function setLastLogin(?string $lastLogin): void
    {
        $this->lastLogin = $lastLogin;
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'SUPER_ADMIN';
    }

    public function toArray(): array
    {
        return [

            'id' => $this->id,

            'name' => $this->name,

            'email' => $this->email,

            'role' => $this->role,

            'status' => $this->status,

            'last_login' => $this->lastLogin,

            'created_at' => $this->createdAt,

            'updated_at' => $this->updatedAt
        ];
    }
}