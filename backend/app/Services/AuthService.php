<?php

namespace App\Services;

use App\Repositories\AdminRepository;
use App\Models\Admin;
use Exception;

class AuthService
{
    private AdminRepository $adminRepository;

    public function __construct()
    {
        $this->adminRepository = new AdminRepository();
    }

    /**
     * Authenticate Admin
     */
    public function login(string $email, string $password): Admin
    {
        $admin = $this->adminRepository->findByEmail($email);

        if (!$admin) {
            throw new Exception("Invalid email or password.");
        }

        if (!$admin->isActive()) {
            throw new Exception("Account has been disabled.");
        }

        if (!password_verify($password, $admin->getPassword())) {
            throw new Exception("Invalid email or password.");
        }

        $this->adminRepository->updateLastLogin(
            $admin->getId()
        );

        $this->createSession($admin);

        return $admin;
    }

    /**
     * Create Login Session
     */
    private function createSession(Admin $admin): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $_SESSION['admin'] = [

            'id' => $admin->getId(),

            'name' => $admin->getName(),

            'email' => $admin->getEmail(),

            'role' => $admin->getRole()

        ];
    }

    /**
     * Logout
     */
    public function logout(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $_SESSION = [];

        session_destroy();
    }

    /**
     * Current Logged In User
     */
    public function currentUser(): ?array
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        return $_SESSION['admin'] ?? null;
    }

    /**
     * Check Authentication
     */
    public function check(): bool
    {
        return $this->currentUser() !== null;
    }
}