document.addEventListener('DOMContentLoaded', () => {
    const patientId = localStorage.getItem('patient_id');
    if (!patientId) {
        alert('You must be logged in to book an appointment.');
        window.location.href = '/';
        return;
    }

    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-spec');
    const clearButton = document.getElementById('clear-search');
    const doctorListDiv = document.getElementById('doctor-list');
    const bookingMessage = document.getElementById('booking-message');

    const fetchDoctors = async (specialization = '') => {
        let url = '/api/doctors';
        if (specialization) {
            url += `?specialization=${specialization}`;
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch doctors');
            
            const doctors = await response.json();
            doctorListDiv.innerHTML = ''; 
            if (doctors.length === 0) {
                doctorListDiv.innerHTML = '<p class="text-gray-500">No doctors found.</p>';
                return;
            }
            doctors.forEach(doc => {
                const doctorCard = document.createElement('div');
                doctorCard.className = 'bg-white p-6 rounded-lg shadow-lg';
                doctorCard.innerHTML = `
                    <h3 class="text-xl font-semibold text-gray-800">Dr. ${doc.first_name} ${doc.last_name}</h3>
                    <p class="text-indigo-600 font-medium">${doc.specialization}</p>
                    <form class="booking-form mt-4 border-t pt-4 space-y-2">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Select date and time:</label>
                            <input type="datetime-local" class="appt-time w-full px-3 py-2 border rounded-md" required>
                        </div>
                        <input type="hidden" class="doctor-id" value="${doc.doctor_id}">
                        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300">Book Now</button>
                    </form>
                `;
                doctorListDiv.appendChild(doctorCard);
            });
        } catch (error) {
            doctorListDiv.innerHTML = `<p class="text-red-600">Error: ${error.message}</p>`;
        }
    };

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        fetchDoctors(searchInput.value);
    });

    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        fetchDoctors();
    });

    doctorListDiv.addEventListener('submit', async (event) => {
        if (event.target.classList.contains('booking-form')) {
            event.preventDefault();
            bookingMessage.classList.remove('text-green-600', 'text-red-600');
            
            const form = event.target;
            const doctor_id = form.querySelector('.doctor-id').value;
            let appointment_time = form.querySelector('.appt-time').value;
            appointment_time = appointment_time.replace('T', ' ') + ':00';

            try {
                const response = await fetch('/api/appointments/book', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patient_id: parseInt(patientId),
                        doctor_id: parseInt(doctor_id),
                        appointment_time: appointment_time
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    bookingMessage.textContent = 'Appointment booked successfully!';
                    bookingMessage.classList.add('text-green-600');
                    form.reset();
                } else {
                    bookingMessage.textContent = `Error: ${result.error}`;
                    bookingMessage.classList.add('text-red-600');
                }
            } catch (err) {
                bookingMessage.textContent = 'A network error occurred.';
                bookingMessage.classList.add('text-red-600');
            }
        }
    });

    fetchDoctors();
});