// ==============================================================================
// SMART CANTEEN - STUDENT MOBILE-FIRST PORTAL CONTROLLER
// Real-Time Preparation Timer & Indian Campus Experience
// ==============================================================================

const state = {
    user: {
        id: 1,
        name: 'Suyog Raghav',
        phone: '+91 98765 43210',
        rfidTag: 'RFID-9842',
        walletBalance: 850.00
    },
    menuItems: [],
    cart: {}, // { itemId: quantity }
    currentCategory: 'ALL',
    searchQuery: '',
    vegOnly: false,
    quickPrepOnly: false,
    selectedPickupTime: 'ASAP (10-15m)',
    selectedPaymentMethod: 'WALLET_RFID',
    activeOrder: null, // Holds currently tracked order object
    activeTrackingOrderNumber: null,
    trackerTimerInterval: null,
    qrScanStream: null,
    qrScanFrame: null,
    paymentQrScanStream: null,
    paymentQrScanFrame: null,
    stompClient: null
};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    fetchWalletBalance();
    fetchMenuItems();
    connectWebSocket();
    checkStoredActiveOrder();
});

// ------------------------------------------------------------------------------
// PERSISTENT ACTIVE ORDER RESTORATION
// ------------------------------------------------------------------------------
function checkStoredActiveOrder() {
    const savedOrderNumber = localStorage.getItem('smart_canteen_active_order');
    if (savedOrderNumber) {
        fetchOrderByNumber(savedOrderNumber, false);
    }
}

// ------------------------------------------------------------------------------
// WEBSOCKET (STOMP / SOCKJS) REAL-TIME SYNC
// ------------------------------------------------------------------------------
function connectWebSocket() {
    try {
        const socket = new SockJS('/ws-canteen');
        state.stompClient = Stomp.over(socket);
        state.stompClient.debug = null; // Disable debug noise in console

        state.stompClient.connect({}, () => {
            console.log('✅ Connected to Canteen WebSocket Broker');

            // 1. Subscribe to Menu Updates (Real-time item sold-out toggles from Admin)
            state.stompClient.subscribe('/topic/menu-updates', (message) => {
                const event = JSON.parse(message.body);
                console.log('📢 Menu Item Updated:', event);
                handleMenuItemToggle(event.payload);
            });

            // 2. Subscribe to Generic Orders Channel
            state.stompClient.subscribe('/topic/orders', (message) => {
                const event = JSON.parse(message.body);
                if (state.activeTrackingOrderNumber && event.payload && event.payload.orderNumber === state.activeTrackingOrderNumber) {
                    state.activeOrder = event.payload;
                    updateOrderTrackerView(event.payload);
                    updateActiveBanner(event.payload);
                }
            });

        }, (err) => {
            console.warn('WebSocket connection failed, retrying in 4s...', err);
            setTimeout(connectWebSocket, 4000);
        });
    } catch (e) {
        console.error('Error initiating WebSocket:', e);
    }
}

function handleMenuItemToggle(updatedItem) {
    const idx = state.menuItems.findIndex(i => i.id === updatedItem.id);
    if (idx !== -1) {
        state.menuItems[idx] = updatedItem;
        if (!updatedItem.available && state.cart[updatedItem.id]) {
            delete state.cart[updatedItem.id];
            updateCartUI();
        }
        renderMenuItems();
    }
}

// ------------------------------------------------------------------------------
// API CALLS: MENU & WALLET
// ------------------------------------------------------------------------------
async function fetchMenuItems() {
    try {
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error('Failed to load menu');
        state.menuItems = await res.json();
        renderMenuItems();
    } catch (err) {
        console.error('Error fetching menu:', err);
        document.getElementById('menuGrid').innerHTML = `
            <div class="col-span-full py-12 text-center text-red-500 bg-red-50 rounded-2xl p-6 border border-red-200">
                <p class="font-bold mb-1">Failed to load menu items</p>
                <p class="text-xs text-red-600 mb-3">${err.message}</p>
                <button onclick="fetchMenuItems()" class="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Retry</button>
            </div>
        `;
    }
}

