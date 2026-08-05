CREATE TABLE backup_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    file_size BIGINT,
    backup_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    email_sent BOOLEAN DEFAULT FALSE,
    onedrive_uploaded BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
