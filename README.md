# 🍔 Campus Bites (Smart Canteen Management System)

A high-performance, real-time, touch-optimized **Campus Bites canteen management system** built with a **100% free and open-source tech stack**:
- **Backend:** Java 17+, Spring Boot 3.3.4, Hibernate / Spring Data JPA, Spring WebSocket (STOMP + SockJS).
- **Database:** MySQL Community Edition (with instant zero-config embedded H2 fallback for plug-and-play development).
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript, Chart.js (Analytics), and Web Audio API (Chime Alerts).

---

## 🌟 Key Features & Architectural Highlights

### 1. 📱 Student Mobile-First Portal (`/` or `/index.html`)
- **Visual Food Catalog:** High-contrast item cards with food photography, veg/non-veg dietary tags, prep time badges, and search filter pills.
- **Quick 2-Click Checkout:**
  - Pickup time selector: `ASAP (~10-15m)`, `In 25m (Post Lecture)`, `In 45m (Lunch Break)`.
  - Payment method: **Digital RFID Campus Card / Wallet** (with real-time balance validation) or **Instant UPI QR Code**.
- **Live Order Tracker:** Real-time animated progress steps (`Placed` ➔ `Preparing` ➔ `Ready for Pickup` ➔ `Collected`) connected via WebSocket.
- **Instant Wallet Top-Up:** Simple modal to recharge student RFID wallet balance.

### 2. 👨‍🍳 Kitchen Display System (KDS) & Staff View (`/kds.html`)
- **Real-Time Kanban Board:** Large, color-coded status columns (`📥 NEW ORDERS` ➔ `🔥 PREPARING` ➔ `✅ READY FOR PICKUP`).
- **Web Audio API Chime:** Plays a crisp harmonic chime whenever a new order arrives (no external audio files required).
- **One-Tap Status Transitions:** Single-tap buttons to start cooking, mark ready, and complete orders.
- **Automated Student Notification:** Moving an order to **"Ready"** triggers an automated SMS and Push notification alert to the student with their pickup token and counter details.
- **Interactive Ticket Checklist:** Kitchen staff can tap individual order items to strike them out as they are plated.
- **Elapsed Time Tracking:** Dynamic color warnings (amber at 10m, pulse red at 15m) for overdue orders.

### 3. ⚙️ Non-Technical Owner & Admin Dashboard (`/admin.html`)
- **⚡ One-Tap Availability Toggle:** Large tactile toggle switches to flip items between `"🟢 IN STOCK"` and `"🔴 SOLD OUT"`. Broadcasts instantly via WebSocket to all connected student phones without page refresh!
- **📦 Raw Ingredient Inventory & Alerts:** Track stock levels (Milk, Buns, Paneer, Rice, Coffee, etc.) against minimum thresholds with automated low-stock warnings.
- **📊 Visual Analytics (Chart.js):**
  - **Peak Rush Times:** Hourly order curve visualizing breakfast, lunch, and evening spikes.
  - **Top-Selling Dishes:** Horizontal bar chart comparing sales volume.
  - **Revenue by Category:** Doughnut breakdown across Snacks, Meals, Breakfast, and Drinks.
- **📲 SMS Dispatch Logs:** Real-time audit log of all automated notification triggers sent to students.

---

## 🗄️ Database Architecture (MySQL Community Edition)

The full DDL schema is located in [`src/main/resources/schema.sql`](file:///d:/java%20project/src/main/resources/schema.sql) and sample seed data in [`src/main/resources/data.sql`](file:///d:/java%20project/src/main/resources/data.sql).

### Relational Tables:
1. **`users`**: Campus students, staff, and canteen administrators.
2. **`wallet`**: Prepaid digital balance linked to RFID tags / Student IDs.
3. **`menu_items`**: Dish catalog with categories, price, veg status, prep time, and availability flags.
4. **`orders`**: Order tickets with token numbers (`#ORD-XXX`), pickup times, total amounts, and payment methods.
5. **`order_items`**: Line items for each order ticket.
6. **`inventory`**: Raw ingredients with current stock, units (kg, L, pcs), and minimum alert thresholds.
7. **`notification_logs`**: Audit trail of automated SMS/Push alerts dispatched to students.

---

## 🚀 Getting Started & Execution

### Prerequisites:
- **Java 17 or higher** (`java -version`)
- **Maven 3.8+** (or use your IDE's built-in Maven support: IntelliJ IDEA, VS Code, Eclipse)

### Running the Application:
```bash
# 1. Clone or navigate to the project directory:
cd "d:/java project"

# 2. Build and run using Maven:
mvn spring-boot:run
```

### Accessing the Portals:
| Portal | URL | Description |
|---|---|---|
| **Student Mobile Portal** | `http://localhost:8080/` | Menu catalog, 2-click checkout & live order tracker |
| **Kitchen KDS** | `http://localhost:8080/kds.html` | Tablet order board with audio chime & one-tap actions |
| **Owner / Admin Panel** | `http://localhost:8080/admin.html` | Real-time stock toggles, inventory & sales charts |
| **Database Console** | `http://localhost:8080/h2-console` | JDBC URL: `jdbc:h2:mem:canteen_db`, User: `sa`, Pwd: *(blank)* |

---

## 🔌 Real-Time WebSocket Channels (STOMP / SockJS)

- **Endpoint:** `/ws-canteen`
- **Application Destination Prefix:** `/app`
- **Broker Prefix:** `/topic`

| Topic | Event Types | Consumers |
|---|---|---|
| `/topic/orders` | `ORDER_CREATED`, `ORDER_STATUS_CHANGED` | Kitchen KDS, Student Tracker, Admin Dashboard |
| `/topic/order/{orderNumber}` | Single order status stream | Student Live Tracker Modal |
| `/topic/menu-updates` | `MENU_TOGGLED` | Student Catalog (Auto Sold-Out Disable) |
| `/topic/inventory-alerts` | `LOW_STOCK_WARNING` | Admin Dashboard |
| `/topic/notifications` | `SMS_SENT` | Admin Audit Log & Student SMS Simulator |

---

## 📡 REST API Summary

- `GET /api/menu` - Fetch menu items (supports `?category=` and `?availableOnly=`)
- `PATCH /api/menu/{id}/toggle` - Toggle item availability (payload: `{"available": true/false}`)
- `POST /api/orders` - Place a new order with 2-click checkout payload
- `GET /api/orders/kds/active` - Fetch active orders for Kitchen Display (`NEW`, `PREPARING`, `READY`)
- `PATCH /api/orders/{id}/status` - Update ticket status (`NEW` -> `PREPARING` -> `READY` -> `COMPLETED`)
- `GET /api/wallet/user/{userId}` - Fetch RFID wallet balance
- `POST /api/wallet/user/{userId}/recharge` - Top up wallet balance
- `GET /api/inventory` - List ingredients & threshold indicators
- `POST /api/inventory/{id}/adjust` - Adjust stock amount (`+` or `-`)
- `GET /api/dashboard/stats` - Aggregate KPI metrics & chart data
- `GET /api/notifications/logs` - Retrieve automated notification audit logs
