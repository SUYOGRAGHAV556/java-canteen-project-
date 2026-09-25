// ==============================================================================
// KITCHEN DISPLAY SYSTEM (KDS) - JAVASCRIPT CONTROLLER
// Secured with Kitchen Staff Password Authentication
// ==============================================================================

const kdsState = {
    isAuthenticated: false,
    authToken: null,
    orders: [],
    audioEnabled: true,
    audioCtx: null,
    stompClient: null,
    checkedItems: {} // { orderId_itemId: boolean }
};

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    checkKdsAuth();

    // Elapsed timer ticker every second
    setInterval(updateElapsedTimers, 1000);
});

// ------------------------------------------------------------------------------
// KITCHEN AUTHENTICATION SECURITY
// ------------------------------------------------------------------------------
function checkKdsAuth() {
    const savedToken = localStorage.getItem('smart_canteen_kitchen_auth');
    if (savedToken && savedToken.startsWith('AUTH-KITCHEN-')) {
        kdsState.isAuthenticated = true;
        kdsState.authToken = savedToken;
        document.getElementById('kdsAuthModal').classList.add('hidden');
        initKitchenBoard();
    } else {
        kdsState.isAuthenticated = false;
        document.getElementById('kdsAuthModal').classList.remove('hidden');
        document.getElementById('kdsPasswordInput').focus();
    }
}

async function handleKdsLogin(event) {
    event.preventDefault();
    const password = document.getElementById('kdsPasswordInput').value.trim();
    const errorEl = document.getElementById('kdsAuthError');
    const submitBtn = document.getElementById('kdsLoginBtn');

    if (!password) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Verifying Kitchen PIN...</span>
    `;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'KITCHEN', password: password })
        });

        const data = await res.json();

        if (res.ok && data.authenticated) {
            errorEl.classList.add('hidden');
            localStorage.setItem('smart_canteen_kitchen_auth', data.token);
            kdsState.isAuthenticated = true;
            kdsState.authToken = data.token;
            document.getElementById('kdsAuthModal').classList.add('hidden');
            initKitchenBoard();
        } else {
            throw new Error(data.message || 'Invalid Kitchen Staff Passcode');
        }
    } catch (err) {
        errorEl.textContent = '⚠️ ' + err.message;
        errorEl.classList.remove('hidden');

        // Shake animation
        const card = document.getElementById('kdsAuthCard');
        card.classList.add('animate-shake');
        setTimeout(() => card.classList.remove('animate-shake'), 600);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>🔓 Unlock Kitchen Display</span>`;
    }
}

function quickFillKdsPass() {
    document.getElementById('kdsPasswordInput').value = 'kitchen123';
    document.getElementById('kdsAuthError').classList.add('hidden');
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

function kdsLogout() {
    if (confirm('🔒 Lock Kitchen Display and return to login screen?')) {
        localStorage.removeItem('smart_canteen_kitchen_auth');
        kdsState.isAuthenticated = false;
        kdsState.authToken = null;
        document.getElementById('kdsPasswordInput').value = '';
        document.getElementById('kdsAuthError').classList.add('hidden');
        document.getElementById('kdsAuthModal').classList.remove('hidden');
    }
}

function initKitchenBoard() {
    fetchActiveOrders();
    connectWebSocket();
}

// ------------------------------------------------------------------------------
// LIVE DIGITAL CLOCK
// ------------------------------------------------------------------------------
function initClock() {
    function tick() {
        const now = new Date();
        const str = now.toLocaleTimeString('en-US', { hour12: false });
        const el = document.getElementById('liveClock');
        if (el) el.textContent = str;
    }
    tick();
    setInterval(tick, 1000);
}

// ------------------------------------------------------------------------------
// WEB AUDIO API SYNTHESIZER
// ------------------------------------------------------------------------------
function playOrderChime() {
    if (!kdsState.audioEnabled) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        if (!kdsState.audioCtx) {
            kdsState.audioCtx = new AudioContext();
        }
        if (kdsState.audioCtx.state === 'suspended') {
            kdsState.audioCtx.resume();
        }

        const now = kdsState.audioCtx.currentTime;

        // Tone 1: High crisp ding (880 Hz - Note A5)
        const osc1 = kdsState.audioCtx.createOscillator();
        const gain1 = kdsState.audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc1.connect(gain1);
        gain1.connect(kdsState.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.6);

        // Tone 2: Harmonic pleasant chime (1320 Hz - Note E6)
        const osc2 = kdsState.audioCtx.createOscillator();
        const gain2 = kdsState.audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1320, now + 0.12);
        gain2.gain.setValueAtTime(0.3, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc2.connect(gain2);
        gain2.connect(kdsState.audioCtx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.9);

    } catch (e) {
        console.warn('Audio play error:', e);
    }
}

