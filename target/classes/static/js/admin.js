// ==============================================================================
// OWNER / ADMIN DASHBOARD - JAVASCRIPT CONTROLLER
// Secured with Owner Password Authentication
// ==============================================================================

const adminState = {
    isAuthenticated: false,
    authToken: null,
    menuItems: [],
    inventory: [],
    notifications: [],
    stats: null,
    selectedRestockItem: null,
    charts: {
        rush: null,
        topItems: null,
        category: null
    },
    stompClient: null
};

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
});

// ------------------------------------------------------------------------------
// OWNER AUTHENTICATION SECURITY
// ------------------------------------------------------------------------------
function checkAdminAuth() {
    const savedToken = localStorage.getItem('smart_canteen_admin_auth');
    if (savedToken && savedToken.startsWith('AUTH-ADMIN-')) {
        adminState.isAuthenticated = true;
        adminState.authToken = savedToken;
        document.getElementById('adminAuthModal').classList.add('hidden');
        initDashboard();
    } else {
        adminState.isAuthenticated = false;
        document.getElementById('adminAuthModal').classList.remove('hidden');
        document.getElementById('adminPasswordInput').focus();
    }
}

async function handleAdminLogin(event) {
    event.preventDefault();
    const password = document.getElementById('adminPasswordInput').value.trim();
    const errorEl = document.getElementById('adminAuthError');
    const submitBtn = document.getElementById('adminLoginBtn');

    if (!password) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Verifying Owner Credentials...</span>
    `;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'ADMIN', password: password })
        });

        const data = await res.json();

        if (res.ok && data.authenticated) {
            errorEl.classList.add('hidden');
            localStorage.setItem('smart_canteen_admin_auth', data.token);
            adminState.isAuthenticated = true;
            adminState.authToken = data.token;
            document.getElementById('adminAuthModal').classList.add('hidden');
            initDashboard();
        } else {
            throw new Error(data.message || 'Invalid Owner Passcode');
        }
    } catch (err) {
        errorEl.textContent = '⚠️ ' + err.message;
        errorEl.classList.remove('hidden');
        
        // Shake animation
        const card = document.getElementById('adminAuthCard');
        card.classList.add('animate-shake');
        setTimeout(() => card.classList.remove('animate-shake'), 600);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>🔓 Unlock Owner Dashboard</span>`;
    }
}