async function fetchWalletBalance() {
    try {
        const res = await fetch(`/api/wallet/user/${state.user.id}`);
        if (res.ok) {
            const data = await res.json();
            state.user.walletBalance = data.balance;
            updateWalletDisplay();
        }
    } catch (err) {
        console.warn('Could not load wallet:', err);
    }
}

function updateWalletDisplay() {
    const formatted = `₹${Number(state.user.walletBalance).toFixed(2)}`;
    const el = document.getElementById('walletBalanceDisplay');
    const checkoutEl = document.getElementById('checkoutWalletBalance');
    if (el) el.textContent = formatted;
    if (checkoutEl) checkoutEl.textContent = formatted;
}

// ------------------------------------------------------------------------------
// RENDERING MENU ITEMS
// ------------------------------------------------------------------------------
function renderMenuItems() {
    const container = document.getElementById('menuGrid');
    const filtered = state.menuItems.filter(item => {
        // Category filter
        if (state.currentCategory !== 'ALL' && item.category !== state.currentCategory) return false;
        // Search filter
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            const matchName = item.name.toLowerCase().includes(query);
            const matchDesc = item.description ? item.description.toLowerCase().includes(query) : false;
            if (!matchName && !matchDesc) return false;
        }
        // Veg filter
        if (state.vegOnly && !item.veg) return false;
        // Quick prep filter
        if (state.quickPrepOnly && item.prepTimeMinutes > 8) return false;

        return true;
    });

    document.getElementById('itemsCountBadge').textContent = `Showing ${filtered.length} authentic dish${filtered.length === 1 ? '' : 'es'}`;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl p-8 border border-slate-100 shadow-xs">
                <div class="text-3xl mb-2">🍽️</div>
                <p class="font-bold text-slate-700 mb-1">No dishes found matching your filters</p>
                <p class="text-xs text-slate-400">Try changing your search term or category pills above.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(item => {
        const qty = state.cart[item.id] || 0;
        const isSoldOut = !item.available;

        return `
            <div class="bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between relative overflow-hidden ${isSoldOut ? 'opacity-65 grayscale-20 bg-slate-50' : ''}">
                
                <!-- Sold Out Banner -->
                ${isSoldOut ? `
                    <div class="absolute top-3 right-3 z-10 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Sold Out
                    </div>
                ` : ''}

                <!-- Food Thumbnail Image -->
                <div class="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-slate-100 group">
                    <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600'}" 
                         alt="${item.name}" 
                         loading="lazy"
                         class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                    
                    <!-- Dietary Tag & Prep Badge -->
                    <div class="absolute bottom-2 left-2 flex items-center gap-1.5">
                        <span class="bg-white/95 backdrop-blur px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-800 shadow-xs flex items-center gap-1">
                            ${item.veg ? '<span class="w-2 h-2 rounded-full bg-emerald-600"></span> Veg' : '<span class="w-2 h-2 rounded-full bg-rose-600"></span> Non-Veg'}
                        </span>
                        <span class="bg-white/95 backdrop-blur px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 shadow-xs flex items-center gap-1">
                            <span>⚡</span> ${item.prepTimeMinutes || 8} mins
                        </span>
                    </div>
                </div>

                <!-- Info -->
                <div class="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 class="font-bold text-slate-900 text-sm leading-snug mb-1">${item.name}</h3>
                        <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">${item.description || ''}</p>
                    </div>

                    <!-- Price & Add Stepper -->
                    <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                            <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Price</span>
                            <div class="text-base font-extrabold text-slate-900">₹${Number(item.price).toFixed(2)}</div>
                        </div>

                        <!-- Stepper / Add Button -->
                        ${isSoldOut ? `
                            <button disabled class="px-3.5 py-1.5 bg-slate-200 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed">
                                Sold Out
                            </button>
                        ` : qty === 0 ? `
                            <button onclick="addToCart(${item.id})" class="px-4 py-2 bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 border border-orange-200 hover:border-orange-500 rounded-xl font-bold text-xs transition active:scale-95 flex items-center gap-1 shadow-xs">
                                <span>+ Add Dish</span>
                            </button>
                        ` : `
                            <div class="flex items-center bg-orange-500 text-white rounded-xl shadow-md shadow-orange-500/25 p-0.5">
                                <button onclick="removeFromCart(${item.id})" class="w-7 h-7 flex items-center justify-center font-bold text-sm hover:bg-orange-600 rounded-lg active:scale-90">-</button>
                                <span class="w-6 text-center text-xs font-bold font-mono">${qty}</span>
                                <button onclick="addToCart(${item.id})" class="w-7 h-7 flex items-center justify-center font-bold text-sm hover:bg-orange-600 rounded-lg active:scale-90">+</button>
                            </div>
                        `}
                    </div>
                </div>

            </div>
        `;
    }).join('');
}

