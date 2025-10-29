document.addEventListener('DOMContentLoaded', () => {

    // --- REGISTRATION FORM ---
    const registerForm = document.getElementById('register-form');
    const registerMessage = document.getElementById('register-message');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const firstName = document.getElementById('reg-first-name').value;
        const lastName = document.getElementById('reg-last-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        const registrationData = { first_name: firstName, last_name: lastName, email: email, password: password };

        try {
            const response = await fetch('/api/register/patient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registrationData)
            });
            const result = await response.json();

            // Clear old classes
            registerMessage.classList.remove('text-green-600', 'text-red-600');

            if (response.ok) {
                registerMessage.textContent = result.message;
                registerMessage.classList.add('text-green-600');
                registerForm.reset();
            } else {
                registerMessage.textContent = `Error: ${result.error}`;
                registerMessage.classList.add('text-red-600');
            }
        } catch (error) {
            registerMessage.textContent = 'A network error occurred. Please try again.';
            registerMessage.classList.add('text-red-600');
        }
    });

    
    // --- LOGIN FORM ---
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const loginData = { email: email, password: password };

        try {
            const response = await fetch('/api/login/patient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });
            const result = await response.json();
            
            // Clear old classes
            loginMessage.classList.remove('text-green-600', 'text-red-600');

            if (response.ok) {
                loginMessage.textContent = result.message;
                loginMessage.classList.add('text-green-600');
                
                localStorage.setItem('patient_id', result.patient_id);
                localStorage.setItem('patient_name', result.first_name);

                setTimeout(() => { window.location.href = '/dashboard'; }, 1000);

            } else {
                loginMessage.textContent = `Error: ${result.error}`;
                loginMessage.classList.add('text-red-600');
            }
        } catch (error) {
            loginMessage.textContent = 'A network error occurred. Please try again.';
            loginMessage.classList.add('text-red-600');
        }
    });
});