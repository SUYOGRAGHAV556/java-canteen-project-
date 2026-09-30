-- ==============================================================================
-- SMART CANTEEN SEED DATA (AUTHENTIC INDIAN CUISINE & CAMPUS PROFILES)
-- ==============================================================================

-- 1. USERS
INSERT INTO users (id, name, email, phone, role, rfid_tag, created_at) VALUES
(1, 'Suyog Raghav', 'suyog.raghav@campus.edu', '+91 98765 43210', 'STUDENT', 'RFID-9842', CURRENT_TIMESTAMP),
(2, 'Priya Sharma', 'priya.s@campus.edu', '+91 98123 45678', 'STUDENT', 'RFID-7711', CURRENT_TIMESTAMP),
(3, 'Aarav Patel', 'aarav.p@campus.edu', '+91 98234 56789', 'STUDENT', 'RFID-3321', CURRENT_TIMESTAMP),
(4, 'Chef Ramesh Kumar', 'kitchen@campus.edu', '+91 98345 67890', 'STAFF', 'RFID-STAFF-1', CURRENT_TIMESTAMP),
(5, 'Vikram Singh (Owner)', 'admin@campus.edu', '+91 98999 00000', 'ADMIN', 'RFID-ADMIN-1', CURRENT_TIMESTAMP);