// ------------------------------------------------------------------------------
// CART MANAGEMENT
// ------------------------------------------------------------------------------
function addToCart(itemId) {
    const item = state.menuItems.find(i => i.id === itemId);
    if (!item || !item.available) return;

    state.cart[itemId] = (state.cart[itemId] || 0) + 1;
    updateCartUI();
    renderMenuItems();
}

function removeFromCart(itemId) {
    if (state.cart[itemId]) {
        state.cart[itemId] -= 1;
        if (state.cart[itemId] <= 0) {
            delete state.cart[itemId];
        }
    }
    updateCartUI();
    renderMenuItems();
}

function getCartCalculations() {
    let totalItems = 0;
    let totalPrice = 0;

    for (const [idStr, qty] of Object.entries(state.cart)) {
        const item = state.menuItems.find(i => i.id === Number(idStr));
        if (item) {
            totalItems += qty;
            totalPrice += item.price * qty;
        }
    }
    return { totalItems, totalPrice };
}

function updateCartUI() {
    const { totalItems, totalPrice } = getCartCalculations();
    const floatingBar = document.getElementById('floatingCartBar');
    const countBadge = document.getElementById('cartCountBadge');
    const totalDisplay = document.getElementById('cartTotalDisplay');

    if (totalItems > 0) {
        floatingBar.classList.remove('hidden');
        countBadge.textContent = totalItems;
        totalDisplay.textContent = `₹${totalPrice.toFixed(2)}`;
    } else {
        floatingBar.classList.add('hidden');
    }
}

// ------------------------------------------------------------------------------
// 2-CLICK CHECKOUT MODAL
// ------------------------------------------------------------------------------
function openCheckoutModal() {
    const { totalItems, totalPrice } = getCartCalculations();
    if (totalItems === 0) return;

    renderCheckoutItems();
    updateWalletDisplay();

    document.getElementById('checkoutModal').classList.remove('hidden');
}

function renderCheckoutItems() {
    const listEl = document.getElementById('checkoutItemsList');
    listEl.innerHTML = Object.entries(state.cart).map(([idStr, qty]) => {
        const item = state.menuItems.find(i => i.id === Number(idStr));
        if (!item) return '';
        const sub = item.price * qty;
        return `
            <div class="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                <div class="flex items-center gap-2">
                    <div class="flex items-center bg-white border border-slate-200 rounded-lg">
                        <button type="button" onclick="changeCheckoutQuantity(${item.id}, -1)" aria-label="Remove one ${item.name}" class="w-7 h-7 text-slate-600 hover:bg-slate-100 rounded-l-lg font-bold">−</button>
                        <span class="w-6 text-center text-[11px] font-bold text-slate-800">${qty}</span>
                        <button type="button" onclick="changeCheckoutQuantity(${item.id}, 1)" aria-label="Add one ${item.name}" class="w-7 h-7 text-slate-600 hover:bg-slate-100 rounded-r-lg font-bold">+</button>
                    </div>
                    <span class="text-xs font-semibold text-slate-800">${item.name}</span>
                </div>
                <span class="text-xs font-bold text-slate-900">₹${sub.toFixed(2)}</span>
            </div>
        `;
    }).join('');

    const { totalItems, totalPrice } = getCartCalculations();
    listEl.setAttribute('aria-label', `${totalItems} items in order`);
    document.getElementById('checkoutTotalAmount').textContent = `₹${totalPrice.toFixed(2)}`;
}

