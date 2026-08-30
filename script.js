const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby8EcmaZBhhmIEcyPh6zkntmTW_jIr-9WQR16IrMv5kVCAIY19JN0-cUruHYCbfDVs/exec";

const towerSuggestions = [
    'vraj',
    'vidit',
    'vama',
    'vyan',
    'vedanta',
    'vinayak',
    'vatsal',
    'vittal',
    'vivaan'
];

const roomNoInput = document.getElementById('roomNo');
const towerNameInput = document.getElementById('towerName');
const modakInput = document.getElementById('noofModaks');
const modakPriceInput = document.getElementById('modakPrice');
const contactNoInput = document.getElementById('contactNo');
const emailInput = document.getElementById('emailId');
const personNameInput = document.getElementById('personName');
const towerSuggestionsList = document.getElementById('towerSuggestions');
const confirmationModal = document.getElementById('confirmationModal');
const orderPreview = document.getElementById('orderPreview');

const MODAK_PRICE_PER_UNIT = 35;
let pendingOrder = null;

function validateRoomNumber(value) {
    return /^\d{1,4}$/.test(value.trim());
}

function validateContactNumber(value) {
    return /^\d{10}$/.test(value.trim());
}

function validateEmail(value) {
    if (!value.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateMaxLength(value, maxLength) {
    return value.trim().length <= maxLength;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[character];
    });
}

function updateTotalPrice() {
    const quantity = Number(modakInput.value) || 0;
    const total = quantity * MODAK_PRICE_PER_UNIT;
    modakPriceInput.value = 'Rs. ' + total;
}

roomNoInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 4);
});

contactNoInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 10);
});

modakInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 3);
    updateTotalPrice();
});

personNameInput.addEventListener('input', function () {
    this.value = this.value.slice(0, 50);
});

emailInput.addEventListener('input', function () {
    this.value = this.value.slice(0, 50);
});

towerNameInput.addEventListener('input', function () {
    this.value = this.value.slice(0, 50);
    renderTowerSuggestions();
});

function renderTowerSuggestions() {
    const query = towerNameInput.value.trim().toLowerCase();

    if (!query) {
        towerSuggestionsList.innerHTML = '';
        towerSuggestionsList.classList.remove('show');
        return;
    }

    const filteredSuggestions = towerSuggestions.filter(function (name) {
        return name.toLowerCase().includes(query);
    });

    if (!filteredSuggestions.length) {
        towerSuggestionsList.innerHTML = '';
        towerSuggestionsList.classList.remove('show');
        return;
    }

    towerSuggestionsList.innerHTML = filteredSuggestions.map(function (name) {
        return '<li class="suggestion-item" data-value="' + name + '">' + name + '</li>';
    }).join('');

    towerSuggestionsList.classList.add('show');

    towerSuggestionsList.querySelectorAll('.suggestion-item').forEach(function (item) {
        item.addEventListener('click', function () {
            towerNameInput.value = this.dataset.value;
            towerSuggestionsList.innerHTML = '';
            towerSuggestionsList.classList.remove('show');
        });
    });
}

towerNameInput.addEventListener('focus', renderTowerSuggestions);

document.addEventListener('click', function (event) {
    if (!event.target.closest('.tower-field')) {
        towerSuggestionsList.innerHTML = '';
        towerSuggestionsList.classList.remove('show');
    }
});

modakInput.addEventListener('wheel', function (event) {
    event.preventDefault();
}, { passive: false });

modakInput.addEventListener('keydown', function (event) {
    if (['e', 'E', '+', '-', '.'].includes(event.key)) {
        event.preventDefault();
    }
});

document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();

    if (!validateRoomNumber(roomNoInput.value)) {
        alert('Room number must be between 1 and 4 numeric digits.');
        roomNoInput.focus();
        return;
    }

    if (!validateContactNumber(contactNoInput.value)) {
        alert('Contact number must be exactly 10 digits without country code.');
        contactNoInput.focus();
        return;
    }

    if (!validateEmail(emailInput.value)) {
        alert('Please enter a valid email address.');
        emailInput.focus();
        return;
    }

    if (!validateMaxLength(personNameInput.value, 50) || !validateMaxLength(towerNameInput.value, 50) || !validateMaxLength(emailInput.value, 50)) {
        alert('Text fields cannot exceed 50 characters.');
        return;
    }

    const qty = Number(modakInput.value) || 0;
    const calculatedPrice = "Rs. " + (qty * MODAK_PRICE_PER_UNIT);

    pendingOrder = {
        noofModaks: modakInput.value,
        modakPrice: calculatedPrice,
        roomNo: roomNoInput.value,
        towerName: towerNameInput.value,
        personName: personNameInput.value,
        contactNo: contactNoInput.value,
        emailId: emailInput.value
    };

    orderPreview.innerHTML = Object.entries({
        'No. of Modaks': pendingOrder.noofModaks,
        'Total Price': pendingOrder.modakPrice,
        'Room No.': pendingOrder.roomNo,
        'Tower Name': pendingOrder.towerName,
        'Your Name': pendingOrder.personName,
        'Contact No.': pendingOrder.contactNo,
        'Email ID': pendingOrder.emailId || 'Not provided'
    }).map(function ([label, value]) {
        return '<div class="preview-row"><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd></div>';
    }).join('');

    confirmationModal.style.display = 'flex';
});

function confirmOrder() {
    if (!pendingOrder) return;

    // Generate random 6-digit Order ID
    const orderId = String(Math.floor(100000 + Math.random() * 900000));
    pendingOrder.orderId = orderId;

    const formData = new URLSearchParams(pendingOrder);
    confirmationModal.style.display = 'none';
    document.getElementById('successModal').style.display = 'flex';
    
    // Display Order ID in the modal
    document.getElementById('orderIdDisplay').textContent = 'Order ID: ' + orderId;
    
    document.getElementById('orderForm').reset();
    modakPriceInput.value = 'Rs. 0';
    towerSuggestionsList.innerHTML = '';
    towerSuggestionsList.classList.remove('show');

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
    })
    .catch(error => {
        console.error('Error sending order in background:', error);
    });

    pendingOrder = null;
}

function closeConfirmationModal() {
    confirmationModal.style.display = 'none';
    pendingOrder = null;
}

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
}

// ==========================================
// SECURITY SCRIPT: ADD THIS AT THE VERY END
// ==========================================

// Disable Right-Click
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Disable common Developer Tools keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Prevent F12
    if (e.key === 'F12') {
        e.preventDefault();
    }
    // Prevent Ctrl+Shift+I (Inspect) and Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
    }
    // Prevent Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
    }
});