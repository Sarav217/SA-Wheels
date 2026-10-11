// Visual-only helpers: toast popups, confirmation modals, button spinners and
// mobile table labels. Loaded after script.js and never changes what is sent
// to the servlets.
(() => {
    document.addEventListener('DOMContentLoaded', () => {
        markActiveNav();
        labelTableCells();
        mirrorAlertsAsToasts();
        setupBookingPopup();
        setupAuthButtons();
        setupLogoutPopup();
        setupTicketReady();
        showWelcomeToast();
    });

    // Highlight the header link for the current page.
    function markActiveNav() {
        const page = location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.app-header .nav-link').forEach((link) => {
            const active = link.getAttribute('href') === page;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'page');
        });
    }

    // On phones, tables are shown as stacked cards (see .table-stack in
    // style.css). Each cell gets its column name so it can be labelled.
    function labelTableCells() {
        document.querySelectorAll('table').forEach((table) => {
            const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
            if (!headers.length) return;
            table.classList.add('table-stack');
            const label = () => table.querySelectorAll('tbody tr').forEach((row) => {
                [...row.children].forEach((cell, index) => {
                    if (cell.hasAttribute('colspan')) return;
                    if (headers[index]) cell.dataset.label = headers[index];
                });
            });
            label();
            const body = table.querySelector('tbody');
            if (body) new MutationObserver(label).observe(body, { childList: true });
        });
    }

    // ---------- Toast popups ----------
    function getToastStack() {
        let stack = document.querySelector('.toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.className = 'toast-stack no-print';
            stack.setAttribute('aria-live', 'polite');
            document.body.appendChild(stack);
        }
        return stack;
    }

    const toastIcons = {
        success: ['bi-check-lg', 'Success'],
        danger: ['bi-x-lg', 'Something went wrong'],
        warning: ['bi-exclamation-lg', 'Attention'],
        info: ['bi-info-lg', 'Info']
    };

    function showToast(message, type = 'info', duration = 4500) {
        if (!message) return;
        const [icon, title] = toastIcons[type] || toastIcons.info;
        const toast = document.createElement('div');
        toast.className = `ui-toast toast-${type}`;
        toast.setAttribute('role', 'status');
        toast.innerHTML = `<div class="toast-icon"><i class="bi ${icon}"></i></div>
            <div class="toast-body-text"><span class="toast-title"></span><span class="toast-message"></span></div>
            <button type="button" class="toast-close" aria-label="Close"><i class="bi bi-x"></i></button>`;
        toast.querySelector('.toast-title').textContent = title;
        toast.querySelector('.toast-message').textContent = message;
        const close = () => {
            toast.classList.add('leaving');
            setTimeout(() => toast.remove(), 200);
        };
        toast.querySelector('.toast-close').addEventListener('click', close);
        setTimeout(close, duration);
        getToastStack().appendChild(toast);
    }
    window.showToast = showToast;

    function alertType(element) {
        const match = ['success', 'danger', 'warning', 'info'].find((type) => element.classList.contains(`alert-${type}`));
        return match || 'info';
    }

    function mirrorAlertsAsToasts() {
        const main = document.querySelector('main');
        if (!main) return;
        const lastShown = new WeakMap();
        const maybeToast = (element, allowInfo) => {
            if (!element.classList?.contains('alert') || element.classList.contains('d-none')) return;
            const text = element.textContent.trim();
            const type = alertType(element);
            if (!text || (type === 'info' && !allowInfo) || lastShown.get(element) === text) return;
            lastShown.set(element, text);
            showToast(text, type);
        };

        // Messages that script.js already rendered from the URL (errors, success).
        main.querySelectorAll('.alert').forEach((alert) => maybeToast(alert, false));

        new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => node.nodeType === 1 && maybeToast(node, true));
                    if (mutation.target.classList?.contains('alert')) maybeToast(mutation.target, true);
                } else {
                    maybeToast(mutation.target, true);
                }
            });
        }).observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    // ---------- Modal popups ----------
    function createModal({ id, icon, title, bodyHtml, confirmText, confirmClass = 'btn-primary', cancelText = 'Cancel' }) {
        const wrapper = document.createElement('div');
        wrapper.className = 'modal fade';
        wrapper.id = id;
        wrapper.tabIndex = -1;
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.innerHTML = `<div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header modal-header-theme">
                    <h2 class="modal-title h5 mb-0">${title}</h2>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4 text-center">
                    <div class="modal-hero-icon"><i class="bi ${icon}"></i></div>
                    ${bodyHtml}
                </div>
                <div class="modal-footer border-0 pt-0 px-4 pb-4">
                    <button type="button" class="btn btn-outline-primary" data-bs-dismiss="modal">${cancelText}</button>
                    <button type="button" class="btn ${confirmClass} modal-confirm">${confirmText}</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(wrapper);
        return wrapper;
    }

    function setupBookingPopup() {
        const form = document.querySelector('#bookingForm');
        if (!form || !window.bootstrap) return;
        const modalElement = createModal({
            id: 'bookingConfirmModal',
            icon: 'bi-ticket-perforated',
            title: 'Confirm your booking',
            bodyHtml: `<p class="text-muted mb-3">Please review your journey before we reserve your seats.</p>
                <dl class="detail-list text-start" id="bookingSummary"></dl>`,
            confirmText: '<i class="bi bi-check2-circle me-1"></i>Confirm &amp; Pay'
        });
        const modal = new bootstrap.Modal(modalElement);
        let confirmed = false;

        form.addEventListener('submit', (event) => {
            // script.js has already blocked invalid forms; only intercept valid ones.
            if (event.defaultPrevented || confirmed) return;
            event.preventDefault();
            const value = (id) => document.getElementById(id)?.textContent?.trim() || '-';
            const rows = [
                ['Route', value('selectedRouteNumber')],
                ['From', value('selectedSource')],
                ['To', value('selectedDestination')],
                ['Travel date', document.getElementById('travelDate')?.value || '-'],
                ['Passengers', document.getElementById('passengerCount')?.value || '-'],
                ['Payment', document.getElementById('paymentMethod')?.selectedOptions[0]?.textContent || '-'],
                ['Total', value('totalFare')]
            ];
            const summary = modalElement.querySelector('#bookingSummary');
            summary.replaceChildren(...rows.map(([label, text]) => {
                const row = document.createElement('div');
                const dt = document.createElement('dt');
                const dd = document.createElement('dd');
                dt.textContent = label;
                dd.textContent = text;
                row.append(dt, dd);
                return row;
            }));
            modal.show();
        });

        modalElement.querySelector('.modal-confirm').addEventListener('click', (event) => {
            confirmed = true;
            const button = event.currentTarget;
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Booking...';
            // Submit exactly the same form data to the servlet as before.
            form.submit();
        });
    }

    function setupAuthButtons() {
        document.querySelectorAll('form.needs-validation:not(#bookingForm)').forEach((form) => {
            form.addEventListener('submit', (event) => {
                if (event.defaultPrevented) return;
                const button = form.querySelector('button[type="submit"]');
                if (!button) return;
                button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${button.textContent.trim()}...`;
                button.classList.add('disabled');
            });
        });
    }

    function setupLogoutPopup() {
        const links = document.querySelectorAll('a[href="logout"]');
        if (!links.length || !window.bootstrap) return;
        const modalElement = createModal({
            id: 'logoutModal',
            icon: 'bi-box-arrow-right',
            title: 'Leaving so soon?',
            bodyHtml: '<p class="mb-0 text-muted">Are you sure you want to log out of your account?</p>',
            confirmText: '<i class="bi bi-box-arrow-right me-1"></i>Logout',
            cancelText: 'Stay'
        });
        const modal = new bootstrap.Modal(modalElement);
        let target = 'logout';
        links.forEach((link) => link.addEventListener('click', (event) => {
            event.preventDefault();
            target = link.getAttribute('href');
            modal.show();
        }));
        modalElement.querySelector('.modal-confirm').addEventListener('click', () => {
            window.location.href = target;
        });
    }

    function setupTicketReady() {
        const bookingId = document.querySelector('#ticketBookingId');
        if (!bookingId) return;
        const observer = new MutationObserver(() => {
            const text = bookingId.textContent.trim();
            if (!text || text === '-') return;
            observer.disconnect();
            showToast(`Your ticket for booking #${text} is ready. Have a safe journey!`, 'success', 5500);
        });
        observer.observe(bookingId, { childList: true, characterData: true, subtree: true });
    }

    function showWelcomeToast() {
        const message = document.body.dataset.welcome;
        if (!message) return;
        try {
            const key = `welcome:${location.pathname}`;
            if (sessionStorage.getItem(key)) return;
            sessionStorage.setItem(key, '1');
        } catch (error) {
            // Storage can be unavailable; still show the greeting.
        }
        setTimeout(() => showToast(message, 'info', 5000), 600);
    }
})();