function changeCheckoutQuantity(itemId, delta) {
    if (delta > 0) {
        addToCart(itemId);
    } else {
        removeFromCart(itemId);
    }

    const { totalItems } = getCartCalculations();
    if (totalItems === 0) {
        closeCheckoutModal();
        return;
    }
    renderCheckoutItems();
}

function closeCheckoutModal() {
    stopPaymentQrScanner();
    document.getElementById('checkoutModal').classList.add('hidden');
}

function selectPickupOption(option, btnElement) {
    state.selectedPickupTime = option;
    document.querySelectorAll('.pickup-btn').forEach(btn => {
        btn.classList.remove('active', 'border-orange-500', 'bg-orange-50', 'text-orange-800');
        btn.classList.add('border-slate-200', 'text-slate-700');
    });
    btnElement.classList.add('active', 'border-orange-500', 'bg-orange-50', 'text-orange-800');
    btnElement.classList.remove('border-slate-200', 'text-slate-700');
}

function handlePaymentChange(method) {
    state.selectedPaymentMethod = method;
    const scanner = document.getElementById('paymentQrScanner');
    scanner.classList.toggle('hidden', method !== 'UPI_QR');
    if (method !== 'UPI_QR') stopPaymentQrScanner();
}

async function startPaymentQrScanner() {
    const video = document.getElementById('paymentQrVideo');
    const status = document.getElementById('paymentQrStatus');
    const stopButton = document.getElementById('stopPaymentQrScannerBtn');
    const fallbackLink = document.getElementById('paymentQrFallbackLink');
    fallbackLink.classList.add('hidden');

    if (!('BarcodeDetector' in window)) {
        status.textContent = 'QR scanning is not supported in this browser. Open this checkout on a camera-capable mobile browser.';
        return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        status.textContent = 'Camera access requires a secure connection. Use HTTPS or localhost.';
        return;
    }

    stopPaymentQrScanner();
    status.textContent = 'Requesting camera access...';
    try {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        state.paymentQrScanStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
        });
        video.srcObject = state.paymentQrScanStream;
        video.classList.remove('hidden');
        stopButton.classList.remove('hidden');
        await video.play();
        status.textContent = 'Point the camera at the canteen UPI QR code.';

        const scanFrame = async () => {
            if (!state.paymentQrScanStream) return;
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                try {
                    const codes = await detector.detect(video);
                    if (codes.length) {
                        const paymentUri = createUpiPaymentUri(codes[0].rawValue);
                        if (!paymentUri) {
                            status.textContent = 'This QR is not a valid UPI payment QR. Scan the canteen payment QR.';
                        } else {
                            stopPaymentQrScanner();
                            status.textContent = 'Opening your UPI payment app...';
                            fallbackLink.href = paymentUri;
                            fallbackLink.classList.remove('hidden');
                            window.location.href = paymentUri;
                            return;
                        }
                    }
                } catch (err) {
                    console.warn('Could not read payment QR code:', err);
                }
            }
            state.paymentQrScanFrame = requestAnimationFrame(scanFrame);
        };
        state.paymentQrScanFrame = requestAnimationFrame(scanFrame);
    } catch (err) {
        stopPaymentQrScanner();
        status.textContent = err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access and try again.'
            : 'Could not start the camera. Check camera access and try again.';
    }
}

function createUpiPaymentUri(qrValue) {
    try {
        const paymentUri = new URL(qrValue.trim());
        if (paymentUri.protocol !== 'upi:' || paymentUri.hostname.toLowerCase() !== 'pay') return null;
        if (!paymentUri.searchParams.get('pa')) return null;

        const { totalPrice } = getCartCalculations();
        if (totalPrice <= 0) return null;
        paymentUri.searchParams.set('am', totalPrice.toFixed(2));
        paymentUri.searchParams.set('cu', 'INR');
        return paymentUri.toString();
    } catch (err) {
        return null;
    }
}

