<?php

namespace App\Models;

class Brand extends BaseModel
{
    private ?int $id;
    private string $name;
    private string $slug;
    private ?string $description;
    private ?string $logo;
    private ?string $website;
    private int $sortOrder;
    private string $status;
    private ?string $createdAt;
    private ?string $updatedAt;

    public function __construct(array $data = [])
    {
        $this->id = $data['id'] ?? null;
        $this->name = $data['name'] ?? '';
        $this->slug = $data['slug'] ?? '';
        $this->description = $data['description'] ?? null;
        $this->logo = $data['logo'] ?? null;
        $this->website = $data['website'] ?? null;
        $this->sortOrder = (int)($data['sort_order'] ?? 0);
        $this->status = $data['status'] ?? 'ACTIVE';
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): string { return $this->name; }

    public function getSlug(): string { return $this->slug; }

    public function getDescription(): ?string { return $this->description; }

    public function getLogo(): ?string { return $this->logo; }

    public function getWebsite(): ?string { return $this->website; }

    public function getSortOrder(): int { return $this->sortOrder; }

    public function getStatus(): string { return $this->status; }

    public function setName(string $name): void
    {
        $this->name = trim($name);
    }

    public function setSlug(string $slug): void
    {
        $this->slug = strtolower(trim($slug));
    }

    public function setDescription(?string $description): void
    {
        $this->description = $description;
    }

    public function setLogo(?string $logo): void
    {
        $this->logo = $logo;
    }

    public function setWebsite(?string $website): void
    {
        $this->website = $website;
    }

    public function setSortOrder(int $sortOrder): void
    {
        $this->sortOrder = $sortOrder;
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
    }

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }

    // public function toArray(): array
    // {
    //     return [

    //         'id'=>$this->id,

    //         'name'=>$this->name,

    //         'slug'=>$this->slug,

    //         'description'=>$this->description,

    //         'logo'=>$this->logo,

    //         'website'=>$this->website,

    //         'sort_order'=>$this->sortOrder,

    //         'status'=>$this->status

    //     ];
    // }
}