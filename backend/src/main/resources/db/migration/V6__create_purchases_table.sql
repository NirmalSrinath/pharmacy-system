CREATE TABLE purchases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL,
    gst_amount DECIMAL(10,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    supplier_name VARCHAR(200),
    invoice_number VARCHAR(100),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
