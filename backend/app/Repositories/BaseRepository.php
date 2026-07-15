<?php

namespace App\Repositories;

use App\Core\Database;
use PDO;

abstract class BaseRepository
{
    protected PDO $db;

    protected string $table;

    /**
     * Every child repository must specify its model.
     */
    protected string $model;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    /**
     * Find by ID
     */
    public function findById(int $id): object|null
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} WHERE id=:id LIMIT 1"
        );

        $stmt->execute([
            ':id'=>$id
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$row){
            return null;
        }

        return new $this->model($row);
    }

    /**
     * Find All
     */
    public function findAll(): array
    {
        $stmt = $this->db->query(
            "SELECT * FROM {$this->table}"
        );

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $models = [];

        foreach($rows as $row){

            $models[] = new $this->model($row);

        }

        return $models;
    }

    /**
     * Delete
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare(
            "DELETE FROM {$this->table} WHERE id=:id"
        );

        return $stmt->execute([
            ':id'=>$id
        ]);
    }

    /**
     * Count
     */
    public function count(): int
    {
        return (int)$this->db
            ->query("SELECT COUNT(*) FROM {$this->table}")
            ->fetchColumn();
    }
}