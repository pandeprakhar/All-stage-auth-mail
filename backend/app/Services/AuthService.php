<?php

namespace App\Services;

use App\Repositories\AdminRepository;
use App\Repositories\OtpRepository;
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
        public function login(string $email, string $password): array    {
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

        $otpService = new OtpService();

        if (!$otpService->generate($admin)) {
            throw new Exception("Unable to send OTP.");
        }

        return [
            'otpRequired' => true,
            'adminId' => $admin->getId(),
            'email' => $admin->getEmail()
        ];
    }

    /**
     * Forgot Password
     */
    public function forgotPassword(string $email): array
    {
        $admin = $this->adminRepository->findByEmail($email);

        if (!$admin) {
            throw new Exception("No account found with this email.");
        }

        if (!$admin->isActive()) {
            throw new Exception("Account has been disabled.");
        }

        $otpService = new OtpService();

        if (!$otpService->generate($admin)) {
            throw new Exception("Unable to send OTP.");
        }

        return [
            'adminId' => $admin->getId()
        ];
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
    public function verifyOtp(int $adminId, string $otp): array
    {
        $otpRepository = new OtpRepository();

        $otpRecord = $otpRepository->findValidOtp(
            $adminId,
            $otp
        );

        if (!$otpRecord) {
            throw new Exception("Invalid or expired OTP.");
        }

        $otpRepository->markUsed(
            $otpRecord->getId()
        );

        $admin = $this->adminRepository->find($adminId);

        if (!$admin) {
            throw new Exception("Admin not found.");
        }

        $this->adminRepository->updateLastLogin(
            $admin->getId()
        );

        $this->createSession($admin);

        return $admin->toArray();
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
    /**
     * Verify Forgot Password OTP
     */
    public function verifyForgotOtp(int $adminId, string $otp): bool
    {
        $otpRepository = new OtpRepository();

        $otpRecord = $otpRepository->findValidOtp(
            $adminId,
            $otp
        );

        if (!$otpRecord) {
            throw new Exception("Invalid or expired OTP.");
        }

        $otpRepository->markUsed(
            $otpRecord->getId()
        );

        return true;
    }
    /**
     * Reset Password
     */
    public function resetPassword(
        int $adminId,
        string $password,
        string $confirmPassword
    ): void
    {
        if ($password !== $confirmPassword) {
            throw new Exception("Passwords do not match.");
        }

        $admin = $this->adminRepository->find($adminId);

        if (!$admin) {
            throw new Exception("Admin not found.");
        }

        $hashedPassword = password_hash(
            $password,
            PASSWORD_DEFAULT
        );

        if (
            !$this->adminRepository->updatePassword(
                $adminId,
                $hashedPassword
            )
        ) {
            throw new Exception("Unable to reset password.");
        }
    }
}