CREATE TABLE sales (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(15),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) DEFAULT 'CASH',
    created_by BIGINT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
