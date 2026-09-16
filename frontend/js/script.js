// Basic frontend-only interactions. No backend or database calls are made here.
document.addEventListener('DOMContentLoaded', () => {
    const messages = {
        'missing-fields': ['Please complete all required fields.', 'danger'],
        'invalid-email': ['Please enter a valid email address.', 'danger'],
        'invalid-phone': ['Please enter a valid 10-digit phone number.', 'danger'],
        'password-mismatch': ['Passwords do not match.', 'danger'],
        'email-exists': ['That email address is already registered.', 'danger'],
        'invalid-credentials': ['Invalid email or password.', 'danger'],
        'login-required': ['Please log in to access that page.', 'warning'],
        registered: ['Registration successful. You can now log in.', 'success'],
        'logged-out': ['You have been logged out.', 'success']
    };
    const messageKey = new URLSearchParams(window.location.search).get('error')
        || new URLSearchParams(window.location.search).get('success');
    const pageMessage = messages[messageKey];
    if (pageMessage) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${pageMessage[1]} mb-3`;
        alert.textContent = pageMessage[0];
        document.querySelector('main')?.prepend(alert);
    }

    const bookingForm = document.querySelector('#bookingForm');
    const passengerCount = document.querySelector('#passengerCount');
    const totalFare = document.querySelector('#totalFare');
    const farePerPassenger = document.querySelector('#farePerPassenger');

    function calculateTotalFare() {
        if (!passengerCount || !totalFare || !farePerPassenger) return;
        const count = Math.max(1, Number(passengerCount.value) || 1);
        const fare = Number(farePerPassenger.value) || 0;
        totalFare.textContent = `₹${(count * fare).toFixed(2)}`;
    }

    passengerCount?.addEventListener('input', calculateTotalFare);
    calculateTotalFare();

    bookingForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const confirmation = document.querySelector('#bookingConfirmation');
        if (confirmation) confirmation.classList.remove('d-none');
    });

    document.querySelectorAll('form.needs-validation').forEach((form) => {
        form.addEventListener('submit', (event) => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    const password = document.querySelector('#password');
    const confirmPassword = document.querySelector('#confirmPassword');
    confirmPassword?.addEventListener('input', () => {
        confirmPassword.setCustomValidity(
            password.value === confirmPassword.value ? '' : 'Passwords do not match.'
        );
    });

    document.querySelectorAll('[data-print]').forEach((button) => {
        button.addEventListener('click', () => window.print());
    });

    document.querySelector('#searchForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const message = document.querySelector('#searchMessage');
        if (message) message.classList.remove('d-none');
    });
});
