<?php

namespace App\Repositories;

use App\Models\Customer;
use PDO;

class CustomerRepository extends BaseRepository
{
    protected string $table = 'customers';
    protected string $model = Customer::class;

    public function findByEmail(string $email): ?Customer
    {
        $stmt = $this->db->prepare("SELECT * FROM customers WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? new Customer($row) : null;
    }

    public function create(Customer $customer): int
    {
        $sql = "INSERT INTO customers (name, email, phone, orders_count, total_spent)
                VALUES (:name, :email, :phone, :orders_count, :total_spent)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':name' => $customer->getName(),
            ':email' => $customer->getEmail(),
            ':phone' => $customer->getPhone(),
            ':orders_count' => $customer->getOrdersCount(),
            ':total_spent' => $customer->getTotalSpent(),
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(Customer $customer): bool
    {
        $sql = "UPDATE customers 
                SET name = :name, email = :email, phone = :phone, 
                    orders_count = :orders_count, total_spent = :total_spent
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':name' => $customer->getName(),
            ':email' => $customer->getEmail(),
            ':phone' => $customer->getPhone(),
            ':orders_count' => $customer->getOrdersCount(),
            ':total_spent' => $customer->getTotalSpent(),
            ':id' => $customer->getId(),
        ]);
    }

    public function findAllPaginated(int $page, int $perPage, ?string $search = null): array
    {
        $offset = ($page - 1) * $perPage;
        $params = [];

        $whereClause = "";
        if ($search) {
            $whereClause = "WHERE name LIKE :search OR email LIKE :search OR phone LIKE :search";
            $params[':search'] = "%$search%";
        }

        $sql = "SELECT * FROM customers $whereClause ORDER BY id DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $data = array_map(fn($row) => new Customer($row), $rows);

        // Count total
        $countSql = "SELECT COUNT(*) FROM customers $whereClause";
        $countStmt = $this->db->prepare($countSql);
        foreach ($params as $key => $val) {
            $countStmt->bindValue($key, $val);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        return ['data' => $data, 'total' => $total];
    }
}