function stopPaymentQrScanner() {
    if (state.paymentQrScanFrame) {
        cancelAnimationFrame(state.paymentQrScanFrame);
        state.paymentQrScanFrame = null;
    }
    if (state.paymentQrScanStream) {
        state.paymentQrScanStream.getTracks().forEach(track => track.stop());
        state.paymentQrScanStream = null;
    }
    const video = document.getElementById('paymentQrVideo');
    const stopButton = document.getElementById('stopPaymentQrScannerBtn');
    if (video) {
        video.pause();
        video.srcObject = null;
        video.classList.add('hidden');
    }
    if (stopButton) stopButton.classList.add('hidden');
}

// ------------------------------------------------------------------------------
// PLACE ORDER SUBMISSION
// ------------------------------------------------------------------------------
async function submitOrder() {
    const { totalItems, totalPrice } = getCartCalculations();
    if (totalItems === 0) return;

    // Check Wallet Balance if WALLET_RFID is chosen
    if (state.selectedPaymentMethod === 'WALLET_RFID' && state.user.walletBalance < totalPrice) {
        alert(`⚠️ Insufficient RFID Balance!\nRequired: ₹${totalPrice.toFixed(2)}\nAvailable: ₹${state.user.walletBalance.toFixed(2)}\n\nPlease top up your wallet or select UPI.`);
        openRechargeModal();
        return;
    }

    const confirmBtn = document.getElementById('confirmOrderBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `
        <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Broadcasting to Kitchen Display...</span>
    `;

    const payload = {
        userId: state.user.id,
        customerName: state.user.name,
        customerPhone: state.user.phone,
        rfidTag: state.user.rfidTag,
        paymentMethod: state.selectedPaymentMethod,
        pickupTimeOption: state.selectedPickupTime,
        specialInstructions: document.getElementById('specialNotesInput').value.trim() || null,
        items: Object.entries(state.cart).map(([idStr, qty]) => ({
            menuItemId: Number(idStr),
            quantity: qty
        }))
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Failed to create order');
        }

        const createdOrder = await res.json();

        // Deduct local balance
        if (state.selectedPaymentMethod === 'WALLET_RFID') {
            state.user.walletBalance -= totalPrice;
            updateWalletDisplay();
        }

        // Reset Cart
        state.cart = {};
        updateCartUI();
        renderMenuItems();
        closeCheckoutModal();

        // Save active order locally
        localStorage.setItem('smart_canteen_active_order', createdOrder.orderNumber);

        // Launch Live Tracker Modal
        launchOrderTracker(createdOrder);

    } catch (err) {
        alert('Order Error: ' + err.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<span>🔥 Confirm & Place Order</span>`;
    }
}

// ------------------------------------------------------------------------------
// LIVE ORDER PREPARATION COUNTDOWN & TRACKING ENGINE
// ------------------------------------------------------------------------------
function launchOrderTracker(order) {
    state.activeOrder = order;
    state.activeTrackingOrderNumber = order.orderNumber;

    document.getElementById('trackerTokenNumber').textContent = `#${order.orderNumber}`;
    document.getElementById('trackerCustomerName').textContent = `Order for ${order.customerName} (${order.customerPhone})`;
    
    // Fill line items in tracker
    const itemsListEl = document.getElementById('trackerItemsList');
    if (order.items && order.items.length > 0) {
        itemsListEl.innerHTML = order.items.map(i => `
            <div class="flex items-center justify-between py-0.5">
                <span class="font-medium">${i.quantity}x ${i.itemName}</span>
                <span class="font-bold text-slate-900">₹${Number(i.subtotal).toFixed(2)}</span>
            </div>
        `).join('');
    } else {
        itemsListEl.innerHTML = `<div class="text-slate-400 italic">Fresh campus delicacies</div>`;
    }

    // Subscribe to direct order updates
    if (state.stompClient && state.stompClient.connected) {
        state.stompClient.subscribe(`/topic/order/${order.orderNumber}`, (msg) => {
            const updated = JSON.parse(msg.body);
            state.activeOrder = updated;
            updateOrderTrackerView(updated);
            updateActiveBanner(updated);
        });
    }

    updateOrderTrackerView(order);
    updateActiveBanner(order);
    startTrackerCountdown();

    document.getElementById('trackerModal').classList.remove('hidden');
}