function toggleAudioChime() {
    kdsState.audioEnabled = !kdsState.audioEnabled;
    const icon = document.getElementById('audioIcon');
    const label = document.getElementById('audioLabel');
    const btn = document.getElementById('audioToggleBtn');

    if (kdsState.audioEnabled) {
        icon.textContent = '🔔';
        label.textContent = 'Chime: ON';
        btn.classList.add('text-amber-300');
        btn.classList.remove('text-slate-500');
        playOrderChime(); // Test sound
    } else {
        icon.textContent = '🔕';
        label.textContent = 'Chime: OFF';
        btn.classList.remove('text-amber-300');
        btn.classList.add('text-slate-500');
    }
}

// ------------------------------------------------------------------------------
// WEBSOCKET STOMP STREAM
// ------------------------------------------------------------------------------
function connectWebSocket() {
    if (kdsState.stompClient && kdsState.stompClient.connected) return;

    try {
        const socket = new SockJS('/ws-canteen');
        kdsState.stompClient = Stomp.over(socket);
        kdsState.stompClient.debug = null;

        kdsState.stompClient.connect({}, () => {
            const badge = document.getElementById('wsStatusBadge');
            if (badge) {
                badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live STOMP Stream`;
                badge.classList.replace('text-amber-400', 'text-emerald-400');
            }

            // Subscribe to live orders
            kdsState.stompClient.subscribe('/topic/orders', (msg) => {
                const event = JSON.parse(msg.body);
                console.log('⚡ KDS Received Order Event:', event);

                if (event.eventType === 'ORDER_CREATED') {
                    // New order received! Play Audio Chime!
                    playOrderChime();
                    if (kdsState.isAuthenticated) handleIncomingOrder(event.payload);
                } else if (event.eventType === 'ORDER_STATUS_CHANGED') {
                    if (kdsState.isAuthenticated) handleOrderUpdated(event.payload);
                }
            });

        }, (err) => {
            console.warn('KDS WebSocket dropped, reconnecting...', err);
            const badge = document.getElementById('wsStatusBadge');
            if (badge) {
                badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500"></span> Reconnecting...`;
                badge.classList.replace('text-emerald-400', 'text-amber-400');
            }
            setTimeout(connectWebSocket, 4000);
        });
    } catch (e) {
        console.error('KDS WS error:', e);
    }
}

function handleIncomingOrder(newOrder) {
    const existingIdx = kdsState.orders.findIndex(o => o.id === newOrder.id);
    if (existingIdx !== -1) {
        kdsState.orders[existingIdx] = newOrder;
    } else {
        kdsState.orders.unshift(newOrder);
    }
    renderKdsBoard();
}

function handleOrderUpdated(updatedOrder) {
    const idx = kdsState.orders.findIndex(o => o.id === updatedOrder.id);
    if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
        if (idx !== -1) kdsState.orders.splice(idx, 1);
    } else {
        if (idx !== -1) {
            kdsState.orders[idx] = updatedOrder;
        } else {
            kdsState.orders.push(updatedOrder);
        }
    }
    renderKdsBoard();
}

