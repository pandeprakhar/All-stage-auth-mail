<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;
use App\Validators\LoginValidator;
use Exception;

class AuthController
{
    private AuthService $authService;

    public function __construct()
    {
        $this->authService = new AuthService();
    }

    /**
     * POST /api/auth/login
     */
    public function login(): void
    {
        $data = Request::body();

        $validator = new LoginValidator();

        $validation = $validator->validate($data);

        if (!$validation['valid']) {

            Response::error(
                "Validation Failed",
                422,
                $validation['errors']
            );

        }

        try {

           $result = $this->authService->login(
               $data['email'],
               $data['password']
           );

           Response::success(
               $result,
               "OTP sent successfully."
           );

        } catch (Exception $e) {

            Response::error(
                $e->getMessage(),
                401
            );

        }
    }
/**
 * Forgot Password
 */
public function forgotPassword(): void
{
    try {

        $data = Request::body();

        if (empty($data['email'])) {
            Response::error(
                "Email is required.",
                422
            );
            return;
        }

        $result = $this->authService->forgotPassword(
            $data['email']
        );

        Response::success(
            $result,
            "OTP sent successfully."
        );

    } catch (Exception $e) {

        Response::error(
            $e->getMessage(),
            400
        );

    }
}
    public function verifyOtp(): void
    {
        $data = Request::body();

        try {

            $result = $this->authService->verifyOtp(
                (int)$data['adminId'],
                $data['otp']
            );

            Response::success(
                $result,
                "Login Successful"
            );

        } catch (Exception $e) {

            Response::error(
                $e->getMessage(),
                401
            );

        }
    }

    /**
     * POST /logout
     */
    public function logout(): void
    {
        $this->authService->logout();

        Response::success(
            [],
            "Logout Successful"
        );
    }

    /**
     * GET /me
     */
    public function me(): void
    {
        $user = $this->authService->currentUser();

        if (!$user) {

            Response::error(
                "Unauthenticated",
                401
            );

        }

        Response::success($user);
    }
    /**
     * Verify Forgot Password OTP
     */
    public function verifyForgotOtp(): void
    {
        try {

            $data = Request::body();

            if (
                empty($data['adminId']) ||
                empty($data['otp'])
            ) {

                Response::error(
                    "Admin ID and OTP are required.",
                    422
                );

                return;
            }

            $this->authService->verifyForgotOtp(
                (int)$data['adminId'],
                $data['otp']
            );

            Response::success(
                null,
                "OTP verified successfully."
            );

        } catch (Exception $e) {

            Response::error(
                $e->getMessage(),
                400
            );

        }
    }
    /**
     * Reset Password
     */
    public function resetPassword(): void
    {
        try {

            $data = Request::body();

            if (
                empty($data['adminId']) ||
                empty($data['password']) ||
                empty($data['confirmPassword'])
            ) {
                Response::error(
                    "All fields are required.",
                    422
                );
                return;
            }

            $this->authService->resetPassword(
                (int)$data['adminId'],
                $data['password'],
                $data['confirmPassword']
            );

            Response::success(
                null,
                "Password reset successfully."
            );

        } catch (Exception $e) {

            Response::error(
                $e->getMessage(),
                400
            );

        }
    }
}