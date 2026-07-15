CREATE TABLE categories (

    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    slug VARCHAR(120) NOT NULL UNIQUE,

    description TEXT NULL,

    image VARCHAR(255) NULL,

    banner VARCHAR(255) NULL,

    sort_order INT DEFAULT 0,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP

);

CREATE INDEX idx_category_name
ON categories(name);

CREATE INDEX idx_category_status
ON categories(status);