// ------------------------------------------------------------------------------
// FETCH ACTIVE ORDERS
// ------------------------------------------------------------------------------
async function fetchActiveOrders() {
    try {
        const res = await fetch('/api/orders/kds/active');
        if (!res.ok) throw new Error('Failed to fetch active orders');
        kdsState.orders = await res.json();
        renderKdsBoard();
    } catch (err) {
        console.error('KDS Fetch error:', err);
    }
}

// ------------------------------------------------------------------------------
// RENDER KDS BOARD
// ------------------------------------------------------------------------------
function renderKdsBoard() {
    const newOrders = kdsState.orders.filter(o => o.status === 'NEW');
    const prepOrders = kdsState.orders.filter(o => o.status === 'PREPARING');
    const readyOrders = kdsState.orders.filter(o => o.status === 'READY');

    // Update KPI Badges
    document.getElementById('kpiTotalActive').textContent = kdsState.orders.length;
    document.getElementById('kpiNewCount').textContent = newOrders.length;
    document.getElementById('kpiPrepCount').textContent = prepOrders.length;
    document.getElementById('kpiReadyCount').textContent = readyOrders.length;

    document.getElementById('colCountNew').textContent = newOrders.length;
    document.getElementById('colCountPrep').textContent = prepOrders.length;
    document.getElementById('colCountReady').textContent = readyOrders.length;

    // Render Columns
    renderColumn('colNewOrders', newOrders, 'NEW');
    renderColumn('colPrepOrders', prepOrders, 'PREPARING');
    renderColumn('colReadyOrders', readyOrders, 'READY');
}

function renderColumn(containerId, ordersList, columnStatus) {
    const container = document.getElementById(containerId);
    if (ordersList.length === 0) {
        container.innerHTML = `
            <div class="h-44 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800/80 rounded-2xl p-4 text-center">
                <span class="text-2xl mb-1 opacity-50">✨</span>
                <span class="text-xs font-bold text-slate-500">No ${columnStatus.toLowerCase()} tickets</span>
            </div>
        `;
        return;
    }

    container.innerHTML = ordersList.map(order => createOrderCardHtml(order)).join('');
}

