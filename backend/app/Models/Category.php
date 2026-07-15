<?php

namespace App\Models;

class Category extends BaseModel
{
    private ?int $id;

    private string $name;

    private string $slug;

    private ?string $description;

    private ?string $image;

    private ?string $banner;

    private int $sortOrder;

    private string $status;

    public function __construct(array $data = [])
    {
        $this->id = $data['id'] ?? null;

        $this->name = $data['name'] ?? '';

        $this->slug = $data['slug'] ?? '';

        $this->description = $data['description'] ?? null;

        $this->image = $data['image'] ?? null;

        $this->banner = $data['banner'] ?? null;

        $this->sortOrder = (int)($data['sort_order'] ?? 0);

        $this->status = $data['status'] ?? 'ACTIVE';
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function getBanner(): ?string
    {
        return $this->banner;
    }

    public function getSortOrder(): int
    {
        return $this->sortOrder;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setName(string $name): void
    {
        $this->name = trim($name);
    }

    public function setSlug(string $slug): void
    {
        $this->slug = $slug;
    }

    public function setDescription(?string $description): void
    {
        $this->description = $description;
    }

    public function setImage(?string $image): void
    {
        $this->image = $image;
    }

    public function setBanner(?string $banner): void
    {
        $this->banner = $banner;
    }

    public function setSortOrder(int $sortOrder): void
    {
        $this->sortOrder = $sortOrder;
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
    }

    // public function toArray(): array
    // {
    //     return [

    //         'id'=>$this->id,

    //         'name'=>$this->name,

    //         'slug'=>$this->slug,

    //         'description'=>$this->description,

    //         'image'=>$this->image,

    //         'banner'=>$this->banner,

    //         'sort_order'=>$this->sortOrder,

    //         'status'=>$this->status

    //     ];
    // }
}