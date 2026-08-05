ALTER TABLE medicines ADD COLUMN rack_number VARCHAR(50) AFTER low_stock_threshold;
ALTER TABLE medicines ADD COLUMN type VARCHAR(50) AFTER rack_number;
