const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby8EcmaZBhhmIEcyPh6zkntmTW_jIr-9WQR16IrMv5kVCAIY19JN0-cUruHYCbfDVs/exec";

document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = {
        roomNo: document.getElementById('roomNo').value,
        towerName: document.getElementById('towerName').value,
        noofModaks: document.getElementById('noofModaks').value, 
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
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Could not send order. Please check your connection.');
    });
});

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
}