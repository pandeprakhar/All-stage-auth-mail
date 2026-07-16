<?php

namespace App\Repositories;

use App\Models\Admin;
use PDO;

class AdminRepository extends BaseRepository
{
    protected string $table = 'admins';
    protected string $model = Admin::class;

    /**
     * Find admin by email
     */
    public function findByEmail(string $email): ?Admin
    {
        $sql = "SELECT * FROM {$this->table}
                WHERE email = :email
                LIMIT 1";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            ':email' => strtolower(trim($email))
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return new Admin($row);
    }

    /**
     * Find admin by ID
     */
    public function find(int $id): ?Admin
    {
        $sql = "SELECT * FROM {$this->table}
                WHERE id = :id
                LIMIT 1";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            ':id' => $id
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return new Admin($row);
    }

    /**
     * Update last login
     */
    public function updateLastLogin(int $id): bool
    {
        $sql = "UPDATE {$this->table}
                SET last_login = NOW()
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([
            ':id' => $id
        ]);
    }

    /**
     * Create Admin
     */
    public function create(Admin $admin): int
    {
        $sql = "INSERT INTO {$this->table}
        (
            name,
            email,
            password,
            role,
            status
        )
        VALUES
        (
            :name,
            :email,
            :password,
            :role,
            :status
        )";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            ':name' => $admin->getName(),
            ':email' => $admin->getEmail(),
            ':password' => $admin->getPassword(),
            ':role' => $admin->getRole(),
            ':status' => $admin->getStatus()
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Check Email Exists
     */
    public function emailExists(string $email): bool
    {
        $sql = "SELECT COUNT(*)
                FROM {$this->table}
                WHERE email = :email";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            ':email' => strtolower(trim($email))
        ]);

        return $stmt->fetchColumn() > 0;
    }
   /**
    * Update Password
    */
   public function updatePassword(
       int $id,
       string $password
   ): bool
   {
       $sql = "UPDATE {$this->table}
               SET password = :password
               WHERE id = :id";

       $stmt = $this->db->prepare($sql);

       return $stmt->execute([
           ':id' => $id,
           ':password' => $password
       ]);
   }
}