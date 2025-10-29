document.addEventListener('DOMContentLoaded', () => {
    const patientId = localStorage.getItem('patient_id');
    const patientName = localStorage.getItem('patient_name');

    if (!patientId) {
        alert('You are not logged in. Redirecting to login page.');
        window.location.href = '/'; 
        return; 
    }
    document.getElementById('welcome-message').textContent = `Welcome, ${patientName}!`;
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.clear(); 
        alert('You have been logged out.');
        window.location.href = '/'; 
    });

    fetchPatientAppointments(patientId);
    fetchPatientPrescriptions(patientId);
    fetchPatientOrders(patientId);

    const pharmacyForm = document.getElementById('pharmacy-form');
    const messageEl = document.getElementById('pharmacy-message');

    pharmacyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const shippingAddress = document.getElementById('shipping-address').value;
        const checkedBoxes = document.querySelectorAll('input[name="prescription_ids"]:checked');
        const prescription_ids = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

        messageEl.classList.remove('text-green-600', 'text-red-600');

        if (prescription_ids.length === 0) {
            messageEl.textContent = 'Please select at least one item to order.';
            messageEl.classList.add('text-red-600');
            return;
        }

        try {
            const response = await fetch('/api/pharmacy/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: parseInt(patientId),
                    shipping_address: shippingAddress,
                    prescription_ids: prescription_ids
                })
            });
            const result = await response.json();

            if (response.ok) {
                messageEl.textContent = 'Order placed successfully!';
                messageEl.classList.add('text-green-600');
                pharmacyForm.reset();
                fetchPatientPrescriptions(patientId);
                fetchPatientOrders(patientId);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            messageEl.textContent = `Error: ${error.message}`;
            messageEl.classList.add('text-red-600');
        }
    });
});

async function fetchPatientAppointments(patientId) {
    const listElement = document.getElementById('appointments-list');
    try {
        const response = await fetch(`/api/patients/${patientId}/appointments`);
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const appointments = await response.json();
        listElement.innerHTML = ''; 
        if (appointments.length === 0) {
            listElement.innerHTML = '<li class="text-gray-500">You have no appointments.</li>';
            return;
        }
        appointments.forEach(appt => {
            const li = document.createElement('li');
            li.className = 'p-4 border-b last:border-b-0';
            li.innerHTML = `
                <span class="block font-medium text-gray-800">Date:</span> ${new Date(appt.appointment_time).toLocaleString()} <br>
                <span class="block font-medium text-gray-800">Doctor:</span> Dr. ${appt.doctor_first_name} ${appt.doctor_last_name} (${appt.specialization}) <br>
                <span class="block font-medium text-gray-800">Status:</span> 
                <span class="font-semibold ${appt.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}">${appt.status}</span>
            `;
            listElement.appendChild(li);
        });
    } catch (error) {
        listElement.innerHTML = `<li class="text-red-600">Error: ${error.message}</li>`;
    }
}

async function fetchPatientPrescriptions(patientId) {
    const historyList = document.getElementById('prescriptions-list');
    const orderList = document.getElementById('order-items-list');
    const orderBtn = document.getElementById('place-order-btn');
    try {
        const response = await fetch(`/api/patients/${patientId}/prescriptions`);
        if (!response.ok) throw new Error('Failed to fetch prescriptions');
        const prescriptions = await response.json();
        historyList.innerHTML = ''; 
        orderList.innerHTML = ''; 
        if (prescriptions.length === 0) {
            historyList.innerHTML = '<li class="text-gray-500">You have no prescriptions.</li>';
        }

        let orderableItems = 0;
        prescriptions.forEach(pres => {
            const li = document.createElement('li');
            li.className = 'p-4 border-b last:border-b-0';
            li.innerHTML = `
                <span class="block font-medium text-gray-800">Medication:</span> ${pres.medication_name} (${pres.dosage}) <br>
                <span class="block font-medium text-gray-800">Prescribed by:</span> Dr. ${pres.doctor_first_name} ${pres.doctor_last_name} <br>
                <span class="block font-medium text-gray-800">Status:</span> 
                <span class="font-semibold ${pres.is_ordered === 'Yes' ? 'text-green-600' : 'text-red-600'}">
                    ${pres.is_ordered === 'Yes' ? 'Ordered' : 'Not Ordered'}
                </span>
            `;
            historyList.appendChild(li);

            if (pres.is_ordered === 'No') {
                orderableItems++;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100';
                itemDiv.innerHTML = `
                    <input type="checkbox" name="prescription_ids" value="${pres.prescription_id}" id="pres-${pres.prescription_id}" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                    <label for="pres-${pres.prescription_id}" class="text-sm text-gray-700">
                        ${pres.medication_name} (${pres.dosage})
                    </label>
                `;
                orderList.appendChild(itemDiv);
            }
        });

        if (orderableItems > 0) {
            orderBtn.disabled = false;
        } else {
            orderList.innerHTML = '<p class="text-gray-500 text-sm">You have no prescriptions available to order.</p>';
            orderBtn.disabled = true;
        }
    } catch (error) {
        historyList.innerHTML = `<li class="text-red-600">Error: ${error.message}</li>`;
    }
}

async function fetchPatientOrders(patientId) {
    const listElement = document.getElementById('order-history-list');
    try {
        const response = await fetch(`/api/patients/${patientId}/orders`);
        if (!response.ok) throw new Error('Failed to fetch order history');
        const orders = await response.json();
        listElement.innerHTML = '';
        if (orders.length === 0) {
            listElement.innerHTML = '<li class="text-gray-500">You have no past orders.</li>';
            return;
        }
        orders.forEach(order => {
            const li = document.createElement('li');
            li.className = 'p-4 border-b last:border-b-0';
            const itemsHtml = order.items.map(item => `<li class="text-sm text-gray-600 ml-4">${item}</li>`).join('');
            li.innerHTML = `
                <span class="block font-medium text-gray-800">Order ID:</span> ${order.order_id}
                <span classclass="block text-sm text-gray-500">${new Date(order.order_date).toLocaleString()}</span>
                <span class="block font-medium text-gray-800">Status:</span> <span class="font-semibold text-blue-600">${order.status}</span>
                <span class="block font-medium text-gray-800 mt-2">Items:</span>
                <ul class="list-disc list-inside">${itemsHtml}</ul>
            `;
            listElement.appendChild(li);
        });
    } catch (error) {
        listElement.innerHTML = `<li class="text-red-600">Error: ${error.message}</li>`;
    }
}