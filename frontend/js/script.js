// Shared browser-side behavior for the college project frontend.
// Route and admin actions call the Java Servlets only when deployed on Tomcat.
document.addEventListener('DOMContentLoaded', () => {
    showUrlMessage();
    setupBookingPage();
    setupValidation();
    setupPrintButtons();
    setupHomeSearchMessage();
    setupRouteSearchPage();
    setupRouteManagementPage();
    setupTicketPage();
    setupInvoicePage();
    setupTravelHistoryPage();
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
        'route-unavailable': ['The selected route is unavailable.', 'danger'],
        'invalid-booking': ['Please check the route, date, payment method, and passenger count.', 'danger'],
        'booking-failed': ['The booking could not be completed. Please try again.', 'danger'],
        registered: ['Registration successful. You can now log in.', 'success'],
        'logged-out': ['You have been logged out.', 'success']
    };
    const params = new URLSearchParams(window.location.search);
    const message = messages[params.get('error') || params.get('success')];
    if (message) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${message[1]} mb-3`;
        alert.textContent = message[0];
        document.querySelector('main')?.prepend(alert);
    }
}

function setupBookingPage() {
    const bookingForm = document.querySelector('#bookingForm');
    const passengerCount = document.querySelector('#passengerCount');
    const totalFare = document.querySelector('#totalFare');
    const farePerPassenger = document.querySelector('#farePerPassenger');
    if (!passengerCount || !totalFare || !farePerPassenger) return;

    const calculateTotalFare = () => {
        const count = Number(passengerCount.value);
        const fare = Number(farePerPassenger.value);
        const validCount = Number.isInteger(count) && count >= 1 && count <= 6;
        if (!validCount || Number.isNaN(fare)) {
            totalFare.textContent = 'Invalid passenger count';
            return false;
        }
        totalFare.textContent = `₹${(count * fare).toFixed(2)}`;
        return true;
    };

    passengerCount.addEventListener('input', calculateTotalFare);
    calculateTotalFare();

    const selectedRouteId = document.querySelector('#selectedRouteId')?.value;
    if (selectedRouteId) {
        loadSelectedRoute(selectedRouteId, farePerPassenger, calculateTotalFare);
    }

}

async function loadSelectedRoute(routeId, fareElement, recalculate) {
    try {
        const response = await fetch(`route-search?routeId=${encodeURIComponent(routeId)}`);
        const routes = await response.json();
        if (!response.ok || routes.length === 0) return;
        const route = routes[0];
        setText('selectedRouteNumber', route.routeNumber);
        setText('selectedSource', route.source);
        setText('selectedDestination', route.destination);
        setText('selectedTravelDate', route.departure);
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
    confirmPassword?.addEventListener('input', () => {
        confirmPassword.setCustomValidity(
            password.value === confirmPassword.value ? '' : 'Passwords do not match.'
        );
    });
}

function setupPrintButtons() {
    document.querySelectorAll('[data-print]').forEach((button) => {
        button.addEventListener('click', () => window.print());
    });
}

function setupHomeSearchMessage() {
    const form = document.querySelector('#searchForm');
    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        document.querySelector('#searchMessage')?.classList.remove('d-none');
    });
}

function setupRouteSearchPage() {
    const form = document.querySelector('#routeSearchForm');
    const results = document.querySelector('#routeResults');
    if (!form || !results) return;

    const dateInput = document.querySelector('#searchDate');
    const localToday = getLocalDateString();
    if (dateInput) {
        dateInput.min = localToday;
        if (!dateInput.value) dateInput.value = localToday;
    }

    const sourceSelect = document.querySelector('#searchSource');
    const destinationSelect = document.querySelector('#searchDestination');

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
        loadRoutes(
            document.querySelector('#searchSource').value,
            document.querySelector('#searchDestination').value
        );
    });

    populateRouteFilters();
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
        row.innerHTML = '<td colspan="9" class="text-center text-muted">No routes found.</td>';
        container.appendChild(row);
        return;
    }

    routes.forEach((route) => {
        const row = document.createElement('tr');
        addCell(row, route.routeId);
        addCell(row, route.source);
        addCell(row, route.destination);
        addCell(row, route.stops);
        addCell(row, `${route.travelTimeMinutes} minutes`);
        addCell(row, route.departure);
        addCell(row, route.arrival);
        addCell(row, `₹${Number(route.fare).toFixed(2)}`);
        const actionCell = document.createElement('td');
        const link = document.createElement('a');
        link.className = 'btn btn-sm btn-primary';
        const travelDate = document.querySelector('#searchDate')?.value || '';
        link.href = `booking.html?routeId=${encodeURIComponent(route.routeId)}&travelDate=${encodeURIComponent(travelDate)}`;
        link.textContent = 'Book Now';
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
            renderManagementResults(results, routes, beginEdit, deleteRoute);
        } catch (error) {
            showManagementMessage('Routes could not be loaded. Check Tomcat, the admin session, and Oracle.', true);
        }
    };

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
            fare: document.querySelector('#fare').value
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
        document.querySelector('#routeSubmitButton').textContent = 'Update Route';
        document.querySelector('#routeCancelButton').classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function deleteRoute(routeId) {
        if (!window.confirm('Delete this route?')) return;
        await submitManagementRequest(new URLSearchParams({ action: 'delete', routeId }), loadRoutes);
    }

    function clearRouteForm() {
        form.reset();
        document.querySelector('#routeDbId').value = '';
        document.querySelector('#routeSubmitButton').textContent = 'Add Route';
        document.querySelector('#routeCancelButton').classList.add('d-none');
    }
}

function setupTicketPage() {
    const bookingId = new URLSearchParams(window.location.search).get('bookingId');
    if (!bookingId || !document.querySelector('#ticketBookingId')) return;

    fetch(`ticket?bookingId=${encodeURIComponent(bookingId)}`)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('Ticket unavailable.')))
        .then((ticket) => {
            setText('ticketPassenger', 'Logged-in user');
            setText('ticketBookingId', ticket.bookingId);
            setText('ticketRoute', ticket.routeNumber);
            setText('ticketSource', ticket.source);
            setText('ticketDestination', ticket.destination);
            setText('ticketTravelDate', formatDate(ticket.travelDate));
            setText('ticketPassengerCount', ticket.passengerCount);
            setText('ticketFare', `₹${Number(ticket.totalFare).toFixed(2)}`);
            setText('ticketNumber', ticket.ticketNumber);
            setText('ticketStatus', ticket.status);
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
    const bookingId = new URLSearchParams(window.location.search).get('bookingId');
    if (!bookingId || !document.querySelector('#invoiceBookingId')) return;

    fetch(`invoice?bookingId=${encodeURIComponent(bookingId)}`)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('Invoice unavailable.')))
        .then((invoice) => {
            setText('invoiceNumber', invoice.invoiceNumber);
            setText('invoiceDate', formatDate(invoice.invoiceDate));
            setText('invoiceBookingId', invoice.bookingId);
            setText('invoicePassenger', invoice.passengerName);
            setText('invoiceRoute', invoice.route);
            setText('invoicePassengerCount', invoice.passengerCount);
            setText('invoiceAmount', `₹${Number(invoice.amount).toFixed(2)}`);
            setText('invoicePaymentMethod', invoice.paymentMethod);
            setText('invoicePaymentStatus', invoice.paymentStatus);
        })
        .catch(() => {
            const message = document.createElement('div');
            message.className = 'alert alert-danger';
            message.textContent = 'Invoice details could not be loaded.';
            document.querySelector('main')?.prepend(message);
        });
}

function setupTravelHistoryPage() {
    const results = document.querySelector('#historyResults');
    if (!results) return;

    fetch('travel-history')
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('History unavailable.')))
        .then((history) => {
            results.replaceChildren();
            document.querySelector('#historyMessage')?.classList.add('d-none');
            if (history.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="8" class="text-center text-muted">No previous bookings found.</td>';
                results.appendChild(row);
                return;
            }
            history.forEach((item) => {
                const row = document.createElement('tr');
                addCell(row, item.bookingId);
                addCell(row, formatDate(item.bookingDate));
                addCell(row, item.source);
                addCell(row, item.destination);
                addCell(row, item.passengerCount);
                addCell(row, `₹${Number(item.totalFare).toFixed(2)}`);
                addCell(row, item.status);
                const cell = document.createElement('td');
                const link = document.createElement('a');
                link.className = 'btn btn-sm btn-outline-primary';
                link.href = `ticket.html?bookingId=${encodeURIComponent(item.bookingId)}`;
                link.textContent = 'View Ticket';
                cell.appendChild(link);
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

function formatDate(value) {
    return value ? String(value).replace('T', ' ').slice(0, 16) : '-';
}

function showTicketError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.textContent = message;
    document.querySelector('main')?.prepend(alert);
}

function renderManagementResults(container, routes, editCallback, deleteCallback) {
    container.replaceChildren();
    routes.forEach((route) => {
        const row = document.createElement('tr');
        addCell(row, route.routeId);
        addCell(row, route.routeNumber);
        addCell(row, route.source);
        addCell(row, route.destination);
        addCell(row, route.departure);
        addCell(row, route.arrival);
        addCell(row, `₹${Number(route.fare).toFixed(2)}`);
        const actionCell = document.createElement('td');
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-sm btn-outline-secondary me-1';
        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => editCallback(route));
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-outline-danger';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteCallback(route.routeId));
        actionCell.append(editButton, deleteButton);
        row.appendChild(actionCell);
        container.appendChild(row);
    });
    if (routes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" class="text-center text-muted">No routes found.</td>';
        container.appendChild(row);
    }
}

async function submitManagementRequest(data, reload) {
    try {
        const response = await fetch('route-management', { method: 'POST', body: data });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Route operation failed.');
        showManagementMessage(result.message, false);
        document.querySelector('#routeManagementForm')?.reset();
        document.querySelector('#routeDbId').value = '';
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

function setText(id, value) {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = value ?? '';
}
