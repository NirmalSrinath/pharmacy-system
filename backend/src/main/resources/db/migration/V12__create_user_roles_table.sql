-- Create user_roles join table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Migrate existing role_id data to user_roles
INSERT INTO user_roles (user_id, role_id)
SELECT id, role_id FROM users WHERE role_id IS NOT NULL;

-- Drop the FK constraint then the role_id column
ALTER TABLE users DROP FOREIGN KEY users_ibfk_1;
ALTER TABLE users DROP COLUMN role_id;
