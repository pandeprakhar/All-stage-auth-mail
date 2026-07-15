<?php

namespace App\Services;

use App\Helpers\SlugHelper;
use App\Models\Category;
use App\Repositories\CategoryRepository;
use Exception;

class CategoryService
{
    private CategoryRepository $repository;

    public function __construct()
    {
        $this->repository = new CategoryRepository();
    }

    /**
     * Create Category
     */
    public function create(array $data): Category
    {
        $slug = SlugHelper::generate($data['name']);

        if ($this->repository->findBySlug($slug)) {
            throw new Exception("Category already exists.");
        }

        $category = new Category();

        $category->setName($data['name']);
        $category->setSlug($slug);
        $category->setDescription($data['description'] ?? null);
        $category->setImage($data['image'] ?? null);
        $category->setBanner($data['banner'] ?? null);
        $category->setSortOrder((int)($data['sort_order'] ?? 0));
        $category->setStatus($data['status'] ?? 'ACTIVE');

        $id = $this->repository->create($category);

        $created = $this->repository->findById($id);

        if (!$created instanceof Category) {
            throw new Exception("Failed to load newly created category.");
        }

        return $created;
    }

    /**
     * Get All Categories
     */
    public function getAll(): array
    {
        return $this->repository->findAll();
    }

    /**
     * Get Category By ID
     */
    public function get(int $id): ?Category
    {
        $category = $this->repository->findById($id);

        return $category instanceof Category ? $category : null;
    }

    /**
     * Delete Category
     */
    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }
}