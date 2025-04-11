const branchBlueprints = {
    dreamwood: { 
        name: "Plantopia Dreamwood", 
        tables: 12,
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019735215174!2d-122.419415684681!3d37.774929779759!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808f8e2e3b1b%3A0x2e2e3b1b8e2e3b1b!2sSan%20Francisco%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1630000000000!5m2!1sen!2sin",
        address: "123 Dreamwood St, San Francisco, CA 94102"
    },
    heavengarden: { 
        name: "Plantopia Heavengarden", 
        tables: 8,
        mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3329.031057233543!2d-118.243684884623!3d34.052235980601!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2c75ddc27da13%3A0xe22fdf6f254608f4!2sLos%20Angeles%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1630000000000!5m2!1sen!2sin",
        address: "456 Heaven Ave, Los Angeles, CA 90001"
    }
};

// Get googleId from localStorage (set by auth.js)
const getGoogleId = () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user ? user.id : null;
};

let selectedTable;

document.addEventListener('DOMContentLoaded', () => {
    console.log('TABLE.js loaded');
    setDefaultDate();
    updateBlueprint();
});

function setDefaultDate() {
    const dateInput = document.getElementById('date-select');
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
    dateInput.min = today.toISOString().split('T')[0];
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    dateInput.max = maxDate.toISOString().split('T')[0];
}

async function updateBlueprint() {
    const branchSelect = document.getElementById('branch-select');
    const dateSelect = document.getElementById('date-select');
    const timeSelect = document.getElementById('time-select');
    const selectedBranch = branchSelect.value;
    const selectedDate = dateSelect.value;
    const selectedTime = timeSelect.value;
    const blueprintGrid = document.getElementById('blueprint-grid');
    const branchName = document.getElementById('branch-name');
    const branchMap = document.getElementById('branch-map');
    const branchAddress = document.getElementById('branch-address');

    branchName.textContent = branchBlueprints[selectedBranch].name;
    branchMap.src = branchBlueprints[selectedBranch].mapUrl;
    branchAddress.textContent = branchBlueprints[selectedBranch].address;
    blueprintGrid.innerHTML = '';

    if (!selectedTime) {
        blueprintGrid.innerHTML = '<p>Please select a time slot to view available tables.</p>';
        return;
    }

    console.log('Updating blueprint for:', { branch: selectedBranch, date: selectedDate, time: selectedTime });
    const tableCount = branchBlueprints[selectedBranch].tables;
    const urlSafeTime = selectedTime.replace(/\s/g, '_'); // Replace space with underscore
    const reservedTables = await getReservedTables(selectedBranch, selectedDate, urlSafeTime);

    for (let i = 1; i <= tableCount; i++) {
        const table = document.createElement('div');
        table.className = 'table';
        table.id = `table-${i}`;
        table.innerHTML = `
            <span class="table-number">Table ${i}</span>
            <div class="table-status"></div>
        `;
        if (reservedTables.includes(i)) {
            table.classList.add('reserved');
        } else {
            table.onclick = () => openReservationForm(i);
        }
        blueprintGrid.appendChild(table);
    }
}

async function getReservedTables(branch, date, time) {
    try {
        const url = `https://plantopiawebsite-final.onrender.com/api/reservations/${branch}/${date}/${time}`;
        console.log('Fetching reserved tables from:', url);
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Fetch failed:', response.status, response.statusText);
            throw new Error(`Failed to fetch reservations: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Reserved tables received:', data);
        return data;
    } catch (err) {
        console.error('Error in getReservedTables:', err);
        alert('Unable to load reserved tables. Please try again later.');
        return [];
    }
}

function openReservationForm(tableId) {
    const timeSelect = document.getElementById('time-select');
    if (!timeSelect.value) {
        alert('Please select a time slot before reserving a table.');
        return;
    }
    selectedTable = tableId;
    const popup = document.getElementById('reservation-popup');
    document.getElementById('reservation-form').reset();
    popup.classList.add('show');
}

function closeReservationForm() {
    document.getElementById('reservation-popup').classList.remove('show');
}

async function submitReservation(event) {
    event.preventDefault();

    const googleId = getGoogleId();
    if (!googleId) {
        alert('Please sign in to make a reservation.');
        return;
    }

    const name = document.getElementById('name').value.trim();
    const people = parseInt(document.getElementById('people').value);
    const terms = document.getElementById('terms').checked;
    const date = document.getElementById('date-select').value;
    const time = document.getElementById('time-select').value; // Keep original format for storage
    const branch = document.getElementById('branch-select').value;

    if (!name || !people || !terms) {
        alert('Please fill all fields and agree to the terms.');
        return;
    }
    if (people < 1 || people > 12) {
        alert('Guests must be between 1 and 12.');
        return;
    }

    const reservation = {
        table: selectedTable,
        name,
        people,
        date,
        time, // Use original time with space
        branch,
        cancelled: false
    };

    try {
        console.log('Submitting reservation:', reservation);
        const response = await fetch(`https://plantopiawebsite-final.onrender.com/api/users/${googleId}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservation)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to submit reservation: ${errorData.message || response.statusText}`);
        }
        const savedReservation = await response.json();

        const confirmationMessage = document.getElementById('confirmation-message');
        confirmationMessage.textContent = `Table ${selectedTable} reserved for ${name} on ${new Date(date).toLocaleDateString()} at ${time} for ${people} guests. Reservation ID: ${savedReservation.reservationId}`;
        document.getElementById('confirmation-modal').classList.add('show');

        closeReservationForm();
        updateBlueprint();
    } catch (err) {
        console.error('Error in submitReservation:', err);
        alert(`Failed to submit reservation: ${err.message}`);
    }
}

function closeConfirmationModal() {
    document.getElementById('confirmation-modal').classList.remove('show');
}

function openTermsPopup(event) {
    event.preventDefault();
    document.getElementById('terms-popup').classList.add('show');
}

function closeTermsPopup() {
    document.getElementById('terms-popup').classList.remove('show');
}
