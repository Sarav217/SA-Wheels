// Shared browser-side behavior for the college project frontend.
// Route, booking, and admin actions call the Java Servlets only when deployed on Tomcat.
document.addEventListener('DOMContentLoaded', () => {
    showUrlMessage();
    setupSessionInfo();
    setupBookingPage();
    setupValidation();
    setupPrintButtons();
    setupHomeSearch();
    setupRouteSearchPage();
    setupRouteManagementPage();
    setupTicketPage();
    setupInvoicePage();
    setupTravelHistoryPage();
    setupUserDashboard();
    setupAdminDashboard();
});

function showUrlMessage() {
    const messages = {
        'missing-fields': ['Please complete all required fields.', 'danger'],
        'invalid-email': ['Please enter a valid email address.', 'danger'],
        'invalid-phone': ['Please enter a valid 10-digit phone number.', 'danger'],
        'invalid-password': ['Password must contain at least 6 characters.', 'danger'],
        'password-mismatch': ['Passwords do not match.', 'danger'],
        'email-exists': ['That email address is already registered.', 'danger'],
        'invalid-credentials': ['Invalid email or password.', 'danger'],
        'database-error': ['The request could not be completed. Please check the server and try again.', 'danger'],
        'login-required': ['Please log in to access that page.', 'warning'],
        'login-to-book': ['Please log in to book your ticket.', 'warning'],
        'route-unavailable': ['The selected route is unavailable. Please choose another route.', 'danger'],
        'invalid-booking': ['Please check the travel date (today or later), payment method, and passenger count (1 to 6).', 'danger'],
        'booking-failed': ['The booking could not be completed. Please try again.', 'danger'],
        registered: ['Registration successful. Please log in with your new account.', 'success'],
        'logged-out': ['You have been logged out.', 'success']
    };
    const params = new URLSearchParams(window.location.search);
    const message = messages[params.get('error') || params.get('success')];
    if (message) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${message[1]} mb-3`;
        alert.textContent = message[0];
        const holder = document.querySelector('#pageMessages') || document.querySelector('main');
        holder?.prepend(alert);
    }
}

// Shows the logged-in name and the correct navigation links on every page.
function setupSessionInfo() {
    fetch('session-info')
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('No session info.')))
        .then((session) => {
            window.currentSession = session;
            document.querySelectorAll('[data-user-name]').forEach((element) => {
                if (session.userName) element.textContent = session.userName;
            });
            document.querySelectorAll('[data-admin-name]').forEach((element) => {
                if (session.adminName) element.textContent = session.adminName;
            });
            const passengerName = document.querySelector('#passengerName');
            if (passengerName && session.userName) passengerName.value = session.userName;

            document.querySelectorAll('[data-logged-in-only]').forEach((element) => {
                element.classList.toggle('d-none', !session.loggedIn);
            });
            document.querySelectorAll('[data-guest-only]').forEach((element) => {
                element.classList.toggle('d-none', session.loggedIn);
            });
            document.querySelectorAll('[data-user-only]').forEach((element) => {
                element.classList.toggle('d-none', !session.user);
            });
            document.querySelectorAll('[data-admin-only]').forEach((element) => {
                element.classList.toggle('d-none', !session.admin);
            });
        })
        .catch(() => {
            // Static preview without Tomcat: keep the default guest links.
        });
}

function setupBookingPage() {
    const bookingForm = document.querySelector('#bookingForm');
    const passengerCount = document.querySelector('#passengerCount');
    const totalFare = document.querySelector('#totalFare');
    const farePerPassenger = document.querySelector('#farePerPassenger');
    if (!bookingForm || !passengerCount || !totalFare || !farePerPassenger) return;

    // Use the browser's local date. toISOString() uses UTC and can show
    // yesterday for users in time zones ahead of UTC, such as India.
    const params = new URLSearchParams(window.location.search);
    const localToday = getLocalDateString();
    const travelDate = document.querySelector('#travelDate');
    travelDate.min = localToday;
    travelDate.value = params.get('travelDate') && params.get('travelDate') >= localToday
        ? params.get('travelDate')
        : localToday;

    const calculateTotalFare = () => {
        const count = Number(passengerCount.value);
        const fare = Number(farePerPassenger.value);
        const validCount = Number.isInteger(count) && count >= 1 && count <= 6;
        setText('fareCount', validCount ? count : '-');
        if (!validCount || Number.isNaN(fare)) {
            totalFare.textContent = 'Invalid passenger count';
            return false;
        }
        totalFare.textContent = formatMoney(count * fare);
        return true;
    };

    passengerCount.addEventListener('input', calculateTotalFare);
    document.querySelectorAll('[data-count-step]').forEach((button) => {
        button.addEventListener('click', () => {
            const next = Number(passengerCount.value || 1) + Number(button.dataset.countStep);
            passengerCount.value = Math.min(6, Math.max(1, next));
            calculateTotalFare();
        });
    });
    calculateTotalFare();

    // A booking always needs a route chosen from the search page.
    const routeId = params.get('routeId');
    if (!routeId) {
        document.querySelector('#noRouteMessage')?.classList.remove('d-none');
        document.querySelector('#bookingContent')?.classList.add('d-none');
        return;
    }
    document.querySelector('#selectedRouteId').value = routeId;
    loadSelectedRoute(routeId, farePerPassenger, calculateTotalFare);
}

async function loadSelectedRoute(routeId, fareElement, recalculate) {
    try {
        const response = await fetch(`route-search?routeId=${encodeURIComponent(routeId)}`);
        const routes = await response.json();
        if (!response.ok || routes.length === 0) {
            document.querySelector('#noRouteMessage')?.classList.remove('d-none');
            document.querySelector('#bookingContent')?.classList.add('d-none');
            return;
        }
        const route = routes[0];
        setText('selectedRouteNumber', route.routeNumber);
        setText('selectedSource', route.source);
        setText('selectedDestination', route.destination);
        setText('selectedDeparture', route.departure);
        setText('selectedArrival', route.arrival);
        setText('selectedDuration', formatDuration(route.travelTimeMinutes));
        setText('fareDisplay', Number(route.fare).toFixed(2));
        fareElement.value = route.fare;
        recalculate();
    } catch (error) {
        // The page can still display its sample route when no Tomcat server is running.
        console.warn('Selected route could not be loaded.', error);
    }
}

function setupValidation() {
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
    const checkPasswords = () => {
        confirmPassword.setCustomValidity(
            password.value === confirmPassword.value ? '' : 'Passwords do not match.'
        );
    };
    confirmPassword?.addEventListener('input', checkPasswords);
    if (confirmPassword) password?.addEventListener('input', checkPasswords);

    // Show or hide password text.
    document.querySelectorAll('[data-toggle-password]').forEach((button) => {
        button.addEventListener('click', () => {
            const input = document.getElementById(button.dataset.togglePassword);
            if (!input) return;
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            button.innerHTML = `<i class="bi ${show ? 'bi-eye-slash' : 'bi-eye'}"></i>`;
        });
    });
}

function setupPrintButtons() {
    document.querySelectorAll('[data-print]').forEach((button) => {
        button.addEventListener('click', () => window.print());
    });
}

// The landing page searches the public route list (including imported MTC
// bus numbers such as 52H). Booking still requires a passenger login.
function setupHomeSearch() {
    const form = document.querySelector('#searchForm');
    const results = document.querySelector('#homeRouteResults');
    if (!form || !results) return;

    const dateInput = document.querySelector('#travelDate');
    const localToday = getLocalDateString();
    dateInput.min = localToday;
    if (!dateInput.value) dateInput.value = localToday;
    setupSwapButton('#homeSwap', '#source', '#destination');

    const sourceSelect = document.querySelector('#source');
    const destinationSelect = document.querySelector('#destination');
    const busNumberInput = document.querySelector('#busNumber');
    let allRoutes = [];

    fetch('public-route-search')
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('Routes unavailable.')))
        .then((routes) => {
            allRoutes = routes;
            addSelectOptions(sourceSelect, [...new Set(routes.map((route) => route.source))].sort(), 'Choose source');
            addSelectOptions(destinationSelect, [...new Set(routes.map((route) => route.destination))].sort(), 'Choose destination');
            const busList = document.querySelector('#busNumberList');
            if (busList) {
                busList.replaceChildren();
                [...new Set(routes.map((route) => route.routeNumber))].sort().forEach((number) => {
                    const option = document.createElement('option');
                    option.value = number;
                    busList.appendChild(option);
                });
            }
        })
        .catch(() => {
            showHomeSearchMessage('Routes could not be loaded. Deploy the application on Tomcat and check the Oracle connection.', true);
        });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const source = sourceSelect.value;
        const destination = destinationSelect.value;
        const busNumber = busNumberInput.value.trim().toLowerCase();

        if (!busNumber && (!source || !destination)) {
            showHomeSearchMessage('Choose both From and To, or enter a bus number such as 52H.', true);
            return;
        }
        if (source && destination && source === destination) {
            showHomeSearchMessage('From and To must be different.', true);
            return;
        }
        if (!dateInput.value || dateInput.value < localToday) {
            showHomeSearchMessage('Choose today or a later travel date.', true);
            return;
        }

        const matches = allRoutes.filter((route) => {
            const numberMatches = !busNumber || String(route.routeNumber).toLowerCase() === busNumber;
            const sourceMatches = !source || route.source === source;
            const destinationMatches = !destination || route.destination === destination;
            return numberMatches && sourceMatches && destinationMatches;
        });

        renderHomeResults(results, matches, dateInput.value);
        const title = busNumber
            ? `Bus ${busNumberInput.value.trim().toUpperCase()}${source && destination ? ` · ${source} to ${destination}` : ''}`
            : `${source} to ${destination}`;
        setText('homeResultTitle', title);
        setText('homeResultCount', `${matches.length} bus${matches.length === 1 ? '' : 'es'}`);
        document.querySelector('#homeResultsSection')?.classList.remove('d-none');
        showHomeSearchMessage(matches.length === 0 ? 'No buses found for this search. Try another bus number or places.' : '');
        document.querySelector('#homeResultsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

function renderHomeResults(container, routes, travelDate) {
    container.replaceChildren();
    if (routes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" class="text-center text-muted">No buses found.</td>';
        container.appendChild(row);
        return;
    }
    routes.forEach((route) => {
        const row = document.createElement('tr');
        addNodeCell(row, routeBadge(route.routeNumber));
        addCell(row, route.source);
        addCell(row, route.destination);
        addCell(row, route.departure);
        addCell(row, route.arrival);
        addCell(row, formatDuration(route.travelTimeMinutes));
        addCell(row, formatMoney(route.fare));
        const actionCell = document.createElement('td');
        const link = document.createElement('a');
        link.className = 'btn btn-sm btn-primary';
        link.innerHTML = '<i class="bi bi-ticket-perforated me-1"></i>Book Ticket';
        link.href = 'login.html?error=login-to-book';
        // Logged-in passengers go straight to booking; everyone else logs in first.
        link.addEventListener('click', (event) => {
            if (window.currentSession && window.currentSession.user) {
                event.preventDefault();
                window.location.href = `booking.html?routeId=${encodeURIComponent(route.routeId)}&travelDate=${encodeURIComponent(travelDate)}`;
            }
        });
        actionCell.appendChild(link);
        row.appendChild(actionCell);
        container.appendChild(row);
    });
}

function showHomeSearchMessage(message, isError = false) {
    const element = document.querySelector('#homeSearchMessage');
    if (!element) return;
    element.textContent = message;
    element.className = `alert mt-3 mb-0 ${isError ? 'alert-danger' : 'alert-info'}${message ? '' : ' d-none'}`;
}

function setupSwapButton(buttonSelector, firstSelector, secondSelector) {
    document.querySelector(buttonSelector)?.addEventListener('click', () => {
        const first = document.querySelector(firstSelector);
        const second = document.querySelector(secondSelector);
        if (!first || !second) return;
        const firstValue = first.value;
        first.value = second.value;
        second.value = firstValue;
    });
}

function setupRouteSearchPage() {
    const form = document.querySelector('#routeSearchForm');
    const results = document.querySelector('#routeResults');
    if (!form || !results) return;

    const params = new URLSearchParams(window.location.search);
    const dateInput = document.querySelector('#searchDate');
    const localToday = getLocalDateString();
    if (dateInput) {
        dateInput.min = localToday;
        const requestedDate = params.get('date');
        dateInput.value = requestedDate && requestedDate >= localToday ? requestedDate : localToday;
    }

    const sourceSelect = document.querySelector('#searchSource');
    const destinationSelect = document.querySelector('#searchDestination');
    setupSwapButton('#swapLocations', '#searchSource', '#searchDestination');

    // Load the filter options from Oracle instead of keeping only sample values
    // in the HTML page. This makes imported MTC routes searchable in the UI.
    const populateRouteFilters = async () => {
        try {
            const response = await fetch('route-search');
            const routes = await response.json();
            if (!response.ok) throw new Error(routes.error || 'Route loading failed.');

            const sources = [...new Set(routes.map((route) => route.source))].sort();
            const destinations = [...new Set(routes.map((route) => route.destination))].sort();
            addSelectOptions(sourceSelect, sources, 'Choose source');
            addSelectOptions(destinationSelect, destinations, 'Choose destination');

            // Values sent from the home page search form.
            const source = selectMatchingOption(sourceSelect, params.get('source'));
            const destination = selectMatchingOption(destinationSelect, params.get('destination'));
            if (source && destination) {
                loadRoutes(source, destination);
            } else if (params.get('source') || params.get('destination')) {
                showSearchMessage('No exact match for the entered places. Choose them from the lists below.');
            }
        } catch (error) {
            showSearchMessage('Route options could not be loaded. Check Tomcat and Oracle.', true);
        }
    };

    const loadRoutes = async (source = '', destination = '') => {
        const query = new URLSearchParams({ source, destination });
        try {
            const response = await fetch(`route-search?${query}`);
            const routes = await response.json();
            if (!response.ok) throw new Error(routes.error || 'Route search failed.');
            renderRouteResults(results, routes);
            setText('resultCount', `${routes.length} route${routes.length === 1 ? '' : 's'}`);
            setText('resultTitle', source ? `${source} to ${destination}` : 'All available routes');
            showSearchMessage(routes.length === 0 ? 'No routes are available for this journey.' : '');
        } catch (error) {
            showSearchMessage('Route search is unavailable. Deploy the application on Tomcat and check the Oracle connection.', true);
        }
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        if (sourceSelect.value === destinationSelect.value) {
            showSearchMessage('Source and destination must be different.', true);
            return;
        }
        loadRoutes(sourceSelect.value, destinationSelect.value);
    });

    document.querySelector('#showAllRoutes')?.addEventListener('click', () => loadRoutes());

    populateRouteFilters();
}

function selectMatchingOption(select, value) {
    if (!select || !value) return '';
    const match = [...select.options].find(
        (option) => option.value && option.value.toLowerCase() === value.trim().toLowerCase()
    );
    if (match) select.value = match.value;
    return match ? match.value : '';
}

function addSelectOptions(select, values, placeholder) {
    if (!select) return;
    select.replaceChildren();
    const firstOption = document.createElement('option');
    firstOption.value = '';
    firstOption.textContent = placeholder;
    select.appendChild(firstOption);
    values.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

function getLocalDateString() {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localNow.toISOString().slice(0, 10);
}

function renderRouteResults(container, routes) {
    container.replaceChildren();
    if (routes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" class="text-center text-muted">No routes found.</td>';
        container.appendChild(row);
        return;
    }

    routes.forEach((route) => {
        const row = document.createElement('tr');
        addNodeCell(row, routeBadge(route.routeNumber));
        addCell(row, route.source);
        addCell(row, route.destination);
        addCell(row, route.departure);
        addCell(row, route.arrival);
        addCell(row, formatDuration(route.travelTimeMinutes));
        addCell(row, formatMoney(route.fare));
        const actionCell = document.createElement('td');
        const link = document.createElement('a');
        link.className = 'btn btn-sm btn-primary';
        const travelDate = document.querySelector('#searchDate')?.value || '';
        link.href = `booking.html?routeId=${encodeURIComponent(route.routeId)}&travelDate=${encodeURIComponent(travelDate)}`;
        link.innerHTML = '<i class="bi bi-ticket-perforated me-1"></i>Book Now';
        actionCell.appendChild(link);
        row.appendChild(actionCell);
        container.appendChild(row);
    });
}

function setupRouteManagementPage() {
    const form = document.querySelector('#routeManagementForm');
    const results = document.querySelector('#routeManagementResults');
    if (!form || !results) return;

    let routes = [];
    const loadRoutes = async () => {
        try {
            const response = await fetch('route-management');
            routes = await response.json();
            if (!response.ok) throw new Error(routes.error || 'Route loading failed.');
            renderManagementResults(results, filterRoutes(routes), beginEdit, deleteRoute);
            setText('routeTotal', `${routes.length} route${routes.length === 1 ? '' : 's'}`);
        } catch (error) {
            showManagementMessage('Routes could not be loaded. Check Tomcat, the admin session, and Oracle.', true);
        }
    };

    // Simple client-side filter for the route table.
    const filterInput = document.querySelector('#routeFilter');
    const filterRoutes = (list) => {
        const text = (filterInput?.value || '').trim().toLowerCase();
        if (!text) return list;
        return list.filter((route) => [route.routeNumber, route.source, route.destination, route.status]
            .some((value) => String(value || '').toLowerCase().includes(text)));
    };
    filterInput?.addEventListener('input', () => {
        renderManagementResults(results, filterRoutes(routes), beginEdit, deleteRoute);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        const routeId = document.querySelector('#routeDbId').value;
        const data = new URLSearchParams({
            action: routeId ? 'update' : 'add',
            routeId,
            routeNumber: document.querySelector('#routeNumber').value,
            source: document.querySelector('#routeSource').value,
            destination: document.querySelector('#routeDestination').value,
            departure: document.querySelector('#departure').value,
            arrival: document.querySelector('#arrival').value,
            fare: document.querySelector('#fare').value,
            status: document.querySelector('#routeStatus')?.value || 'ACTIVE'
        });
        await submitManagementRequest(data, loadRoutes);
    });

    document.querySelector('#routeCancelButton')?.addEventListener('click', clearRouteForm);
    loadRoutes();

    function beginEdit(route) {
        document.querySelector('#routeDbId').value = route.routeId;
        document.querySelector('#routeNumber').value = route.routeNumber;
        document.querySelector('#routeSource').value = route.source;
        document.querySelector('#routeDestination').value = route.destination;
        document.querySelector('#departure').value = route.departure;
        document.querySelector('#arrival').value = route.arrival;
        document.querySelector('#fare').value = route.fare;
        const status = document.querySelector('#routeStatus');
        if (status) status.value = route.status || 'ACTIVE';
        setText('routeFormTitle', `Edit route ${route.routeNumber}`);
        document.querySelector('#routeSubmitButton').textContent = 'Update Route';
        document.querySelector('#routeCancelButton').classList.remove('d-none');
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function deleteRoute(route) {
        const message = `Delete route ${route.routeNumber} (${route.source} to ${route.destination})? ` +
            'Routes with bookings cannot be deleted; mark them INACTIVE instead.';
        const confirmed = window.confirmPopup
            ? await window.confirmPopup(message, 'Delete route')
            : window.confirm(message);
        if (!confirmed) return;
        await submitManagementRequest(new URLSearchParams({ action: 'delete', routeId: route.routeId }), loadRoutes);
    }

    function clearRouteForm() {
        form.reset();
        form.classList.remove('was-validated');
        document.querySelector('#routeDbId').value = '';
        setText('routeFormTitle', 'Add a new route');
        document.querySelector('#routeSubmitButton').textContent = 'Add Route';
        document.querySelector('#routeCancelButton').classList.add('d-none');
    }
}

function setupTicketPage() {
    if (!document.querySelector('#ticketBookingId')) return;
    const bookingId = new URLSearchParams(window.location.search).get('bookingId');
    if (!bookingId) {
        showTicketError('No ticket selected. Open a ticket from your travel history.');
        return;
    }

    fetch(`ticket?bookingId=${encodeURIComponent(bookingId)}`)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('Ticket unavailable.')))
        .then((ticket) => {
            setText('ticketPassenger', ticket.passengerName || 'Logged-in user');
            setText('ticketBookingId', ticket.bookingId);
            setText('ticketRoute', ticket.routeNumber);
            setText('ticketSource', ticket.source);
            setText('ticketDestination', ticket.destination);
            setText('ticketTravelDate', formatDay(ticket.travelDate));
            setText('ticketDeparture', ticket.departure || '-');
            setText('ticketArrival', ticket.arrival || '-');
            setText('ticketPassengerCount', ticket.passengerCount);
            setText('ticketFare', formatMoney(ticket.totalFare));
            setText('ticketNumber', ticket.ticketNumber);
            setStatusBadge('ticketStatus', ticket.status);
            const image = document.querySelector('#qrImage');
            const placeholder = document.querySelector('#qrPlaceholder');
            image.src = `ticket-qr?bookingId=${encodeURIComponent(bookingId)}`;
            image.classList.remove('d-none');
            placeholder?.classList.add('d-none');
            const invoiceLink = document.querySelector('#invoiceLink');
            if (invoiceLink) invoiceLink.href = `invoice.html?bookingId=${encodeURIComponent(bookingId)}`;
        })
        .catch(() => showTicketError('Ticket details could not be loaded.'));
}

function setupInvoicePage() {
    if (!document.querySelector('#invoiceBookingId')) return;
    const bookingId = new URLSearchParams(window.location.search).get('bookingId');
    if (!bookingId) {
        showTicketError('No invoice selected. Open an invoice from your travel history.');
        return;
    }
    const ticketLink = document.querySelector('#backToTicket');
    if (ticketLink) ticketLink.href = `ticket.html?bookingId=${encodeURIComponent(bookingId)}`;

    fetch(`invoice?bookingId=${encodeURIComponent(bookingId)}`)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('Invoice unavailable.')))
        .then((invoice) => {
            setText('invoiceNumber', invoice.invoiceNumber);
            setText('invoiceDate', formatDay(invoice.invoiceDate));
            setText('invoiceBookingId', invoice.bookingId);
            setText('invoicePassenger', invoice.passengerName);
            setText('invoiceRoute', invoice.route);
            setText('invoiceJourney', invoice.source ? `${invoice.source} to ${invoice.destination}` : '-');
            setText('invoiceTravelDate', formatDay(invoice.travelDate));
            setText('invoicePassengerCount', invoice.passengerCount);
            setText('invoiceAmount', formatMoney(invoice.amount));
            setText('invoiceTotal', formatMoney(invoice.amount));
            setText('invoicePaymentMethod', invoice.paymentMethod);
            setStatusBadge('invoicePaymentStatus', invoice.paymentStatus);
        })
        .catch(() => showTicketError('Invoice details could not be loaded.'));
}

function setupTravelHistoryPage() {
    const results = document.querySelector('#historyResults');
    if (!results) return;

    fetch('travel-history')
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('History unavailable.')))
        .then((history) => {
            results.replaceChildren();
            document.querySelector('#historyMessage')?.classList.add('d-none');
            showTripTotals(history);
            if (history.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="7" class="text-center text-muted">No bookings yet. <a href="route-search.html">Book your first trip</a>.</td>';
                results.appendChild(row);
                return;
            }
            history.forEach((item) => {
                const row = document.createElement('tr');
                addCell(row, `#${item.bookingId}`);
                addNodeCell(row, journeyText(item));
                addCell(row, `${formatDay(item.travelDate)}${item.departure ? `, ${item.departure}` : ''}`);
                addCell(row, item.passengerCount);
                addCell(row, formatMoney(item.totalFare));
                addNodeCell(row, statusBadge(item.status));
                const cell = document.createElement('td');
                cell.className = 'text-nowrap';
                const ticketLink = document.createElement('a');
                ticketLink.className = 'btn btn-sm btn-primary me-1';
                ticketLink.href = `ticket.html?bookingId=${encodeURIComponent(item.bookingId)}`;
                ticketLink.innerHTML = '<i class="bi bi-qr-code me-1"></i>Ticket';
                const invoiceLink = document.createElement('a');
                invoiceLink.className = 'btn btn-sm btn-outline-primary';
                invoiceLink.href = `invoice.html?bookingId=${encodeURIComponent(item.bookingId)}`;
                invoiceLink.innerHTML = '<i class="bi bi-receipt me-1"></i>Invoice';
                cell.append(ticketLink, invoiceLink);
                row.appendChild(cell);
                results.appendChild(row);
            });
        })
        .catch(() => {
            const message = document.querySelector('#historyMessage');
            if (message) {
                message.className = 'alert alert-danger';
                message.textContent = 'Travel history could not be loaded. Check your session and Oracle connection.';
            }
        });
}

