<?php

namespace App\Repositories;

use App\Models\Otp;
use PDO;

class OtpRepository extends BaseRepository
{
    protected string $table = 'otp_codes';

    protected string $model = Otp::class;

    /**
     * Delete old OTPs of a user
     */
    public function deleteByAdmin(int $adminId): bool
    {
        $stmt = $this->db->prepare(
            "DELETE FROM otp_codes WHERE admin_id = :admin_id"
        );

        return $stmt->execute([
            ':admin_id' => $adminId
        ]);
    }

    /**
     * Save OTP
     */
    public function create(
        int $adminId,
        string $email,
        string $otp,
        string $expiresAt
    ): bool {

        $stmt = $this->db->prepare(
            "INSERT INTO otp_codes
            (
                admin_id,
                email,
                otp,
                expires_at
            )
            VALUES
            (
                :admin_id,
                :email,
                :otp,
                :expires_at
            )"
        );

        return $stmt->execute([

            ':admin_id' => $adminId,

            ':email' => $email,

            ':otp' => $otp,

            ':expires_at' => $expiresAt

        ]);

    }

    /**
     * Find latest OTP
     */
    public function findValidOtp(
        int $adminId,
        string $otp
    ): ?Otp {

        $stmt = $this->db->prepare(

            "SELECT *
            FROM otp_codes
            WHERE admin_id = :admin_id
            AND otp = :otp
            AND is_used = 0
            AND expires_at > NOW()
            ORDER BY id DESC
            LIMIT 1"

        );

        $stmt->execute([

            ':admin_id' => $adminId,

            ':otp' => $otp

        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return new Otp($row);

    }

    /**
     * Mark OTP Used
     */
    public function markUsed(int $id): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE otp_codes
             SET is_used = 1
             WHERE id = :id"
        );

        return $stmt->execute([
            ':id' => $id
        ]);
    }
}