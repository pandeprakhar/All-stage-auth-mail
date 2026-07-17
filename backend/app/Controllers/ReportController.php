<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Database;
use PDO;
use Exception;

class ReportController extends BaseController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * GET /api/admin/reports/summary
     */
    public function summary(): void
    {
        $startDate = Request::query('start_date');
        $endDate = Request::query('end_date');

        $params = [];
        $dateCond = "";
        if (!empty($startDate) && !empty($endDate)) {
            $dateCond = " AND created_at BETWEEN :start_date AND :end_date ";
            $params[':start_date'] = $startDate . " 00:00:00";
            $params[':end_date'] = $endDate . " 23:59:59";
        }

        try {
            // Total Customers (registered in this period)
            $custStmt = $this->db->prepare("SELECT COUNT(*) FROM customers WHERE 1=1" . $dateCond);
            $custStmt->execute($params);
            $totalCustomers = (int)$custStmt->fetchColumn();

            // Total Orders (placed in this period)
            $ordersStmt = $this->db->prepare("SELECT COUNT(*) FROM orders WHERE 1=1" . $dateCond);
            $ordersStmt->execute($params);
            $totalOrders = (int)$ordersStmt->fetchColumn();

            // Total Products (added in this period)
            $prodStmt = $this->db->prepare("SELECT COUNT(*) FROM products WHERE 1=1" . $dateCond);
            $prodStmt->execute($params);
            $totalProducts = (int)$prodStmt->fetchColumn();

            // Total Categories
            $catStmt = $this->db->query("SELECT COUNT(*) FROM categories");
            $totalCategories = (int)$catStmt->fetchColumn();

            // Total Revenue
            $revStmt = $this->db->prepare("SELECT COALESCE(SUM(total_amount), 0.00) FROM orders WHERE order_status != 'CANCELLED'" . $dateCond);
            $revStmt->execute($params);
            $totalRevenue = (float)$revStmt->fetchColumn();

            // Pending Orders
            $pendingStmt = $this->db->prepare("SELECT COUNT(*) FROM orders WHERE order_status = 'PENDING'" . $dateCond);
            $pendingStmt->execute($params);
            $pendingOrders = (int)$pendingStmt->fetchColumn();

            // Completed Orders
            $completedStmt = $this->db->prepare("SELECT COUNT(*) FROM orders WHERE order_status = 'COMPLETED'" . $dateCond);
            $completedStmt->execute($params);
            $completedOrders = (int)$completedStmt->fetchColumn();

            // Cancelled Orders
            $cancelledStmt = $this->db->prepare("SELECT COUNT(*) FROM orders WHERE order_status = 'CANCELLED'" . $dateCond);
            $cancelledStmt->execute($params);
            $cancelledOrders = (int)$cancelledStmt->fetchColumn();

            // Low Stock Products (total stock <= 5)
            $lowStockStmt = $this->db->query("
                SELECT COUNT(*) FROM (
                    SELECT product_id, SUM(quantity) as stock 
                    FROM inventory 
                    GROUP BY product_id
                ) as s WHERE s.stock <= 5 AND s.stock > 0
            ");
            $lowStock = (int)$lowStockStmt->fetchColumn();

            // Out of Stock Products (total stock = 0 or missing)
            $outOfStockStmt = $this->db->query("
                SELECT COUNT(*) FROM products p 
                LEFT JOIN (
                    SELECT product_id, SUM(quantity) as stock 
                    FROM inventory 
                    GROUP BY product_id
                ) as s ON p.id = s.product_id 
                WHERE s.stock IS NULL OR s.stock = 0
            ");
            $outOfStock = (int)$outOfStockStmt->fetchColumn();

            $this->success([
                'total_customers' => $totalCustomers,
                'total_orders' => $totalOrders,
                'total_products' => $totalProducts,
                'total_categories' => $totalCategories,
                'total_revenue' => $totalRevenue,
                'pending_orders' => $pendingOrders,
                'completed_orders' => $completedOrders,
                'cancelled_orders' => $cancelledOrders,
                'low_stock' => $lowStock,
                'out_of_stock' => $outOfStock
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/admin/reports/orders
     */
    public function orders(): void
    {
        $page = (int)Request::query('page', 1);
        $perPage = (int)Request::query('per_page', 25);
        $search = Request::query('search');
        $orderStatus = Request::query('order_status');
        $paymentStatus = Request::query('payment_status');
        $startDate = Request::query('start_date');
        $endDate = Request::query('end_date');

        $offset = ($page - 1) * $perPage;
        $params = [];
        $conditions = ["1=1"];

        if (!empty($search)) {
            $conditions[] = "(o.order_number LIKE :search OR o.shipping_name LIKE :search OR o.shipping_email LIKE :search)";
            $params[':search'] = "%$search%";
        }
        if (!empty($orderStatus)) {
            $conditions[] = "o.order_status = :order_status";
            $params[':order_status'] = $orderStatus;
        }
        if (!empty($paymentStatus)) {
            $conditions[] = "o.payment_status = :payment_status";
            $params[':payment_status'] = $paymentStatus;
        }
        if (!empty($startDate) && !empty($endDate)) {
            $conditions[] = "o.created_at BETWEEN :start_date AND :end_date";
            $params[':start_date'] = $startDate . " 00:00:00";
            $params[':end_date'] = $endDate . " 23:59:59";
        }

        $whereClause = "WHERE " . implode(" AND ", $conditions);

        try {
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

            // Fetch line items for each order
            $formatted = [];
            foreach ($rows as $row) {
                $itemStmt = $this->db->prepare("SELECT * FROM order_items WHERE order_id = :order_id");
                $itemStmt->execute([':order_id' => $row['id']]);
                $row['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
                $formatted[] = $row;
            }

            // Count total
            $countStmt = $this->db->prepare("SELECT COUNT(*) FROM orders o $whereClause");
            foreach ($params as $key => $val) {
                $countStmt->bindValue($key, $val);
            }
            $countStmt->execute();
            $total = (int)$countStmt->fetchColumn();

            $this->success([
                'data' => $formatted,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/admin/reports/customers
     */
    public function customers(): void
    {
        $page = (int)Request::query('page', 1);
        $perPage = (int)Request::query('per_page', 25);
        $search = Request::query('search');
        $startDate = Request::query('start_date');
        $endDate = Request::query('end_date');

        $offset = ($page - 1) * $perPage;
        $params = [];
        $conditions = ["1=1"];

        if (!empty($search)) {
            $conditions[] = "(name LIKE :search OR email LIKE :search OR phone LIKE :search)";
            $params[':search'] = "%$search%";
        }
        if (!empty($startDate) && !empty($endDate)) {
            $conditions[] = "created_at BETWEEN :start_date AND :end_date";
            $params[':start_date'] = $startDate . " 00:00:00";
            $params[':end_date'] = $endDate . " 23:59:59";
        }

        $whereClause = "WHERE " . implode(" AND ", $conditions);

        try {
            $sql = "SELECT c.*, 
                    (SELECT MAX(created_at) FROM orders WHERE customer_id = c.id) as last_order_date
                    FROM customers c
                    $whereClause 
                    ORDER BY id DESC 
                    LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $val) {
                $stmt->bindValue($key, $val);
            }
            $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Count total
            $countStmt = $this->db->prepare("SELECT COUNT(*) FROM customers $whereClause");
            foreach ($params as $key => $val) {
                $countStmt->bindValue($key, $val);
            }
            $countStmt->execute();
            $total = (int)$countStmt->fetchColumn();

            $this->success([
                'data' => $rows,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/admin/reports/products
     */
    public function products(): void
    {
        $page = (int)Request::query('page', 1);
        $perPage = (int)Request::query('per_page', 25);
        $search = Request::query('search');
        $categoryId = Request::query('category_id');
        $startDate = Request::query('start_date');
        $endDate = Request::query('end_date');

        $offset = ($page - 1) * $perPage;
        $params = [];
        $conditions = ["1=1"];

        if (!empty($search)) {
            $conditions[] = "(p.name LIKE :search OR p.sku LIKE :search)";
            $params[':search'] = "%$search%";
        }
        if (!empty($categoryId)) {
            $conditions[] = "p.category_id = :category_id";
            $params[':category_id'] = $categoryId;
        }

        $whereClause = "WHERE " . implode(" AND ", $conditions);

        // Date conditions for sales aggregate subqueries
        $salesDateCond1 = "";
        $salesDateCond2 = "";
        $subParams = [];
        if (!empty($startDate) && !empty($endDate)) {
            $salesDateCond1 = " AND o.created_at BETWEEN :sub_start_1 AND :sub_end_1";
            $salesDateCond2 = " AND o.created_at BETWEEN :sub_start_2 AND :sub_end_2";
            $subParams[':sub_start_1'] = $startDate . " 00:00:00";
            $subParams[':sub_end_1'] = $endDate . " 23:59:59";
            $subParams[':sub_start_2'] = $startDate . " 00:00:00";
            $subParams[':sub_end_2'] = $endDate . " 23:59:59";
        }

        try {
            $sql = "SELECT p.id, p.name, p.sku, p.status,
                    c.name as category_name, b.name as brand_name,
                    COALESCE((SELECT SUM(quantity) FROM inventory WHERE product_id = p.id), 0) as current_stock,
                    COALESCE((SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = p.id AND o.order_status != 'CANCELLED' $salesDateCond1), 0) as units_sold,
                    COALESCE((SELECT SUM(oi.price * oi.quantity) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = p.id AND o.order_status != 'CANCELLED' $salesDateCond2), 0.00) as revenue
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    LEFT JOIN brands b ON p.brand_id = b.id
                    $whereClause 
                    ORDER BY revenue DESC, units_sold DESC
                    LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $val) {
                $stmt->bindValue($key, $val);
            }
            foreach ($subParams as $key => $val) {
                $stmt->bindValue($key, $val);
            }
            $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Count total
            $countStmt = $this->db->prepare("SELECT COUNT(*) FROM products p $whereClause");
            foreach ($params as $key => $val) {
                $countStmt->bindValue($key, $val);
            }
            $countStmt->execute();
            $total = (int)$countStmt->fetchColumn();

            $this->success([
                'data' => $rows,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/admin/reports/charts
     */
    public function charts(): void
    {
        $startDate = Request::query('start_date');
        $endDate = Request::query('end_date');

        $params = [];
        $dateCond = "";
        if (!empty($startDate) && !empty($endDate)) {
            $dateCond = " AND o.created_at BETWEEN :start_date AND :end_date ";
            $params[':start_date'] = $startDate . " 00:00:00";
            $params[':end_date'] = $endDate . " 23:59:59";
        }

        try {
            // 1. Revenue & Orders Trend
            $trendSql = "
                SELECT DATE(o.created_at) as label, 
                       COALESCE(SUM(o.total_amount), 0.00) as revenue, 
                       COUNT(o.id) as orders
                FROM orders o
                WHERE o.order_status != 'CANCELLED' $dateCond
                GROUP BY DATE(o.created_at)
                ORDER BY DATE(o.created_at) ASC
            ";
            $trendStmt = $this->db->prepare($trendSql);
            $trendStmt->execute($params);
            $revenueTrend = $trendStmt->fetchAll(PDO::FETCH_ASSOC);

            // 2. Top Selling Products
            $topProdSql = "
                SELECT p.name, 
                       SUM(oi.quantity) as value, 
                       SUM(oi.price * oi.quantity) as revenue
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                WHERE o.order_status != 'CANCELLED' $dateCond
                GROUP BY oi.product_id
                ORDER BY value DESC
                LIMIT 5
            ";
            $topProdStmt = $this->db->prepare($topProdSql);
            $topProdStmt->execute($params);
            $topProducts = $topProdStmt->fetchAll(PDO::FETCH_ASSOC);

            // 3. Top Categories
            $topCatSql = "
                SELECT c.name, 
                       SUM(oi.quantity) as value, 
                       SUM(oi.price * oi.quantity) as revenue
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                JOIN categories c ON p.category_id = c.id
                WHERE o.order_status != 'CANCELLED' $dateCond
                GROUP BY c.id
                ORDER BY value DESC
                LIMIT 5
            ";
            $topCatStmt = $this->db->prepare($topCatSql);
            $topCatStmt->execute($params);
            $topCategories = $topCatStmt->fetchAll(PDO::FETCH_ASSOC);

            // 4. Order Status Distribution
            $statusParams = [];
            $statusDateCond = "";
            if (!empty($startDate) && !empty($endDate)) {
                $statusDateCond = " WHERE created_at BETWEEN :start_date AND :end_date ";
                $statusParams[':start_date'] = $startDate . " 00:00:00";
                $statusParams[':end_date'] = $endDate . " 23:59:59";
            }

            $distSql = "
                SELECT order_status as name, 
                       COUNT(*) as value
                FROM orders
                $statusDateCond
                GROUP BY order_status
            ";
            $distStmt = $this->db->prepare($distSql);
            $distStmt->execute($statusParams);
            $statusDistribution = $distStmt->fetchAll(PDO::FETCH_ASSOC);

            $this->success([
                'revenue_trend' => $revenueTrend,
                'top_products' => $topProducts,
                'top_categories' => $topCategories,
                'status_distribution' => $statusDistribution
            ]);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }
}