function closeTrackerModal() {
    document.getElementById('trackerModal').classList.add('hidden');
}

function reopenActiveTracker() {
    if (state.activeOrder) {
        launchOrderTracker(state.activeOrder);
    }
}

function startTrackerCountdown() {
    if (state.trackerTimerInterval) {
        clearInterval(state.trackerTimerInterval);
    }

    tickPreparationTimer();
    state.trackerTimerInterval = setInterval(tickPreparationTimer, 1000);
}

function tickPreparationTimer() {
    if (!state.activeOrder) return;

    const order = state.activeOrder;
    const createdAt = new Date(order.createdAt).getTime() || Date.now();
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - createdAt) / 1000));
    
    const totalPrepMinutes = order.estimatedPrepMinutes || 10;
    const totalPrepSeconds = totalPrepMinutes * 60;
    const remainingSeconds = Math.max(0, totalPrepSeconds - elapsedSeconds);

    // Format minutes & seconds
    const remMin = Math.floor(remainingSeconds / 60);
    const remSec = remainingSeconds % 60;
    const timeFormatted = `${String(remMin).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;

    // Estimated pickup time
    const pickupDate = new Date(createdAt + totalPrepSeconds * 1000);
    const pickupTimeStr = pickupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const timerEl = document.getElementById('trackerCountdownTimer');
    const clockEl = document.getElementById('trackerEstPickupClock');
    const progressEl = document.getElementById('trackerProgressBar');
    const percentEl = document.getElementById('trackerProgressPercent');
    const cookingStatusEl = document.getElementById('trackerCookingStatus');
    const bannerCountdownEl = document.getElementById('bannerCountdownBadge');

    if (clockEl) clockEl.textContent = `Est. Ready ~ ${pickupTimeStr}`;

    if (order.status === 'READY' || order.status === 'COMPLETED') {
        if (timerEl) timerEl.textContent = '00:00 (READY!)';
        if (progressEl) progressEl.style.width = '100%';
        if (percentEl) percentEl.textContent = '100% Ready for Pickup';
        if (cookingStatusEl) cookingStatusEl.textContent = '🔔 Hot & Ready at Counter 2';
        if (bannerCountdownEl) bannerCountdownEl.textContent = '🔔 READY!';
    } else if (order.status === 'PREPARING') {
        const progressPct = Math.min(95, Math.max(15, Math.floor((elapsedSeconds / totalPrepSeconds) * 100)));
        if (timerEl) timerEl.textContent = timeFormatted;
        if (progressEl) progressEl.style.width = `${progressPct}%`;
        if (percentEl) percentEl.textContent = `${progressPct}% Prepared`;
        if (cookingStatusEl) cookingStatusEl.textContent = '🍳 Chef Ramesh is cooking fresh now!';
        if (bannerCountdownEl) bannerCountdownEl.textContent = `⏳ ${timeFormatted}`;
    } else { // NEW
        if (timerEl) timerEl.textContent = `${String(totalPrepMinutes).padStart(2, '0')}:00`;
        if (progressEl) progressEl.style.width = '10%';
        if (percentEl) percentEl.textContent = '10% Queued at KDS';
        if (cookingStatusEl) cookingStatusEl.textContent = '📥 Order Queued in Kitchen';
        if (bannerCountdownEl) bannerCountdownEl.textContent = `⏳ ~${totalPrepMinutes}m`;
    }
}

function updateActiveBanner(order) {
    const banner = document.getElementById('activeOrderBanner');
    const tokenText = document.getElementById('bannerTokenText');
    const statusText = document.getElementById('bannerStatusText');

    if (!order || order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        banner.classList.add('hidden');
        localStorage.removeItem('smart_canteen_active_order');
        return;
    }

    banner.classList.remove('hidden');
    tokenText.textContent = `#${order.orderNumber}`;

    if (order.status === 'READY') {
        statusText.textContent = '🔔 Order is READY for pickup at Counter 2!';
    } else if (order.status === 'PREPARING') {
        statusText.textContent = '🔥 Chef Ramesh is preparing your order fresh';
    } else {
        statusText.textContent = '📥 Order received & queued in kitchen';
    }
}