function quickFillAdminPass() {
    document.getElementById('adminPasswordInput').value = 'owner123';
    document.getElementById('adminAuthError').classList.add('hidden');
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

function adminLogout() {
    if (confirm('🔒 Lock Owner Portal and return to login screen?')) {
        localStorage.removeItem('smart_canteen_admin_auth');
        adminState.isAuthenticated = false;
        adminState.authToken = null;
        document.getElementById('adminPasswordInput').value = '';
        document.getElementById('adminAuthError').classList.add('hidden');
        document.getElementById('adminAuthModal').classList.remove('hidden');
    }
}

function initDashboard() {
    fetchDashboardStats();
    fetchAdminMenu();
    fetchInventory();
    fetchNotificationLogs();
    connectWebSocket();
}

// ------------------------------------------------------------------------------
// REAL-TIME WEBSOCKET SYNC
// ------------------------------------------------------------------------------
function connectWebSocket() {
    if (adminState.stompClient && adminState.stompClient.connected) return;

    try {
        const socket = new SockJS('/ws-canteen');
        adminState.stompClient = Stomp.over(socket);
        adminState.stompClient.debug = null;

        adminState.stompClient.connect({}, () => {
            console.log('✅ Owner Admin WS connected');

            // 1. Order updates -> refresh stats
            adminState.stompClient.subscribe('/topic/orders', () => {
                if (adminState.isAuthenticated) fetchDashboardStats();
            });

            // 2. Inventory alerts
            adminState.stompClient.subscribe('/topic/inventory-alerts', (msg) => {
                const event = JSON.parse(msg.body);
                console.warn('⚠️ Inventory Alert:', event);
                if (adminState.isAuthenticated) {
                    fetchInventory();
                    fetchDashboardStats();
                }
            });

            // 3. Notification logs
            adminState.stompClient.subscribe('/topic/notifications', (msg) => {
                const event = JSON.parse(msg.body);
                if (event.payload && adminState.isAuthenticated) {
                    adminState.notifications.unshift(event.payload);
                    renderNotificationLogs();
                }
            });

        }, (err) => {
            console.warn('Admin WS dropped, reconnecting...', err);
            setTimeout(connectWebSocket, 4000);
        });
    } catch (e) {
        console.error('Admin WS error:', e);
    }
}

// ------------------------------------------------------------------------------
// TAB SWITCHING
// ------------------------------------------------------------------------------
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.dash-tab').forEach(b => {
        b.classList.remove('active', 'bg-slate-900', 'text-white', 'shadow-sm');
        b.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200');
    });

    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.remove('hidden');

    const targetBtn = document.querySelector(`.dash-tab[data-tab="${tabId}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active', 'bg-slate-900', 'text-white', 'shadow-sm');
        targetBtn.classList.remove('bg-white', 'text-slate-600', 'border', 'border-slate-200');
    }

    if (tabId === 'tab-analytics' && adminState.stats) {
        setTimeout(renderCharts, 50);
    }
}

// ------------------------------------------------------------------------------
// DASHBOARD STATS
// ------------------------------------------------------------------------------
async function fetchDashboardStats() {
    try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Stats fetch error');
        adminState.stats = await res.json();

        // Update KPI Cards
        document.getElementById('kpiRevenue').textContent = `₹${Number(adminState.stats.todayRevenue || 0).toFixed(2)}`;
        document.getElementById('kpiOrdersToday').textContent = adminState.stats.totalOrdersToday || 0;
        document.getElementById('kpiActiveKitchen').textContent = adminState.stats.activeOrdersCount || 0;
        document.getElementById('kpiLowStockCount').textContent = adminState.stats.lowStockCount || 0;

        const badge = document.getElementById('kpiLowStockBadge');
        const pill = document.getElementById('invAlertPill');
        if (adminState.stats.lowStockCount > 0) {
            badge.textContent = `${adminState.stats.lowStockCount} Alert${adminState.stats.lowStockCount > 1 ? 's' : ''}`;
            badge.classList.remove('hidden');
            pill.textContent = adminState.stats.lowStockCount;
            pill.classList.remove('hidden');
        } else {
            badge.textContent = 'All Good';
            badge.classList.replace('text-rose-600', 'text-emerald-600');
            badge.classList.replace('bg-rose-50', 'bg-emerald-50');
            pill.classList.add('hidden');
        }

        if (!document.getElementById('tab-analytics').classList.contains('hidden')) {
            renderCharts();
        }

    } catch (err) {
        console.error('Stats error:', err);
    }
}

// ------------------------------------------------------------------------------
// TAB 1: MENU TOGGLE AVAILABILITY
// ------------------------------------------------------------------------------
async function fetchAdminMenu() {
    try {
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error('Menu fetch failed');
        adminState.menuItems = await res.json();
        renderAdminMenuGrid();
    } catch (err) {
        console.error('Admin menu error:', err);
    }
}

function renderAdminMenuGrid() {
    const container = document.getElementById('adminMenuGrid');
    container.innerHTML = adminState.menuItems.map(item => `
        <div class="bg-white rounded-2xl p-4 border ${item.available ? 'border-slate-200' : 'border-rose-300 bg-rose-50/30'} shadow-xs flex items-center justify-between gap-3 transition">
            <div class="flex items-center gap-3">
                <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200'}" class="w-14 h-14 rounded-xl object-cover border border-slate-100 flex-shrink-0">
                <div>
                    <h4 class="font-bold text-slate-900 text-xs">${item.name}</h4>
                    <div class="text-[11px] text-slate-500 font-semibold">₹${Number(item.price).toFixed(2)} • <span class="capitalize text-slate-600">${item.category.toLowerCase()}</span></div>
                    <span class="inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${item.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                        ${item.available ? '🟢 IN STOCK' : '🔴 SOLD OUT'}
                    </span>
                </div>
            </div>

            <!-- Single Tactile Toggle Switch -->
            <label class="switch flex-shrink-0">
                <input type="checkbox" ${item.available ? 'checked' : ''} onchange="toggleItemStatus(${item.id}, this.checked)">
                <span class="slider"></span>
            </label>
        </div>
    `).join('');
}

async function toggleItemStatus(itemId, isAvailable) {
    try {
        const res = await fetch(`/api/menu/${itemId}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ available: isAvailable })
        });

        if (!res.ok) throw new Error('Failed to toggle status');
        const updated = await res.json();
        
        const idx = adminState.menuItems.findIndex(i => i.id === itemId);
        if (idx !== -1) adminState.menuItems[idx] = updated;
        renderAdminMenuGrid();

    } catch (err) {
        alert('Toggle error: ' + err.message);
        fetchAdminMenu();
    }
}

