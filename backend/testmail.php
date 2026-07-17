<?php

require 'vendor/autoload.php';

use App\Core\Env;
use App\Services\MailService;

Env::load(__DIR__);

$mailService = new MailService();

$result = $mailService->sendOTP(
    "pande.prakhar007@gmail.com",   // Change if needed
    "123456"
);

if ($result) {
    echo "Email sent successfully!";
} else {
    echo "Failed to send email!";
}