function updateOrderTrackerView(order) {
    const stepNew = document.getElementById('step-NEW');
    const stepPrep = document.getElementById('step-PREPARING');
    const stepReady = document.getElementById('step-READY');
    const smsBanner = document.getElementById('smsNotificationBanner');

    // Reset step styles
    [stepNew, stepPrep, stepReady].forEach(s => s.classList.add('opacity-40'));

    if (order.status === 'NEW') {
        stepNew.classList.remove('opacity-40');
        smsBanner.classList.add('hidden');
    } else if (order.status === 'PREPARING') {
        stepNew.classList.remove('opacity-40');
        stepPrep.classList.remove('opacity-40');
        const icon = stepPrep.querySelector('.step-icon');
        icon.classList.replace('bg-slate-200', 'bg-amber-500');
        icon.classList.add('text-white', 'shadow-md');
        smsBanner.classList.add('hidden');
    } else if (order.status === 'READY') {
        stepNew.classList.remove('opacity-40');
        stepPrep.classList.remove('opacity-40');
        stepReady.classList.remove('opacity-40');
        const icon = stepReady.querySelector('.step-icon');
        icon.classList.replace('bg-slate-200', 'bg-emerald-500');
        icon.classList.add('text-white', 'shadow-md');
        
        // Show simulated SMS Notification banner
        smsBanner.classList.remove('hidden');
        const recipientEl = document.getElementById('smsRecipientPhone');
        if (recipientEl && order.customerPhone) {
            recipientEl.textContent = order.customerPhone;
        }

        // Confetti Celebration!
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 90,
                spread: 75,
                origin: { y: 0.6 }
            });
        }
    }

    tickPreparationTimer();
}

// ------------------------------------------------------------------------------
// TOKEN LOOKUP MODAL
// ------------------------------------------------------------------------------
function openTokenLookupModal() {
    document.getElementById('tokenSearchModal').classList.remove('hidden');
    document.getElementById('tokenSearchInput').focus();
}

function closeTokenLookupModal() {
    stopOrderQrScanner();
    document.getElementById('tokenSearchModal').classList.add('hidden');
}

async function startOrderQrScanner() {
    const panel = document.getElementById('orderQrScanner');
    const status = document.getElementById('orderQrStatus');
    const video = document.getElementById('orderQrVideo');
    panel.classList.remove('hidden');

    if (!('BarcodeDetector' in window)) {
        status.textContent = 'QR scanning is not supported in this browser. Enter the order token above instead.';
        return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        status.textContent = 'Camera access requires a secure connection. Enter the order token above instead.';
        return;
    }

    try {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        state.qrScanStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
        });
        video.srcObject = state.qrScanStream;
        await video.play();
        status.textContent = 'Camera ready. Point it at an order QR code.';

        const scanFrame = async () => {
            if (!state.qrScanStream) return;
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                try {
                    const codes = await detector.detect(video);
                    if (codes.length) {
                        const token = codes[0].rawValue.toUpperCase().match(/ORD-[A-Z0-9-]+/);
                        if (token) {
                            document.getElementById('tokenSearchInput').value = token[0];
                            stopOrderQrScanner();
                            await fetchOrderByNumber(token[0], true);
                            return;
                        }
                        status.textContent = 'No order token found in this QR. Try an order QR or enter the token manually.';
                    }
                } catch (err) {
                    console.warn('Could not read QR code:', err);
                }
            }
            state.qrScanFrame = requestAnimationFrame(scanFrame);
        };
        state.qrScanFrame = requestAnimationFrame(scanFrame);
    } catch (err) {
        stopOrderQrScanner();
        status.textContent = err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Enter the order token above instead.'
            : 'Could not start the camera. Enter the order token above instead.';
    }
}

function stopOrderQrScanner() {
    if (state.qrScanFrame) {
        cancelAnimationFrame(state.qrScanFrame);
        state.qrScanFrame = null;
    }
    if (state.qrScanStream) {
        state.qrScanStream.getTracks().forEach(track => track.stop());
        state.qrScanStream = null;
    }
    const video = document.getElementById('orderQrVideo');
    if (video) video.srcObject = null;
}

