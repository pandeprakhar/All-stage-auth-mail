CREATE TABLE otp_codes (

                           id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                           admin_id INT UNSIGNED NOT NULL,

                           email VARCHAR(150) NOT NULL,

                           otp VARCHAR(6) NOT NULL,

                           expires_at DATETIME NOT NULL,

                           is_used TINYINT(1) DEFAULT 0,

                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                           INDEX(admin_id),
                           INDEX(email),

                           CONSTRAINT fk_otp_admin
                               FOREIGN KEY (admin_id)
                                   REFERENCES admins(id)
                                   ON DELETE CASCADE

);