// ------------------------------------------------------------------------------
// TAB 2: INVENTORY MANAGEMENT & LOW-STOCK WARNINGS
// ------------------------------------------------------------------------------
async function fetchInventory() {
    try {
        const res = await fetch('/api/inventory');
        if (!res.ok) throw new Error('Inventory fetch failed');
        adminState.inventory = await res.json();
        renderInventoryTable();
    } catch (err) {
        console.error('Inventory error:', err);
    }
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const lowStockItems = adminState.inventory.filter(i => Number(i.currentStock) <= Number(i.minimumThreshold));
    
    // Low stock banner
    const banner = document.getElementById('lowStockBanner');
    const summary = document.getElementById('lowStockSummaryText');
    if (lowStockItems.length > 0) {
        banner.classList.remove('hidden');
        summary.textContent = `Warning: ${lowStockItems.map(i => `${i.ingredientName} (${i.currentStock} ${i.unit})`).join(', ')} require urgent restocking!`;
    } else {
        banner.classList.add('hidden');
    }

    tbody.innerHTML = adminState.inventory.map(item => {
        const isLow = Number(item.currentStock) <= Number(item.minimumThreshold);

        return `
            <tr class="hover:bg-slate-50/80 transition ${isLow ? 'bg-rose-50/40' : ''}">
                <td class="p-3.5 pl-5">
                    <div class="font-bold text-slate-900">${item.ingredientName}</div>
                    <div class="text-[10px] text-slate-400">ID: #${item.id}</div>
                </td>
                <td class="p-3.5">
                    <span class="font-mono font-black text-sm ${isLow ? 'text-rose-600' : 'text-slate-900'}">${Number(item.currentStock).toFixed(1)}</span> 
                    <span class="text-slate-500 font-semibold">${item.unit}</span>
                </td>
                <td class="p-3.5">
                    <span class="font-mono text-slate-600 font-semibold">${Number(item.minimumThreshold).toFixed(1)}</span> 
                    <span class="text-slate-400">${item.unit}</span>
                </td>
                <td class="p-3.5">
                    ${isLow ? `
                        <span class="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] flex items-center gap-1 w-max">
                            ⚠️ Low Stock
                        </span>
                    ` : `
                        <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-max">
                            ✓ Adequate
                        </span>
                    `}
                </td>
                <td class="p-3.5 font-mono text-slate-700 font-semibold">
                    ₹${Number(item.unitCost || 0).toFixed(2)}
                </td>
                <td class="p-3.5 text-right pr-5">
                    <button onclick="openRestockModal(${item.id})" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95">
                        + Restock
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openRestockModal(itemId) {
    const item = adminState.inventory.find(i => i.id === itemId);
    if (!item) return;
    adminState.selectedRestockItem = item;
    document.getElementById('restockItemTitle').textContent = `Restock: ${item.ingredientName}`;
    document.getElementById('restockItemSub').textContent = `Current stock: ${item.currentStock} ${item.unit} (Min: ${item.minimumThreshold} ${item.unit})`;
    document.getElementById('restockAmountInput').value = 10;
    document.getElementById('restockModal').classList.remove('hidden');
}

function closeRestockModal() {
    document.getElementById('restockModal').classList.add('hidden');
    adminState.selectedRestockItem = null;
}

function setQuickAdd(val) {
    document.getElementById('restockAmountInput').value = val;
}

async function submitStockAdjustment() {
    if (!adminState.selectedRestockItem) return;
    const amount = Number(document.getElementById('restockAmountInput').value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive amount');
        return;
    }

    try {
        const res = await fetch(`/api/inventory/${adminState.selectedRestockItem.id}/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, reason: 'Restock via Owner Admin' })
        });

        if (!res.ok) throw new Error('Failed to adjust stock');
        closeRestockModal();
        fetchInventory();
        fetchDashboardStats();
    } catch (err) {
        alert('Restock Error: ' + err.message);
    }
}

