CREATE TABLE IF NOT EXISTS suppliers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(200),
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(200),
    gstin VARCHAR(20),
    drug_license_number VARCHAR(100),
    address TEXT,
    state VARCHAR(100),
    pincode VARCHAR(10),
    pan_number VARCHAR(20),
    bank_name VARCHAR(200),
    bank_account_number VARCHAR(50),
    bank_ifsc VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