async function lookupOrderByToken() {
    let inputVal = document.getElementById('tokenSearchInput').value.trim().toUpperCase();
    if (!inputVal) return;

    if (!inputVal.startsWith('ORD-')) {
        if (!isNaN(inputVal)) {
            inputVal = 'ORD-' + inputVal;
        }
    }

    await fetchOrderByNumber(inputVal, true);
}

async function fetchOrderByNumber(orderNumber, showAlertOnFail = true) {
    try {
        const res = await fetch(`/api/orders/track/${orderNumber}`);
        if (!res.ok) throw new Error('Order not found with token: ' + orderNumber);
        
        const order = await res.json();
        closeTokenLookupModal();
        localStorage.setItem('smart_canteen_active_order', order.orderNumber);
        launchOrderTracker(order);
    } catch (err) {
        if (showAlertOnFail) {
            alert('⚠️ ' + err.message);
        }
    }
}

// ------------------------------------------------------------------------------
// WALLET RECHARGE
// ------------------------------------------------------------------------------
function openRechargeModal() {
    document.getElementById('rechargeModal').classList.remove('hidden');
}

function closeRechargeModal() {
    document.getElementById('rechargeModal').classList.add('hidden');
}

function setRechargeVal(val) {
    document.getElementById('customRechargeAmount').value = val;
}

async function executeWalletRecharge() {
    const amount = Number(document.getElementById('customRechargeAmount').value);
    if (!amount || amount < 10) {
        alert('Please enter a valid amount (min ₹10)');
        return;
    }

    try {
        const res = await fetch(`/api/wallet/user/${state.user.id}/recharge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, paymentReference: 'UPI-SIM-' + Date.now() })
        });

        if (!res.ok) throw new Error('Recharge failed');
        const updated = await res.json();
        state.user.walletBalance = updated.balance;
        updateWalletDisplay();
        closeRechargeModal();
        alert(`✅ RFID Wallet topped up successfully!\nNew Balance: ₹${Number(updated.balance).toFixed(2)}`);
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ------------------------------------------------------------------------------
// FILTERS & SEARCH HANDLERS
// ------------------------------------------------------------------------------
function handleSearch(val) {
    state.searchQuery = val.trim();
    const clearBtn = document.getElementById('clearSearchBtn');
    if (state.searchQuery) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
    renderMenuItems();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    handleSearch('');
}

function filterCategory(cat) {
    state.currentCategory = cat;
    document.querySelectorAll('.cat-pill').forEach(pill => {
        if (pill.getAttribute('data-cat') === cat) {
            pill.classList.add('active', 'bg-orange-500', 'text-white', 'shadow-md', 'shadow-orange-500/25');
            pill.classList.remove('bg-white', 'border', 'border-slate-200', 'text-slate-700');
        } else {
            pill.classList.remove('active', 'bg-orange-500', 'text-white', 'shadow-md', 'shadow-orange-500/25');
            pill.classList.add('bg-white', 'border', 'border-slate-200', 'text-slate-700');
        }
    });
    renderMenuItems();
}

function toggleVegFilter() {
    state.vegOnly = !state.vegOnly;
    const btn = document.getElementById('vegFilterBtn');
    if (state.vegOnly) {
        btn.classList.add('bg-emerald-50', 'border-emerald-500', 'text-emerald-800');
    } else {
        btn.classList.remove('bg-emerald-50', 'border-emerald-500', 'text-emerald-800');
    }
    renderMenuItems();
}

function toggleQuickPrepFilter() {
    state.quickPrepOnly = !state.quickPrepOnly;
    const btn = document.getElementById('quickPrepBtn');
    if (state.quickPrepOnly) {
        btn.classList.add('bg-amber-50', 'border-amber-500', 'text-amber-800');
    } else {
        btn.classList.remove('bg-amber-50', 'border-amber-500', 'text-amber-800');
    }
    renderMenuItems();
}
