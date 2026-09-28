// Visual-only enhancements: loader, floating background, scroll reveal, ripples,
// toast popups and confirmation modals. Loaded after script.js and never changes
// what is sent to the servlets.
(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('DOMContentLoaded', () => {
        addPageLoader();
        addBrandIcons();
        addFloatingBackground();
        addBackToTop();
        setupRipples();
        setupReveal();
        mirrorAlertsAsToasts();
        animateTableRows();
        setupBookingPopup();
        setupAuthButtons();
        setupLogoutPopup();
        setupFareBump();
        setupTicketCelebration();
        showWelcomeToast();
    });

    function addPageLoader() {
        const loader = document.createElement('div');
        loader.className = 'page-loader no-print';
        loader.innerHTML = '<i class="bi bi-bus-front loader-bus"></i><div class="loader-road"></div><div class="loader-text">Loading your journey</div>';
        document.body.appendChild(loader);
        const hide = () => {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 600);
        };
        if (document.readyState === 'complete') setTimeout(hide, 250);
        else window.addEventListener('load', () => setTimeout(hide, 250));
        // Never keep the page covered if an external resource is slow.
        setTimeout(hide, 2500);
    }

    function addBrandIcons() {
        document.querySelectorAll('.navbar-brand').forEach((brand) => {
            const icon = document.createElement('span');
            icon.className = 'brand-icon';
            icon.innerHTML = '<i class="bi bi-bus-front"></i>';
            brand.prepend(icon);
        });
    }

    function addFloatingBackground() {
        if (reduceMotion) return;
        const layer = document.createElement('div');
        layer.className = 'floating-bg';
        layer.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 14; i += 1) {
            const bubble = document.createElement('span');
            const size = 18 + Math.random() * 70;
            bubble.className = 'bubble';
            Object.assign(bubble.style, {
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${14 + Math.random() * 16}s`,
                animationDelay: `${-Math.random() * 20}s`
            });
            layer.appendChild(bubble);
        }
        const icons = ['bi-bus-front', 'bi-ticket-perforated', 'bi-geo-alt', 'bi-signpost-split', 'bi-clock', 'bi-qr-code'];
        icons.forEach((name, index) => {
            const icon = document.createElement('i');
            icon.className = `bi ${name} float-icon`;
            Object.assign(icon.style, {
                fontSize: `${2.5 + Math.random() * 3}rem`,
                left: `${(index * 17 + 5) % 95}%`,
                top: `${15 + ((index * 29) % 70)}%`,
                animationDuration: `${7 + Math.random() * 6}s`,
                animationDelay: `${-Math.random() * 6}s`
            });
            layer.appendChild(icon);
        });
        document.body.prepend(layer);
    }

    function addBackToTop() {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'back-to-top no-print';
        button.setAttribute('aria-label', 'Back to top');
        button.innerHTML = '<i class="bi bi-arrow-up"></i>';
        button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        document.body.appendChild(button);
        const toggle = () => button.classList.toggle('show', window.scrollY > 300);
        window.addEventListener('scroll', toggle, { passive: true });
        toggle();
    }

    function setupRipples() {
        document.addEventListener('click', (event) => {
            const button = event.target.closest('.btn');
            if (!button || button.disabled) return;
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            Object.assign(ripple.style, {
                width: `${size}px`,
                height: `${size}px`,
                left: `${event.clientX - rect.left - size / 2}px`,
                top: `${event.clientY - rect.top - size / 2}px`
            });
            button.appendChild(ripple);
            setTimeout(() => ripple.remove(), 700);
        });
    }

    function setupReveal() {
        const targets = document.querySelectorAll(
            '.form-card, .dashboard-card, .feature-tile, .ticket-card, .invoice-card, .table-responsive, .list-group, main h1'
        );
        if (!('IntersectionObserver' in window) || reduceMotion) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        targets.forEach((target, index) => {
            target.classList.add('reveal');
            target.style.transitionDelay = `${Math.min(index * 70, 420)}ms`;
            observer.observe(target);
        });
    }

    // ---------- Toast popups ----------
    function getToastStack() {
        let stack = document.querySelector('.toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.className = 'toast-stack';
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
            <button type="button" class="toast-close" aria-label="Close"><i class="bi bi-x"></i></button>
            <div class="toast-progress" style="animation-duration:${duration}ms"></div>`;
        toast.querySelector('.toast-title').textContent = title;
        toast.querySelector('.toast-message').textContent = message;
        const close = () => {
            toast.classList.add('leaving');
            setTimeout(() => toast.remove(), 400);
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

    // Copies each column heading onto its cells so .table-stack tables can
    // show as labelled cards on small screens.
    function labelCells(body) {
        const headings = [...(body.closest('table')?.querySelectorAll('thead th') || [])]
            .map((th) => th.textContent.trim());
        [...body.children].forEach((row) => {
            [...row.children].forEach((cell, index) => {
                if (!cell.hasAttribute('colspan') && headings[index]) cell.dataset.label = headings[index];
            });
        });
    }

    function animateTableRows() {
        document.querySelectorAll('tbody').forEach((body) => {
            labelCells(body);
            new MutationObserver(() => {
                labelCells(body);
                [...body.children].forEach((row, index) => {
                    if (row.dataset.animated) return;
                    row.dataset.animated = '1';
                    row.classList.add('row-in');
                    row.style.animationDelay = `${Math.min(index * 45, 600)}ms`;
                });
            }).observe(body, { childList: true });
        });
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
                <div class="modal-header modal-header-blue">
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
                <dl class="summary-list text-start" id="bookingSummary"></dl>`,
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
                ['Departure', value('selectedDeparture')],
                ['Travel date', document.getElementById('travelDate')?.value || '-'],
                ['Passengers', document.getElementById('passengerCount')?.value || '-'],
                ['Payment', form.querySelector('[name="paymentMethod"]:checked')?.dataset.label || '-'],
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

    function setupFareBump() {
        const total = document.querySelector('#totalFare');
        if (!total) return;
        new MutationObserver(() => {
            total.classList.remove('bump');
            void total.offsetWidth;
            total.classList.add('bump');
        }).observe(total, { childList: true, characterData: true, subtree: true });
    }

    function setupTicketCelebration() {
        const bookingId = document.querySelector('#ticketBookingId');
        if (!bookingId) return;
        const observer = new MutationObserver(() => {
            const text = bookingId.textContent.trim();
            if (!text || text === '-') return;
            observer.disconnect();
            launchConfetti();
            showToast(`Your ticket for booking #${text} is ready. Have a safe journey!`, 'success', 5500);
        });
        observer.observe(bookingId, { childList: true, characterData: true, subtree: true });
    }

    function launchConfetti() {
        if (reduceMotion) return;
        const colors = ['#0d47a1', '#1e88e5', '#42a5f5', '#90caf9', '#00c6ff', '#ffffff'];
        for (let i = 0; i < 70; i += 1) {
            const piece = document.createElement('span');
            piece.className = 'confetti-piece';
            Object.assign(piece.style, {
                left: `${Math.random() * 100}vw`,
                background: colors[i % colors.length],
                animationDuration: `${2.2 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 0.6}s`,
                transform: `rotate(${Math.random() * 360}deg)`
            });
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 5000);
        }
    }

    // Animates a number from 0 to the target; used by the live dashboards.
    function countUp(element, target, format) {
        if (reduceMotion || !target) {
            element.textContent = format(target);
            return;
        }
        const start = performance.now();
        const duration = 1200;
        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = format(progress < 1 ? Math.round(target * eased) : target);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
    window.countUp = countUp;

    // Promise-based replacement for window.confirm that uses the blue modal.
    let confirmModal;
    function confirmPopup(message, confirmText = 'Confirm') {
        if (!window.bootstrap) return Promise.resolve(window.confirm(message));
        if (!confirmModal) {
            const element = createModal({
                id: 'confirmModal',
                icon: 'bi-exclamation-triangle',
                title: 'Please confirm',
                bodyHtml: '<p class="mb-0 text-muted confirm-message"></p>',
                confirmText: 'Confirm',
                confirmClass: 'btn-danger'
            });
            confirmModal = { element, modal: new bootstrap.Modal(element) };
        }
        const { element, modal } = confirmModal;
        element.querySelector('.confirm-message').textContent = message;
        const button = element.querySelector('.modal-confirm');
        button.textContent = confirmText;
        return new Promise((resolve) => {
            let answer = false;
            const onConfirm = () => {
                answer = true;
                modal.hide();
            };
            button.addEventListener('click', onConfirm, { once: true });
            element.addEventListener('hidden.bs.modal', () => {
                button.removeEventListener('click', onConfirm);
                resolve(answer);
            }, { once: true });
            modal.show();
        });
    }
    window.confirmPopup = confirmPopup;

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
        setTimeout(() => showToast(message, 'info', 5000), 900);
    }
})();