// Totals used by both the travel history page and the user dashboard.
function showTripTotals(history) {
    const today = getLocalDateString();
    const upcoming = history.filter((item) => String(item.travelDate).slice(0, 10) >= today
        && item.status !== 'CANCELLED');
    const spent = history.reduce((total, item) => total + Number(item.totalFare || 0), 0);
    setStat('statTrips', history.length);
    setStat('statUpcoming', upcoming.length);
    setStat('statSpent', spent, true);
    return upcoming;
}

function setupUserDashboard() {
    const list = document.querySelector('#dashboardRecentTrips');
    if (!list) return;

    fetch('travel-history')
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('History unavailable.')))
        .then((history) => {
            const upcoming = showTripTotals(history);
            list.replaceChildren();
            if (history.length === 0) {
                list.innerHTML = '<li class="trip-empty">No trips yet. <a href="route-search.html">Search a route</a> to book your first ticket.</li>';
            }
            history.slice(0, 4).forEach((item) => list.appendChild(tripListItem(item)));

            // Upcoming trips are sorted by travel date so the nearest one is shown.
            const nextTrip = upcoming.sort((a, b) => String(a.travelDate).localeCompare(String(b.travelDate)))[0];
            const nextTripBox = document.querySelector('#nextTrip');
            if (nextTripBox && nextTrip) {
                nextTripBox.replaceChildren();
                const route = document.createElement('p');
                route.className = 'next-trip-route mb-1';
                route.textContent = `${nextTrip.source} → ${nextTrip.destination}`;
                const when = document.createElement('p');
                when.className = 'text-muted mb-3';
                when.textContent = `${formatDay(nextTrip.travelDate)}${nextTrip.departure ? ` at ${nextTrip.departure}` : ''} · ${nextTrip.passengerCount} passenger(s)`;
                const link = document.createElement('a');
                link.className = 'btn btn-light btn-sm';
                link.href = `ticket.html?bookingId=${encodeURIComponent(nextTrip.bookingId)}`;
                link.innerHTML = '<i class="bi bi-qr-code me-1"></i>Show ticket';
                nextTripBox.append(route, when, link);
            }
        })
        .catch(() => {
            list.innerHTML = '<li class="trip-empty">Your trips could not be loaded. Check the server connection.</li>';
        });
}

