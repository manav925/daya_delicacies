
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby8EcmaZBhhmIEcyPh6zkntmTW_jIr-9WQR16IrMv5kVCAIY19JN0-cUruHYCbfDVs/exec";

const towerSuggestions = [
    'vraj',
    'vidit',
    'vama',
    'vyan',
];

const roomNoInput = document.getElementById('roomNo');
const towerNameInput = document.getElementById('towerName');
const modakInput = document.getElementById('noofModaks');
const towerSuggestionsList = document.getElementById('towerSuggestions');

function validateRoomNumber(value) {
    return /^\d{4}$/.test(value.trim());
}

roomNoInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 4);
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

towerNameInput.addEventListener('input', renderTowerSuggestions);
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

    const formData = {
        roomNo: roomNoInput.value,
        towerName: towerNameInput.value,
        noofModaks: modakInput.value,
        personName: document.getElementById('personName').value,
        contactNo: document.getElementById('contactNo').value,
        emailId: document.getElementById('emailId').value
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