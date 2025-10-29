document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('doctor-login-form')) {
        handleLoginPage();
    } else if (document.getElementById('doctor-dashboard-page')) {
        handleDashboardPage();
    }
});

function handleLoginPage() {
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        loginMessage.classList.remove('text-green-600', 'text-red-600');

        try {
            const response = await fetch('/api/login/doctor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();
            if (response.ok) {
                loginMessage.textContent = 'Login successful! Redirecting...';
                loginMessage.classList.add('text-green-600');
                localStorage.setItem('doctor_id', result.doctor_id);
                localStorage.setItem('doctor_name', result.first_name);
                setTimeout(() => { window.location.href = '/doctor/dashboard'; }, 1000);
            } else {
                loginMessage.textContent = `Error: ${result.error}`;
                loginMessage.classList.add('text-red-600');
            }
        } catch (error) {
            loginMessage.textContent = 'A network error occurred.';
            loginMessage.classList.add('text-red-600');
        }
    });
}

let currentAppointmentId = null;

function handleDashboardPage() {
    const doctorId = localStorage.getItem('doctor_id');
    const doctorName = localStorage.getItem('doctor_name');

    if (!doctorId) {
        alert('You are not logged in. Redirecting to login page.');
        window.location.href = '/doctor/login';
        return;
    }

    document.getElementById('welcome-message').textContent = `Welcome, Dr. ${doctorName}!`;
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.clear();
        alert('You have been logged out.');
        window.location.href = '/doctor/login';
    });

    const formsContainer = document.getElementById('forms-container');
    const noApptSelectedText = document.getElementById('no-appointment-selected');
    const updateVisitForm = document.getElementById('update-visit-form');
    const issuePrescriptionForm = document.getElementById('issue-prescription-form');
    const updateMessage = document.getElementById('update-message');
    const prescriptionMessage = document.getElementById('prescription-message');

    fetchDoctorAppointments(doctorId);

    updateVisitForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!currentAppointmentId) return;

        const visit_notes = document.getElementById('visit-notes').value;
        const status = document.getElementById('visit-status').value;

        updateMessage.classList.remove('text-green-600', 'text-red-600');

        try {
            const response = await fetch(`/api/appointments/${currentAppointmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visit_notes, status })
            });
            const result = await response.json();

            if (response.ok) {
                updateMessage.textContent = 'Visit updated successfully!';
                updateMessage.classList.add('text-green-600');
                fetchDoctorAppointments(doctorId);
            } else {
                updateMessage.textContent = `Error: ${result.error}`;
                updateMessage.classList.add('text-red-600');
            }
        } catch (err) {
            updateMessage.textContent = 'A network error occurred.';
            updateMessage.classList.add('text-red-600');
        }
    });

    issuePrescriptionForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!currentAppointmentId) return;

        const medication_name = document.getElementById('med-name').value;
        const dosage = document.getElementById('med-dosage').value;
        const instructions = document.getElementById('med-instructions').value;

        prescriptionMessage.classList.remove('text-green-600', 'text-red-600');

        try {
            const response = await fetch('/api/prescriptions/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_id: currentAppointmentId,
                    medication_name,
                    dosage,
                    instructions
                })
            });
            const result = await response.json();

            if (response.ok) {
                prescriptionMessage.textContent = 'Prescription issued!';
                prescriptionMessage.classList.add('text-green-600');
                issuePrescriptionForm.reset();
            } else {
                prescriptionMessage.textContent = `Error: ${result.error}`;
                prescriptionMessage.classList.add('text-red-600');
            }
        } catch (err) {
            prescriptionMessage.textContent = 'A network error occurred.';
            prescriptionMessage.classList.add('text-red-600');
        }
    });
}

async function fetchDoctorAppointments(doctorId) {
    const listElement = document.getElementById('appointments-list');
    try {
        const response = await fetch(`/api/doctors/${doctorId}/appointments`);
        if (!response.ok) throw new Error('Failed to fetch appointments');

        const appointments = await response.json();
        listElement.innerHTML = '';
        if (appointments.length === 0) {
            listElement.innerHTML = '<li class="text-gray-500">You have no scheduled appointments.</li>';
            return;
        }

        appointments.forEach(appt => {
            const li = document.createElement('li');
            li.className = 'p-4 rounded-md border cursor-pointer hover:bg-gray-100 transition duration-200';
            li.innerHTML = `
                <strong class="block text-gray-800">${new Date(appt.appointment_time).toLocaleString()}</strong>
                <span class="text-sm text-gray-600">Patient: ${appt.patient_first_name} ${appt.patient_last_name}</span><br>
                <span class="text-sm font-semibold ${appt.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}">${appt.status}</span>
            `;
            li.addEventListener('click', () => {
                currentAppointmentId = appt.appointment_id;

                document.getElementById('form-patient-name').textContent = `${appt.patient_first_name} ${appt.patient_last_name}`;
                document.getElementById('form-appt-time').textContent = new Date(appt.appointment_time).toLocaleString();
                document.getElementById('visit-notes').value = appt.visit_notes || '';
                document.getElementById('visit-status').value = appt.status;

                document.getElementById('forms-container').classList.remove('hidden');
                document.getElementById('no-appointment-selected').classList.add('hidden');

                document.getElementById('update-message').textContent = '';
                document.getElementById('prescription-message').textContent = '';
                document.getElementById('issue-prescription-form').reset();
            });
            listElement.appendChild(li);
        });
    } catch (error) {
        listElement.innerHTML = `<li class="text-red-600">Error loading appointments: ${error.message}</li>`;
    }
}