function tripListItem(item) {
    const listItem = document.createElement('li');
    listItem.className = 'trip-item';
    const icon = document.createElement('span');
    icon.className = 'trip-icon';
    icon.innerHTML = '<i class="bi bi-bus-front"></i>';
    const details = document.createElement('div');
    details.className = 'flex-grow-1 min-w-0';
    const title = document.createElement('div');
    title.className = 'fw-semibold text-truncate';
    title.textContent = `${item.source} → ${item.destination}`;
    const meta = document.createElement('div');
    meta.className = 'small text-muted';
    meta.textContent = `${formatDay(item.travelDate)} · ${item.passengerCount} passenger(s) · ${formatMoney(item.totalFare)}`;
    details.append(title, meta);
    const link = document.createElement('a');
    link.className = 'btn btn-sm btn-outline-primary';
    link.href = `ticket.html?bookingId=${encodeURIComponent(item.bookingId)}`;
    link.textContent = 'Ticket';
    listItem.append(icon, details, link);
    return listItem;
}

function setupAdminDashboard() {
    const bookingResults = document.querySelector('#adminRecentBookings');
    const userResults = document.querySelector('#adminUsers');
    if (!bookingResults || !userResults) return;

    let users = [];
    const renderUsers = () => {
        const text = (document.querySelector('#userFilter')?.value || '').trim().toLowerCase();
        const list = users.filter((user) => !text || [user.fullName, user.email, user.phoneNumber]
            .some((value) => String(value || '').toLowerCase().includes(text)));
        userResults.replaceChildren();
        list.forEach((user) => {
            const row = document.createElement('tr');
            addCell(row, user.fullName);
            addCell(row, user.email);
            addCell(row, user.phoneNumber || '-');
            addCell(row, formatDay(user.createdAt));
            addNodeCell(row, statusBadge(user.status));
            userResults.appendChild(row);
        });
        if (list.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" class="text-center text-muted">No passengers found.</td>';
            userResults.appendChild(row);
        }
    };
    document.querySelector('#userFilter')?.addEventListener('input', renderUsers);

    fetch('admin-summary')
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('Summary unavailable.')))
        .then((data) => {
            setStat('statRoutes', data.summary.totalRoutes);
            setText('statActiveRoutes', `${data.summary.activeRoutes} active`);
            setStat('statBookings', data.summary.totalBookings);
            setStat('statUsers', data.summary.totalUsers);
            setStat('statRevenue', data.summary.revenue, true);

            bookingResults.replaceChildren();
            data.recentBookings.forEach((item) => {
                const row = document.createElement('tr');
                addCell(row, `#${item.bookingId}`);
                addCell(row, item.passengerName);
                addNodeCell(row, journeyText(item));
                addCell(row, formatDay(item.travelDate));
                addCell(row, item.passengerCount);
                addCell(row, formatMoney(item.totalFare));
                addNodeCell(row, statusBadge(item.status));
                bookingResults.appendChild(row);
            });
            if (data.recentBookings.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="7" class="text-center text-muted">No bookings yet.</td>';
                bookingResults.appendChild(row);
            }

            users = data.users;
            setText('userTotal', `${users.length} passenger${users.length === 1 ? '' : 's'}`);
            renderUsers();
        })
        .catch(() => {
            const message = document.querySelector('#adminMessage');
            if (message) {
                message.className = 'alert alert-danger';
                message.textContent = 'Dashboard data could not be loaded. Check Tomcat, the admin session, and Oracle.';
            }
        });
}

