-- ==============================================================================
-- SMART CANTEEN MANAGEMENT SYSTEM - MYSQL COMMUNITY EDITION DDL SCHEMA
-- Compatible with MySQL 8.x / 9.x & ANSI SQL compliant
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT', -- STUDENT, STAFF, ADMIN
    rfid_tag VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. WALLET TABLE (Integrated RFID Card / UPI Prepaid Balance)
CREATE TABLE IF NOT EXISTS wallet (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    last_recharge_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(30) NOT NULL, -- BREAKFAST, SNACKS, DRINKS, MEALS
    price DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    image_url VARCHAR(500),
    is_veg BOOLEAN NOT NULL DEFAULT TRUE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    prep_time_minutes INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE, -- e.g. #ORD-101
    user_id BIGINT,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PREPARING, READY, COMPLETED, CANCELLED
    payment_method VARCHAR(30) NOT NULL DEFAULT 'WALLET_RFID', -- WALLET_RFID, UPI_QR, CASH_COUNTER
    pickup_time_option VARCHAR(50) NOT NULL DEFAULT 'ASAP (10-15m)',
    estimated_pickup_time TIMESTAMP,
    estimated_prep_minutes INT NOT NULL DEFAULT 10,
    special_instructions VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. ORDER ITEMS TABLE (Line items for each ticket)
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    menu_item_id BIGINT,
    item_name VARCHAR(120) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- 6. INVENTORY / RAW INGREDIENTS TABLE
CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ingredient_name VARCHAR(100) NOT NULL UNIQUE,
    current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL, -- kg, L, packs, pcs, buns
    minimum_threshold DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    last_restocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. NOTIFICATION LOGS (SMS / Push triggers on Order Ready)
CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT,
    phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    message VARCHAR(500) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'SMS', -- SMS, PUSH
    status VARCHAR(20) NOT NULL DEFAULT 'SENT', -- SENT, DELIVERED, FAILED
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory(current_stock, minimum_threshold);