function openAddIngredientModal() {
    document.getElementById('addIngredientModal').classList.remove('hidden');
}

function closeAddIngredientModal() {
    document.getElementById('addIngredientModal').classList.add('hidden');
}

async function submitNewIngredient() {
    const name = document.getElementById('newIngName').value.trim();
    const stock = Number(document.getElementById('newIngStock').value);
    const unit = document.getElementById('newIngUnit').value.trim();
    const threshold = Number(document.getElementById('newIngThreshold').value);
    const cost = Number(document.getElementById('newIngCost').value);

    if (!name || isNaN(stock) || !unit || isNaN(threshold)) {
        alert('Please fill all ingredient fields');
        return;
    }

    try {
        const res = await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ingredientName: name,
                currentStock: stock,
                unit: unit,
                minimumThreshold: threshold,
                unitCost: cost
            })
        });

        if (!res.ok) throw new Error('Failed to add ingredient');
        closeAddIngredientModal();
        fetchInventory();
        fetchDashboardStats();
    } catch (err) {
        alert('Add Error: ' + err.message);
    }
}

// ------------------------------------------------------------------------------
// TAB 3: VISUAL SALES & PEAK RUSH CHARTS (Chart.js)
// ------------------------------------------------------------------------------
function renderCharts() {
    if (!adminState.stats) return;

    // 1. Peak Rush Times Curve
    const rushCtx = document.getElementById('rushChart');
    if (rushCtx) {
        if (adminState.charts.rush) adminState.charts.rush.destroy();

        const labels = Object.keys(adminState.stats.hourlyOrderDistribution || {});
        const dataValues = Object.values(adminState.stats.hourlyOrderDistribution || {});

        adminState.charts.rush = new Chart(rushCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Orders per Hour',
                    data: dataValues,
                    borderColor: '#ea580c',
                    backgroundColor: 'rgba(234, 88, 12, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#ea580c',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Top Selling Dishes Bar Chart
    const topCtx = document.getElementById('topItemsChart');
    if (topCtx) {
        if (adminState.charts.topItems) adminState.charts.topItems.destroy();

        const topItems = adminState.stats.topSellingItems || [];
        const labels = topItems.map(i => i.name.length > 20 ? i.name.substring(0, 20) + '...' : i.name);
        const values = topItems.map(i => i.quantity);

        adminState.charts.topItems = new Chart(topCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Dishes Sold',
                    data: values,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316'],
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    y: { grid: { display: false } }
                }
            }
        });
    }

    // 3. Category Revenue Share Doughnut
    const catCtx = document.getElementById('categoryChart');
    if (catCtx) {
        if (adminState.charts.category) adminState.charts.category.destroy();

        const catMap = adminState.stats.categoryRevenueDistribution || {};
        const labels = Object.keys(catMap);
        const values = Object.values(catMap);

        adminState.charts.category = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#f97316', '#10b981', '#3b82f6', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

// ------------------------------------------------------------------------------
// TAB 4: NOTIFICATION LOGS
// ------------------------------------------------------------------------------
async function fetchNotificationLogs() {
    try {
        const res = await fetch('/api/notifications/logs');
        if (!res.ok) throw new Error('Notification logs failed');
        adminState.notifications = await res.json();
        renderNotificationLogs();
    } catch (err) {
        console.error('Notification log error:', err);
    }
}

function renderNotificationLogs() {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    if (adminState.notifications.length === 0) {
        list.innerHTML = `
            <div class="p-8 text-center text-slate-400 text-xs">
                No notification triggers recorded yet.
            </div>
        `;
        return;
    }

    list.innerHTML = adminState.notifications.map(log => `
        <div class="p-4 flex items-start justify-between gap-3 text-xs hover:bg-slate-50 transition">
            <div class="flex items-start gap-3">
                <span class="text-xl">📲</span>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-900">${log.recipientName}</span>
                        <span class="font-mono text-slate-500 font-semibold">${log.phone}</span>
                        <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">${log.type} ${log.status}</span>
                    </div>
                    <p class="text-slate-600 mt-1">${log.message}</p>
                </div>
            </div>
            <div class="text-right text-[11px] text-slate-400 font-mono flex-shrink-0">
                ${new Date(log.sentAt).toLocaleTimeString()}
            </div>
        </div>
    `).join('');
}
