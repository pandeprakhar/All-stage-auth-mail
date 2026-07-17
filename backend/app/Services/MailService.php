<?php

namespace App\Services;

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

class MailService
{
    private PHPMailer $mail;

    public function __construct()
    {
        $this->mail = new PHPMailer(true);

        // SMTP Configuration
        $this->mail->isSMTP();
        $this->mail->Host = $_ENV['MAIL_HOST'];
        $this->mail->SMTPAuth = true;
        $this->mail->Username = $_ENV['MAIL_USERNAME'];
        $this->mail->Password = $_ENV['MAIL_PASSWORD'];
        $this->mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $this->mail->Port = (int) $_ENV['MAIL_PORT'];

        // Sender
        $this->mail->setFrom(
            $_ENV['MAIL_FROM'],
            $_ENV['MAIL_FROM_NAME']
        );

        $this->mail->isHTML(true);
    }

    /**
     * Generic Email Sender
     */
    public function send(
        string $to,
        string $subject,
        string $body
    ): bool {

        try {

            $this->mail->clearAddresses();

            $this->mail->addAddress($to);

            $this->mail->Subject = $subject;

            $this->mail->Body = $body;

            return $this->mail->send();

        } catch (Exception $e) {

            error_log($e->getMessage());

            return false;
        }
    }

    /**
     * Login OTP
     */
    public function sendOTP(
        string $email,
        string $otp
    ): bool {

        $subject = "Your Login OTP";

        $body = "

        <div style='font-family:Arial;padding:30px'>

            <h2>AllStage Login Verification</h2>

            <p>Your One Time Password is</p>

            <h1
                style='
                    letter-spacing:5px;
                    color:#2563eb;
                    font-size:40px;
                '
            >

            {$otp}

            </h1>

            <p>

            This OTP is valid for only

            <b>5 minutes.</b>

            </p>

            <br>

            <p>

            If you didn't request this,

            ignore this email.

            </p>

        </div>

        ";

        return $this->send(

            $email,

            $subject,

            $body

        );
    }

    /**
     * Forgot Password Email
     */
    public function sendPasswordResetOTP(
        string $email,
        string $otp
    ): bool {

        $subject = "Reset Password OTP";

        $body = "

        <div style='font-family:Arial;padding:30px'>

        <h2>Password Reset</h2>

        <p>

        Use this OTP to reset your password.

        </p>

        <h1
        style='
        color:red;
        letter-spacing:5px;
        '
        >

        {$otp}

        </h1>

        <p>

        Expires in 5 minutes.

        </p>

        </div>

        ";

        return $this->send(
            $email,
            $subject,
            $body
        );
    }

    /**
     * Registration Email
     */
    public function sendVerificationOTP(
        string $email,
        string $otp
    ): bool {

        return $this->sendOTP(
            $email,
            $otp
        );

    }

    /**
     * Order Confirmation
     */
    public function sendOrderConfirmation(
        string $email,
        string $customer,
        string $orderNumber
    ): bool {

        $subject = "Order Confirmation";

        $body = "

        <h2>Hello {$customer}</h2>

        <p>

        Your order has been placed successfully.

        </p>

        <h3>

        Order Number:

        {$orderNumber}

        </h3>

        ";

        return $this->send(
            $email,
            $subject,
            $body
        );

    }

    /**
     * Invoice Email
     */
    public function sendInvoice(
        string $email,
        string $customer,
        string $invoiceNumber
    ): bool {

        $subject = "Invoice";

        $body = "

        <h2>Hello {$customer}</h2>

        <p>

        Your invoice has been generated.

        </p>

        <h3>

        Invoice No:

        {$invoiceNumber}

        </h3>

        ";

        return $this->send(
            $email,
            $subject,
            $body
        );

    }
}