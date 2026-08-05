-- V1 already seeded roles. This migration ensures they exist for safety.
INSERT IGNORE INTO roles (id, name) VALUES (1, 'ADMIN');
INSERT IGNORE INTO roles (id, name) VALUES (2, 'PHARMACIST');
INSERT IGNORE INTO roles (id, name) VALUES (3, 'SALESPERSON');
