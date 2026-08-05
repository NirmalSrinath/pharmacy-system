CREATE TABLE returns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT,
    medicine_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(500),
    refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
