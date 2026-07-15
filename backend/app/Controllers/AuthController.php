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
}