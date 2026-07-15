-- =====================================================
-- ALLSTAG ECOMMERCE DATABASE SCHEMA
-- Module 1 : Authentication
-- =====================================================

CREATE DATABASE IF NOT EXISTS allstag
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE allstag;

-- =====================================================
-- ADMINS
-- =====================================================

CREATE TABLE admins (

    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    role ENUM(
        'SUPER_ADMIN',
        'ADMIN',
        'MANAGER'
    ) DEFAULT 'ADMIN',

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    last_login DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP

);