function createOrderCardHtml(order) {
    const elapsedMinutes = getElapsedMinutes(order.createdAt);
    const isLate = elapsedMinutes >= 15;
    const isWarning = elapsedMinutes >= 10;

    let timeBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
    if (isLate) timeBadgeClass = 'bg-rose-950/80 text-rose-300 border-rose-700 animate-pulse';
    else if (isWarning) timeBadgeClass = 'bg-amber-950/80 text-amber-300 border-amber-700';

    return `
        <div class="bg-[#182232] border-2 ${order.status === 'NEW' ? 'border-blue-500/50 shadow-blue-500/10' : order.status === 'PREPARING' ? 'border-amber-500/50' : 'border-emerald-500/50'} rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3 animate-fade-in transition">
            
            <!-- Ticket Header -->
            <div class="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-xl font-black font-mono text-white tracking-tight">#${order.orderNumber}</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${order.paymentMethod === 'WALLET_RFID' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' : 'bg-orange-950 text-orange-300 border border-orange-800/50'}">
                            ${order.paymentMethod === 'WALLET_RFID' ? 'RFID Paid' : 'UPI Paid'}
                        </span>
                    </div>
                    <div class="text-xs font-semibold text-slate-300 mt-0.5">${order.customerName} <span class="text-slate-500 text-[10px]">(${order.customerPhone || ''})</span></div>
                </div>

                <!-- Timer Badge -->
                <div class="text-right">
                    <div class="px-2 py-1 rounded-lg border font-mono text-xs font-bold ${timeBadgeClass} elapsed-timer" data-created="${order.createdAt}">
                        ${formatElapsed(order.createdAt)}
                    </div>
                    <div class="text-[10px] text-slate-400 font-medium mt-0.5">Est: ~${order.estimatedPrepMinutes || 10}m</div>
                </div>
            </div>

            <!-- Special Cooking Instructions (High Contrast Warning) -->
            ${order.specialInstructions ? `
                <div class="bg-amber-950/70 border border-amber-600/60 text-amber-200 text-xs px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Note: ${order.specialInstructions}</span>
                </div>
            ` : ''}

            <!-- Items Checklist (Tap to Strike Through) -->
            <div class="space-y-1.5 py-1">
                ${(order.items || []).map(item => {
                    const checkKey = `${order.id}_${item.id}`;
                    const isChecked = kdsState.checkedItems[checkKey] || false;
                    return `
                        <div onclick="toggleItemCheck('${checkKey}', this)" 
                             class="flex items-center justify-between p-2 rounded-xl bg-[#111722] hover:bg-slate-800/80 cursor-pointer transition border border-slate-800 ${isChecked ? 'line-through opacity-40 bg-emerald-950/20' : ''}">
                            <div class="flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-bold font-mono text-xs flex items-center justify-center border border-slate-700">
                                    ${item.quantity}x
                                </span>
                                <span class="text-xs font-bold text-slate-200">${item.itemName}</span>
                            </div>
                            <span class="text-xs text-slate-500">${isChecked ? '✓ Plated' : '○'}</span>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- ONE-TAP STATUS ACTION BUTTONS -->
            <div class="pt-1">
                ${order.status === 'NEW' ? `
                    <button onclick="advanceOrderStatus(${order.id}, 'PREPARING')" 
                            class="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 active:scale-98 transition flex items-center justify-center gap-2">
                        <span>🍳 Start Cooking (On Tawa)</span>
                    </button>
                ` : order.status === 'PREPARING' ? `
                    <button onclick="advanceOrderStatus(${order.id}, 'READY')" 
                            class="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/30 active:scale-98 transition flex items-center justify-center gap-2">
                        <span>🔔 Mark Ready (Trigger Student SMS)</span>
                    </button>
                ` : `
                    <button onclick="advanceOrderStatus(${order.id}, 'COMPLETED')" 
                            class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 active:scale-98 transition flex items-center justify-center gap-2">
                        <span>✓ Handed Over to Student</span>
                    </button>
                `}
            </div>

        </div>
    `;
}

// ------------------------------------------------------------------------------
// ADVANCE ORDER STATUS
// ------------------------------------------------------------------------------
async function advanceOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, notes: `Kitchen status updated to ${newStatus}` })
        });

        if (!res.ok) throw new Error('Failed to update order');
        const updated = await res.json();
        handleOrderUpdated(updated);
    } catch (err) {
        alert('Status Update Error: ' + err.message);
    }
}

function toggleItemCheck(key, el) {
    kdsState.checkedItems[key] = !kdsState.checkedItems[key];
    if (kdsState.checkedItems[key]) {
        el.classList.add('line-through', 'opacity-40', 'bg-emerald-950/20');
        el.querySelector('span:last-child').textContent = '✓ Plated';
    } else {
        el.classList.remove('line-through', 'opacity-40', 'bg-emerald-950/20');
        el.querySelector('span:last-child').textContent = '○';
    }
}

// ------------------------------------------------------------------------------
// ELAPSED TIME HELPERS
// ------------------------------------------------------------------------------
function getElapsedMinutes(isoTime) {
    if (!isoTime) return 0;
    const diff = Date.now() - new Date(isoTime).getTime();
    return Math.floor(diff / 60000);
}

function formatElapsed(isoTime) {
    if (!isoTime) return '0m 00s';
    const diffMs = Math.max(0, Date.now() - new Date(isoTime).getTime());
    const totalSec = Math.floor(diffMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

function updateElapsedTimers() {
    document.querySelectorAll('.elapsed-timer').forEach(el => {
        const created = el.getAttribute('data-created');
        if (created) {
            el.textContent = formatElapsed(created);
        }
    });
}
