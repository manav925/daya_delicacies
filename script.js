
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

const MODAK_PRICE_PER_UNIT = 35;

function validateRoomNumber(value) {
    return /^\d{4}$/.test(value.trim());
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
        alert('Room number must be exactly 4 numeric digits.');
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

    const formData = {
        roomNo: roomNoInput.value,
        towerName: towerNameInput.value,
        noofModaks: modakInput.value,
        personName: personNameInput.value,
        contactNo: contactNoInput.value,
        emailId: emailInput.value
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(formData)
    })
    .then(() => {
        document.getElementById('successModal').style.display = 'flex';
        document.getElementById('orderForm').reset();
        modakPriceInput.value = 'Rs. 0';
        towerSuggestionsList.innerHTML = '';
        towerSuggestionsList.classList.remove('show');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Could not send order. Please check your connection.');
    });
});

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
}