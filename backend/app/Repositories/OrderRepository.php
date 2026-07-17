<?php

namespace App\Repositories;

use App\Models\Order;
use App\Models\OrderItem;
use PDO;

class OrderRepository extends BaseRepository
{
    protected string $table = 'orders';
    protected string $model = Order::class;

    public function create(Order $order): int
    {
        $sql = "INSERT INTO orders (customer_id, order_number, total_amount, payment_status, order_status, 
                                   shipping_name, shipping_email, shipping_phone, shipping_address, 
                                   shipping_city, shipping_pincode)
                VALUES (:customer_id, :order_number, :total_amount, :payment_status, :order_status, 
                        :shipping_name, :shipping_email, :shipping_phone, :shipping_address, 
                        :shipping_city, :shipping_pincode)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':customer_id' => $order->getCustomerId(),
            ':order_number' => $order->getOrderNumber(),
            ':total_amount' => $order->getTotalAmount(),
            ':payment_status' => $order->getPaymentStatus(),
            ':order_status' => $order->getOrderStatus(),
            ':shipping_name' => $order->getShippingName(),
            ':shipping_email' => $order->getShippingEmail(),
            ':shipping_phone' => $order->getShippingPhone(),
            ':shipping_address' => $order->getShippingAddress(),
            ':shipping_city' => $order->getShippingCity(),
            ':shipping_pincode' => $order->getShippingPincode(),
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function updateStatus(int $id, string $orderStatus, string $paymentStatus): bool
    {
        $sql = "UPDATE orders SET order_status = :order_status, payment_status = :payment_status WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':order_status' => $orderStatus,
            ':payment_status' => $paymentStatus,
            ':id' => $id
        ]);
    }

    public function createItem(OrderItem $item): int
    {
        $sql = "INSERT INTO order_items (order_id, product_id, product_name, price, quantity, size)
                VALUES (:order_id, :product_id, :product_name, :price, :quantity, :size)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':order_id' => $item->getOrderId(),
            ':product_id' => $item->getProductId(),
            ':product_name' => $item->getProductName(),
            ':price' => $item->getPrice(),
            ':quantity' => $item->getQuantity(),
            ':size' => $item->getSize(),
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function findById(int $id): ?Order
    {
        $sql = "SELECT o.*, c.name as customer_name 
                FROM orders o 
                LEFT JOIN customers c ON o.customer_id = c.id 
                WHERE o.id = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        $order = new Order($row);
        $order->setItems($this->findItemsByOrderId($id));
        return $order;
    }

    public function findItemsByOrderId(int $orderId): array
    {
        $sql = "SELECT * FROM order_items WHERE order_id = :order_id ORDER BY id ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':order_id' => $orderId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map(fn($row) => new OrderItem($row), $rows);
    }

    public function findAllPaginated(int $page, int $perPage, ?string $search = null, ?string $paymentStatus = null, ?string $orderStatus = null): array
    {
        $offset = ($page - 1) * $perPage;
        $params = [];
        $conditions = [];

        if ($search) {
            $conditions[] = "(o.order_number LIKE :search OR o.shipping_name LIKE :search OR o.shipping_email LIKE :search)";
            $params[':search'] = "%$search%";
        }

        if ($paymentStatus) {
            $conditions[] = "o.payment_status = :payment_status";
            $params[':payment_status'] = $paymentStatus;
        }

        if ($orderStatus) {
            $conditions[] = "o.order_status = :order_status";
            $params[':order_status'] = $orderStatus;
        }

        $whereClause = "";
        if (!empty($conditions)) {
            $whereClause = "WHERE " . implode(" AND ", $conditions);
        }

        $sql = "SELECT o.*, c.name as customer_name 
                FROM orders o 
                LEFT JOIN customers c ON o.customer_id = c.id 
                $whereClause 
                ORDER BY o.id DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $data = [];
        foreach ($rows as $row) {
            $order = new Order($row);
            $order->setItems($this->findItemsByOrderId($order->getId()));
            $data[] = $order;
        }

        // Count total
        $countSql = "SELECT COUNT(*) FROM orders o $whereClause";
        $countStmt = $this->db->prepare($countSql);
        foreach ($params as $key => $val) {
            $countStmt->bindValue($key, $val);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        return ['data' => $data, 'total' => $total];
    }
}
