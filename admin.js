/*
 * The Apps Script web app must implement the two POST actions documented in
 * google-apps-script-admin.gs. Passwords and sheet data never live in this file.
 */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8EcmaZBhhmIEcyPh6zkntmTW_jIr-9WQR16IrMv5kVCAIY19JN0-cUruHYCbfDVs/exec';
const SESSION_KEY = 'dayaAdminSession';

const loginPanel = document.getElementById('loginPanel');
const ordersPanel = document.getElementById('ordersPanel');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const ordersStatus = document.getElementById('ordersStatus');
const ordersBody = document.getElementById('ordersBody');
const orderModal = document.getElementById('orderModal');
const orderPreview = document.getElementById('adminOrderPreview');
const paymentMode = document.getElementById('paymentMode');
const paymentDoneButton = document.getElementById('paymentDoneButton');

let orders = [];
let selectedOrder = null;

function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
}

function getSession() {
    try {
        const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
        return session && session.token ? session : null;
    } catch (_) {
        return null;
    }
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

async function postToApi(data) {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams(data)
    });

    if (!response.ok) throw new Error('Unable to contact the order service.');

    const responseText = await response.text();
    try {
        return JSON.parse(responseText);
    } catch (_) {
        throw new Error('Admin API is not installed yet. Add the admin handler to Apps Script and redeploy the web app.');
    }
}

function showLogin(message) {
    clearSession();
    ordersPanel.hidden = true;
    loginPanel.hidden = false;
    loginError.textContent = message || '';
    document.getElementById('password').value = '';
}

function showOrders() {
    loginPanel.hidden = true;
    ordersPanel.hidden = false;
}

function renderOrders() {
    ordersBody.innerHTML = orders.map(function (order, index) {
        const isPaymentDone = String(order.paymentStatus || order.paymentstatus || '').trim().toLowerCase() === 'payment done';
        const actionButton = isPaymentDone
            ? '<button class="done-btn view-btn payment-complete-btn" type="button" disabled>Payment Done</button>'
            : '<button class="done-btn view-btn" type="button" data-order-index="' + index + '">View</button>';
        return '<tr>' +
            '<td>' + escapeHtml(order.roomNo) + '</td>' +
            '<td>' + escapeHtml(order.towerName) + '</td>' +
            '<td>' + escapeHtml(order.noofModaks) + '</td>' +
            '<td>' + actionButton + '</td>' +
            '</tr>';
    }).join('');
}

async function loadOrders() {
    const session = getSession();
    if (!session) return showLogin();

    showOrders();
    ordersStatus.textContent = 'Loading orders...';
    ordersBody.innerHTML = '';

    try {
        const data = await postToApi({ action: 'getOrders', token: session.token });
        if (!data.success || !Array.isArray(data.orders)) {
            throw new Error(data.message || 'Your session has expired. Please log in again.');
        }
        orders = data.orders;
        renderOrders();
        ordersStatus.textContent = orders.length ? orders.length + ' order(s) found.' : 'No orders found.';
    } catch (error) {
        showLogin(error.message || 'Unable to load orders. Please log in again.');
    }
}

function openOrderModal(order) {
    selectedOrder = order;
    const labels = {
        orderId: 'Order ID', noofModaks: 'No. of Modaks', modakPrice: 'Total Price',
        roomNo: 'Room No.', towerName: 'Tower Name', personName: 'Name',
        contactNo: 'Contact No.', emailId: 'Email ID', timestamp: 'Order Time'
    };
    orderPreview.innerHTML = Object.keys(labels).filter(function (key) {
        return order[key] !== undefined && order[key] !== '';
    }).map(function (key) {
        return '<div class="preview-row"><dt>' + labels[key] + '</dt><dd>' + escapeHtml(order[key]) + '</dd></div>';
    }).join('');
    paymentMode.value = '';
    paymentDoneButton.textContent = 'Close';
    paymentDoneButton.disabled = false;
    orderModal.style.display = 'flex';
    orderModal.setAttribute('aria-hidden', 'false');
    paymentDoneButton.focus();
}

function closeOrderModal() {
    orderModal.style.display = 'none';
    orderModal.setAttribute('aria-hidden', 'true');
    selectedOrder = null;
}

paymentMode.addEventListener('change', function () {
    if (paymentMode.value === 'Cash in hand') {
        paymentDoneButton.textContent = 'Payment Done';
        return;
    }
    paymentDoneButton.textContent = 'Close';
});

paymentDoneButton.addEventListener('click', async function () {
    if (paymentMode.value !== 'Cash in hand') {
        closeOrderModal();
        return;
    }
    if (!selectedOrder || !selectedOrder.orderId) {
        return alert('This order has no Order ID, so its payment status cannot be updated.');
    }

    paymentDoneButton.disabled = true;
    paymentDoneButton.textContent = 'Saving...';
    try {
        const session = getSession();
        const data = await postToApi({
            action: 'markPaymentDone',
            token: session.token,
            orderId: selectedOrder.orderId
        });
        if (!data.success) throw new Error(data.message || 'Unable to update payment status.');
        closeOrderModal();
        await loadOrders();
    } catch (error) {
        paymentDoneButton.disabled = false;
        paymentDoneButton.textContent = 'Payment Done';
        alert(error.message || 'Unable to update payment status.');
    }
});

loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) return;

    loginError.textContent = 'Signing in...';
    try {
        const data = await postToApi({ action: 'adminLogin', username: username, password: password });
        if (!data.success || !data.token) throw new Error(data.message || 'Invalid username or password.');
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: data.token }));
        loginError.textContent = '';
        await loadOrders();
    } catch (error) {
        showLogin(error.message || 'Unable to sign in.');
    }
});

ordersBody.addEventListener('click', function (event) {
    const button = event.target.closest('[data-order-index]');
    if (button) openOrderModal(orders[Number(button.dataset.orderIndex)]);
});

document.getElementById('logoutButton').addEventListener('click', function () { showLogin(); });
orderModal.addEventListener('click', function (event) { if (event.target === orderModal) closeOrderModal(); });
document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeOrderModal(); });

loadOrders();
