// Basic frontend-only interactions. No backend or database calls are made here.
document.addEventListener('DOMContentLoaded', () => {
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