-- 2. WALLET (Prepaid RFID Campus Card Balances)
INSERT INTO wallet (id, user_id, balance, currency, last_recharge_date, updated_at) VALUES
(1, 1, 850.00, 'INR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, 620.00, 'INR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 3, 450.00, 'INR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. MENU ITEMS (Indian Dishes Across All Categories)
INSERT INTO menu_items (id, name, category, price, description, image_url, is_veg, is_available, prep_time_minutes, created_at) VALUES
-- Breakfast
(1, 'Crispy Masala Dosa & Sambar', 'BREAKFAST', 60.00, 'Golden crispy rice crepe filled with spicy mashed potato masala, served with fresh coconut chutney & hot sambar', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 8, CURRENT_TIMESTAMP),
(2, 'Amritsari Chole Bhature (2 Pcs)', 'BREAKFAST', 80.00, 'Puffy golden deep-fried bhature served with rich spiced Punjabi chickpea gravy, pickled onions and green chili', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 10, CURRENT_TIMESTAMP),
(3, 'Indori Poha with Sev & Peanuts', 'BREAKFAST', 40.00, 'Steamed flattened rice tempered with mustard seeds, curry leaves, turmeric, crunchy roasted peanuts & ratlami sev', 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 5, CURRENT_TIMESTAMP),
(4, 'Steamed Idli & Medu Vada Combo', 'BREAKFAST', 55.00, 'Two soft steamed rice idlis and one crispy golden medu vada served with piping hot dal sambar & coconut dip', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 6, CURRENT_TIMESTAMP),
(5, 'Aloo Pyaaz Paratha with Makhan', 'BREAKFAST', 70.00, 'Two tawa-toasted whole wheat parathas stuffed with spicy mashed potato & onion, served with fresh curd & white butter', 'https://images.unsplash.com/photo-1671756584099-1bc436730068?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', TRUE, TRUE, 9, CURRENT_TIMESTAMP),

-- Snacks
(6, 'Delhi Style Samosa Chaat (2 Pcs)', 'SNACKS', 50.00, 'Crispy golden samosas crushed and layered with spiced chole, sweet tamarind saunth, spicy mint chutney, curd & sev', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 6, CURRENT_TIMESTAMP),
(7, 'Mumbai Special Pav Bhaji', 'SNACKS', 85.00, 'Butter-toasted soft pavs served with thick spiced mashed mixed vegetable curry, diced onions and lemon wedge', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 8, CURRENT_TIMESTAMP),
(8, 'Tandoori Paneer Tikka Sandwich', 'SNACKS', 75.00, 'Marinated char-grilled cottage cheese cubes, bell peppers, mozzarella and spicy mint chutney in toasted jumbo bread', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 7, CURRENT_TIMESTAMP),
(9, 'Mumbai Vada Pav (2 Pcs)', 'SNACKS', 45.00, 'Spiced batata vada in toasted pav with dry red garlic-peanut chutney, sweet saunth & salted fried green chili', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 4, CURRENT_TIMESTAMP),
(10, 'Crispy Onion & Corn Pakoda', 'SNACKS', 50.00, 'Crispy golden gram flour fritters tossed with sliced onions, sweet corn and ajwain, served with coriander chutney', 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 6, CURRENT_TIMESTAMP),
(11, 'Chicken Tikka Kathi Roll', 'SNACKS', 110.00, 'Charcoal roasted juicy chicken tikka rolled in flaky butter paratha with mint mayonnaise, onions & chaat masala', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80', FALSE, TRUE, 10, CURRENT_TIMESTAMP),

-- Drinks
(12, 'Special Kulhad Masala Chai', 'DRINKS', 25.00, 'Slow-simmered Assam black tea brewed with crushed ginger, green cardamom, cloves, cinnamon and farm milk in earthen kulhad', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 3, CURRENT_TIMESTAMP),
(13, 'Punjabi Kesar Pista Lassi', 'DRINKS', 50.00, 'Thick creamy churned sweet curd garnished with malai, Kashmiri saffron strands, cardamom & crushed pistachios', 'https://images.unsplash.com/photo-1755090154797-2f1cbcc0c2a8?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', TRUE, TRUE, 3, CURRENT_TIMESTAMP),
(14, 'South Indian Filter Coffee', 'DRINKS', 30.00, 'Aromatic dark roast chicory coffee decoction frothed with boiling whole milk, served piping hot', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 2, CURRENT_TIMESTAMP),
(15, 'Fresh Alphonso Mango Lassi', 'DRINKS', 55.00, 'Sweet Alphonso mango pulp whipped with rich greek yogurt, honey and crushed ice', 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 3, CURRENT_TIMESTAMP),
(16, 'Spiced Masala Nimbu Shikanji', 'DRINKS', 35.00, 'Chilled fresh lemon juice infused with roasted cumin seeds, black salt, fresh mint leaves & sparkling soda', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 2, CURRENT_TIMESTAMP),
(17, 'Chilled Badam Kesar Milk', 'DRINKS', 60.00, 'Thick creamy milk simmered with crushed almonds, saffron strands, cardamom and pistachio flakes', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 2, CURRENT_TIMESTAMP),

-- Meals
(18, 'Royal Shahi Paneer Rice Bowl', 'MEALS', 130.00, 'Tender cottage cheese cubes simmered in velvety cashew tomato makhani gravy, served with fragrant jeera basmati rice', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 10, CURRENT_TIMESTAMP),
(19, 'Hyderabadi Veg Dum Biryani', 'MEALS', 120.00, 'Fragrant long-grain basmati rice cooked on dum with marinated vegetables, mint, saffron, brown onions & boondi raita', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 12, CURRENT_TIMESTAMP),
(20, 'Dal Makhani & Jeera Rice Combo', 'MEALS', 110.00, 'Overnight slow-cooked black lentils in creamy butter gravy served with cumin rice, salad & roasted papad', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 8, CURRENT_TIMESTAMP),
(21, 'Punjabi Rajma Chawal Deluxe', 'MEALS', 95.00, 'Homestyle slow-simmered Kashmiri red kidney beans in rich tomato onion masala over fluffy steamed basmati rice', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 7, CURRENT_TIMESTAMP),
(22, 'Butter Chicken with Jeera Rice', 'MEALS', 150.00, 'Succulent tandoori chicken tikka pieces in rich creamy tomato butter gravy paired with aromatic basmati rice', 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80', FALSE, TRUE, 12, CURRENT_TIMESTAMP),
(23, 'Hot Gulab Jamun with Rabri (2 Pcs)', 'MEALS', 60.00, 'Soft melt-in-mouth golden khoya dumplings served warm with chilled thick rabri and rose cardamom sugar syrup', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', TRUE, TRUE, 3, CURRENT_TIMESTAMP);

-- 4. INVENTORY / RAW INGREDIENTS (With Indian Ingredients & Low-Stock Showcase)
INSERT INTO inventory (id, ingredient_name, current_stock, unit, minimum_threshold, unit_cost, last_restocked_at) VALUES
(1, 'Amul Salted Butter & Cream', 14.0, 'kg', 5.0, 480.00, CURRENT_TIMESTAMP),
(2, 'Fresh Malai Paneer', 9.5, 'kg', 5.0, 320.00, CURRENT_TIMESTAMP),
(3, 'Basmati Long Grain Rice', 35.0, 'kg', 10.0, 95.00, CURRENT_TIMESTAMP),
(4, 'Assam CTC Chai Leaves', 2.0, 'kg', 4.0, 320.00, CURRENT_TIMESTAMP),                 -- LOW STOCK ALERT!
(5, 'Potatoes & Onions (Aloo-Pyaaz)', 4.5, 'kg', 15.0, 35.00, CURRENT_TIMESTAMP),          -- LOW STOCK ALERT!
(6, 'Kabuli Chana (Chickpeas)', 18.0, 'kg', 6.0, 110.00, CURRENT_TIMESTAMP),
(7, 'Fresh Pav Bread Buns', 64.0, 'pcs', 24.0, 5.00, CURRENT_TIMESTAMP),
(8, 'Dosa & Idli Rice Batter', 12.0, 'kg', 5.0, 60.00, CURRENT_TIMESTAMP),
(9, 'Amul Taaza Whole Milk', 3.5, 'Liters', 10.0, 54.00, CURRENT_TIMESTAMP),               -- LOW STOCK ALERT!
(10, 'Garam Masala & Indian Spices Mix', 2.5, 'kg', 4.0, 450.00, CURRENT_TIMESTAMP);        -- LOW STOCK ALERT!

-- 5. INITIAL KITCHEN ORDERS (To immediately showcase live KDS functionality)
INSERT INTO orders (id, order_number, user_id, customer_name, customer_phone, total_amount, status, payment_method, pickup_time_option, estimated_pickup_time, estimated_prep_minutes, special_instructions, created_at, updated_at) VALUES
(1, 'ORD-101', 1, 'Suyog Raghav', '+91 98765 43210', 85.00, 'NEW', 'WALLET_RFID', 'ASAP (10-15m)', CURRENT_TIMESTAMP, 8, 'Extra coconut chutney with Dosa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'ORD-102', 2, 'Priya Sharma', '+91 98123 45678', 135.00, 'PREPARING', 'UPI_QR', 'In 25 mins', CURRENT_TIMESTAMP, 8, 'Extra butter on Pav Bhaji', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'ORD-103', 3, 'Aarav Patel', '+91 98234 56789', 190.00, 'READY', 'WALLET_RFID', 'ASAP (10-15m)', CURRENT_TIMESTAMP, 10, 'Served with extra mint raita', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 6. ORDER LINE ITEMS
INSERT INTO order_items (id, order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES
-- Order 101 (Suyog Raghav): Masala Dosa + Kulhad Chai
(1, 1, 1, 'Crispy Masala Dosa & Sambar', 60.00, 1, 60.00),
(2, 1, 12, 'Special Kulhad Masala Chai', 25.00, 1, 25.00),
-- Order 102 (Priya Sharma): Pav Bhaji + Punjabi Lassi
(3, 2, 7, 'Mumbai Special Pav Bhaji', 85.00, 1, 85.00),
(4, 2, 13, 'Punjabi Kesar Pista Lassi', 50.00, 1, 50.00),
-- Order 103 (Aarav Patel): Shahi Paneer Rice Bowl + Gulab Jamun
(5, 3, 18, 'Royal Shahi Paneer Rice Bowl', 130.00, 1, 130.00),
(6, 3, 23, 'Hot Gulab Jamun with Rabri (2 Pcs)', 60.00, 1, 60.00);

-- 7. NOTIFICATION LOGS
INSERT INTO notification_logs (id, order_id, phone, recipient_name, message, type, status, sent_at) VALUES
(1, 3, '+91 98234 56789', 'Aarav Patel', '🔔 Canteen Alert: Your Order #ORD-103 is freshly prepared and READY for pickup at Counter 2! Please present your Token.', 'SMS', 'SENT', CURRENT_TIMESTAMP);