function formatDate(value) {
    return value ? String(value).replace('T', ' ').slice(0, 16) : '-';
}

// Shows a date such as 2026-09-28 00:00:00.0 as 28 Sep 2026.
function formatDay(value) {
    if (!value || value === 'null') return '-';
    const parts = String(value).slice(0, 10).split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return formatDate(value);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMoney(value) {
    return `₹${Number(value || 0).toFixed(2)}`;
}

function formatDuration(minutes) {
    const total = Number(minutes);
    if (!total || total < 0) return '-';
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return hours ? `${hours}h ${String(mins).padStart(2, '0')}m` : `${mins} min`;
}

function statusBadge(status) {
    const badge = document.createElement('span');
    const value = String(status || '-').toUpperCase();
    const colors = {
        CONFIRMED: 'success', VALID: 'success', PAID: 'success', ACTIVE: 'success',
        PENDING: 'warning', USED: 'secondary', INACTIVE: 'secondary',
        CANCELLED: 'danger', REFUNDED: 'info'
    };
    badge.className = `badge text-bg-${colors[value] || 'primary'}`;
    badge.textContent = value;
    return badge;
}

function setStatusBadge(id, status) {
    const element = document.querySelector(`#${id}`);
    if (!element) return;
    const badge = statusBadge(status);
    element.className = `${badge.className} ${element.dataset.extraClass || ''}`.trim();
    element.textContent = badge.textContent;
}

function routeBadge(routeNumber) {
    const badge = document.createElement('span');
    badge.className = 'route-badge';
    badge.textContent = routeNumber || '-';
    return badge;
}

function journeyText(item) {
    const wrapper = document.createElement('span');
    const route = document.createElement('span');
    route.className = 'route-badge me-2';
    route.textContent = item.routeNumber || '-';
    const text = document.createElement('span');
    text.textContent = `${item.source} → ${item.destination}`;
    wrapper.append(route, text);
    return wrapper;
}

// Uses the count-up animation from ui-effects.js when it is available.
function setStat(id, value, isMoney = false) {
    const element = document.querySelector(`#${id}`);
    if (!element) return;
    const format = (number) => isMoney
        ? `₹${Number(number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : Number(number).toLocaleString('en-IN');
    if (window.countUp) {
        window.countUp(element, Number(value || 0), format);
    } else {
        element.textContent = format(value || 0);
    }
}

function showTicketError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.textContent = message;
    const holder = document.querySelector('#pageMessages') || document.querySelector('main');
    holder?.prepend(alert);
}

function renderManagementResults(container, routes, editCallback, deleteCallback) {
    container.replaceChildren();
    routes.forEach((route) => {
        const row = document.createElement('tr');
        addCell(row, route.routeId);
        addNodeCell(row, routeBadge(route.routeNumber));
        addCell(row, route.source);
        addCell(row, route.destination);
        addCell(row, route.departure);
        addCell(row, route.arrival);
        addCell(row, formatMoney(route.fare));
        addNodeCell(row, statusBadge(route.status));
        const actionCell = document.createElement('td');
        actionCell.className = 'text-nowrap';
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-sm btn-outline-primary me-1';
        editButton.type = 'button';
        editButton.innerHTML = '<i class="bi bi-pencil me-1"></i>Edit';
        editButton.addEventListener('click', () => editCallback(route));
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-outline-danger';
        deleteButton.type = 'button';
        deleteButton.innerHTML = '<i class="bi bi-trash me-1"></i>Delete';
        deleteButton.addEventListener('click', () => deleteCallback(route));
        actionCell.append(editButton, deleteButton);
        row.appendChild(actionCell);
        container.appendChild(row);
    });
    if (routes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="9" class="text-center text-muted">No routes found.</td>';
        container.appendChild(row);
    }
}

async function submitManagementRequest(data, reload) {
    try {
        const response = await fetch('route-management', { method: 'POST', body: data });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Route operation failed.');
        showManagementMessage(result.message, false);
        const form = document.querySelector('#routeManagementForm');
        form?.reset();
        form?.classList.remove('was-validated');
        document.querySelector('#routeDbId').value = '';
        setText('routeFormTitle', 'Add a new route');
        document.querySelector('#routeSubmitButton').textContent = 'Add Route';
        document.querySelector('#routeCancelButton').classList.add('d-none');
        await reload();
    } catch (error) {
        showManagementMessage(error.message, true);
    }
}

function showSearchMessage(message, isError = false) {
    const element = document.querySelector('#searchMessage');
    if (!element) return;
    element.textContent = message;
    element.className = `alert mt-3 mb-0 ${isError ? 'alert-danger' : 'alert-info'}${message ? '' : ' d-none'}`;
}

function showManagementMessage(message, isError) {
    const element = document.querySelector('#routeManagementMessage');
    if (!element) return;
    element.textContent = message;
    element.className = `alert alert-${isError ? 'danger' : 'success'}`;
}

function addCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = value ?? '';
    row.appendChild(cell);
}

function addNodeCell(row, node) {
    const cell = document.createElement('td');
    cell.appendChild(node);
    row.appendChild(cell);
}

function setText(id, value) {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = value ?? '';
}
