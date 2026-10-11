// Shared browser-side behavior for the college project frontend.
// Route and admin actions call the Java Servlets only when deployed on Tomcat.
document.addEventListener('DOMContentLoaded', () => {
    applyBranding();
    showUrlMessage();
    setupBookingPage();
    setupValidation();
    setupPrintButtons();
    setupHomeRouteSearch();
    setupRouteSearchPage();
    setupRouteManagementPage();
    setupTicketPage();
    setupInvoicePage();
    setupTravelHistoryPage();
    setupLoginChooser();
    setupAdminPages();
});

function applyBranding() {
    const replacements = [
        ['Public Transport Bus Ticketing System', 'SA Wheels'],
        ['Bus Ticketing System', 'SA Wheels']
    ];

    // Keep the HTML pages simple while ensuring the new product name appears
    // consistently in visible text and browser tab titles.
    document.title = replacements.reduce(
        (title, [oldText, newText]) => title.replaceAll(oldText, newText),
        document.title
    );
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
        replacements.forEach(([oldText, newText]) => {
            node.nodeValue = node.nodeValue.replaceAll(oldText, newText);
        });
    });

    document.querySelectorAll('.navbar-brand').forEach((brand) => {
        if (brand.querySelector('.brand-logo')) return;
        const logo = document.createElement('img');
        logo.className = 'brand-logo';
        logo.src = 'assets/sa-logo.svg';
        logo.alt = 'SA Wheels logo';
        brand.prepend(logo);
    });
}

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
        'too-many-attempts': ['Too many failed attempts. Please wait 2 minutes and try again.', 'danger'],
        'route-unavailable': ['The selected route is unavailable.', 'danger'],
        'invalid-booking': ['Please check the route, date, payment method, and passenger count.', 'danger'],
        'booking-failed': ['The booking could not be completed. Please try again.', 'danger'],
        registered: ['Registration successful. You can now log in.', 'success'],
        'logged-out': ['You have been logged out.', 'success']
    };
    const params = new URLSearchParams(window.location.search);
    const loginView = ['user', 'admin'].includes(params.get('login')) ? params.get('login') : null;
    const adminLogin = loginView === 'admin' || window.location.pathname.endsWith('admin-login.html');
    if (adminLogin) {
        messages['invalid-credentials'] = ['Invalid admin username or password.', 'danger'];
        messages['login-required'] = ['Please log in as admin to access that page.', 'warning'];
    }
    const message = messages[params.get('error') || params.get('success')];
    if (message) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${message[1]} mb-3`;
        alert.textContent = message[0];
        // Login errors from the home page popup are shown inside the popup form.
        const popupHost = loginView
            && document.querySelector(`#loginChooser [data-login-view="${loginView}"] .login-alert`);
        (popupHost || document.querySelector('main'))?.prepend(alert);
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

function setupHomeRouteSearch() {
    const form = document.querySelector('#searchForm');
    const results = document.querySelector('#homeRouteResults');
    if (!form || !results) return;

    const sourceSelect = document.querySelector('#source');
    const destinationSelect = document.querySelector('#destination');
    const dateInput = document.querySelector('#travelDate');
    const localToday = getLocalDateString();
    if (dateInput) {
        dateInput.min = localToday;
        dateInput.value = localToday;
    }

    let allRoutes = [];
    const loadAllRoutes = async () => {
        try {
            const response = await fetch('route-search');
            const routes = await response.json();
            if (!response.ok) throw new Error('Route loading failed.');
            allRoutes = routes;
            const sources = [...new Set(routes.map((route) => route.source))].sort();
            const destinations = [...new Set(routes.map((route) => route.destination))].sort();
            addSelectOptions(sourceSelect, sources, 'Choose source');
            addSelectOptions(destinationSelect, destinations, 'Choose destination');
        } catch (error) {
            showSearchMessage('Routes could not be loaded. Please try again later.', true);
        }
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const query = new URLSearchParams({
            source: sourceSelect.value,
            destination: destinationSelect.value
        });
        try {
            const response = await fetch(`route-search?${query}`);
            const routes = await response.json();
            if (!response.ok) throw new Error('Route search failed.');
            renderHomeRouteResults(results, routes);
            const connections = findConnections(allRoutes, sourceSelect.value, destinationSelect.value);
            renderConnections(connections, false);
            showSearchMessage(journeySummary(routes.length, connections));
        } catch (error) {
            showSearchMessage('Route search is unavailable. Please try again later.', true);
        }
    });

    setupLocateButtons();
    loadAllRoutes();
}

function renderHomeRouteResults(container, routes) {
    container.replaceChildren();
    if (!routes.length) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center text-muted">No routes found.</td>';
        container.appendChild(row);
        return;
    }

    routes.forEach((route) => {
        const row = document.createElement('tr');
        addCell(row, route.routeNumber);
        addCell(row, route.source);
        addCell(row, route.destination);
        addCell(row, route.departure);
        addCell(row, route.arrival);
        addCell(row, `₹${Number(route.fare).toFixed(2)}`);
        container.appendChild(row);
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
    let allRoutes = [];
    const populateRouteFilters = async () => {
        try {
            const response = await fetch('route-search');
            const routes = await response.json();
            if (!response.ok) throw new Error(routes.error || 'Route loading failed.');
            allRoutes = routes;

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
            const connections = findConnections(allRoutes, source, destination);
            renderConnections(connections, true);
            showSearchMessage(journeySummary(routes.length, connections));
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

    setupLocateButtons();
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

// ---------- Connecting (indirect) journeys ----------
// Routes connect when one route ends where the next one starts. A connection is
// "timed" when the next bus leaves at least MIN_TRANSFER_MINUTES after the
// previous one arrives. Imported MTC routes only have placeholder times, so
// their connections are still shown but marked as "check timetable".
const MAX_JOURNEY_LEGS = 3;
const MIN_TRANSFER_MINUTES = 5;
const MAX_CONNECTIONS_SHOWN = 10;

function stopKey(name) {
    return (name || '').trim().toLowerCase();
}

function timeToMinutes(value) {
    const match = /^(\d{1,2}):(\d{2})/.exec(value || '');
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function formatMinutes(total) {
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    if (!hours) return `${minutes} min`;
    return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

function findConnections(routes, source, destination) {
    const from = stopKey(source);
    const to = stopKey(destination);
    if (!from || !to || from === to) return { journeys: [], total: 0 };

    const routesByStop = new Map();
    routes.forEach((route) => {
        const start = stopKey(route.source);
        if (start === stopKey(route.destination)) return;
        if (!routesByStop.has(start)) routesByStop.set(start, []);
        routesByStop.get(start).push(route);
    });

    // Depth-first walk over the stop graph, never visiting a stop twice.
    const found = [];
    const walk = (legs, visited) => {
        const here = stopKey(legs[legs.length - 1].destination);
        if (here === to) {
            if (legs.length > 1) found.push(describeJourney(legs));
            return;
        }
        if (legs.length >= MAX_JOURNEY_LEGS) return;
        (routesByStop.get(here) || []).forEach((next) => {
            const nextStop = stopKey(next.destination);
            if (visited.has(nextStop)) return;
            walk([...legs, next], new Set(visited).add(nextStop));
        });
    };
    (routesByStop.get(from) || []).forEach((first) => {
        walk([first], new Set([from, stopKey(first.destination)]));
    });

    found.sort((a, b) =>
        (b.timed - a.timed) ||
        (a.legs.length - b.legs.length) ||
        (a.totalMinutes - b.totalMinutes) ||
        (a.totalFare - b.totalFare));
    return { journeys: found.slice(0, MAX_CONNECTIONS_SHOWN), total: found.length };
}

// Imported MTC routes use 00:00 -> 01:00 as a placeholder schedule (see README).
function hasRealSchedule(route) {
    return !(route.departure === '00:00' && route.arrival === '01:00');
}

function describeJourney(legs) {
    let timed = legs.every(hasRealSchedule);
    const waits = [];
    for (let index = 1; index < legs.length; index++) {
        const arrived = timeToMinutes(legs[index - 1].arrival);
        const departs = timeToMinutes(legs[index].departure);
        const previousDeparted = timeToMinutes(legs[index - 1].departure);
        const overnight = arrived !== null && previousDeparted !== null && arrived < previousDeparted;
        const scheduled = hasRealSchedule(legs[index - 1]) && hasRealSchedule(legs[index]);
        const wait = !scheduled || arrived === null || departs === null || overnight ? null : departs - arrived;
        if (wait === null || wait < MIN_TRANSFER_MINUTES) timed = false;
        waits.push(wait);
    }

    const ridingMinutes = legs.reduce((sum, leg) => sum + Math.max(0, Number(leg.travelTimeMinutes) || 0), 0);
    const first = timeToMinutes(legs[0].departure);
    const last = timeToMinutes(legs[legs.length - 1].arrival);
    return {
        legs,
        waits,
        timed,
        totalMinutes: timed && first !== null && last !== null ? last - first : ridingMinutes,
        totalFare: legs.reduce((sum, leg) => sum + Number(leg.fare || 0), 0)
    };
}

function journeySummary(directCount, connections) {
    const parts = [];
    if (directCount) parts.push(`${directCount} direct route(s)`);
    if (connections.total) parts.push(`${connections.total} connecting journey(s)`);
    if (!parts.length) return 'No direct or connecting routes are available for this journey.';
    const shown = connections.total > connections.journeys.length
        ? ` Showing the best ${connections.journeys.length} connections.` : '';
    return `${parts.join(' and ')} found.${shown}`;
}

function renderConnections(connections, allowBooking) {
    const section = document.querySelector('#connectionSection');
    const container = document.querySelector('#connectionResults');
    if (!section || !container) return;
    container.replaceChildren();
    section.classList.toggle('d-none', connections.journeys.length === 0);
    const travelDate = document.querySelector('#searchDate, #travelDate')?.value || '';

    connections.journeys.forEach((journey) => {
        const changes = journey.legs.length - 1;
        const via = journey.legs.slice(0, -1).map((leg) => leg.destination).join(', ');
        const card = document.createElement('article');
        card.className = 'journey-card';

        const head = document.createElement('div');
        head.className = 'journey-head';
        const title = document.createElement('div');
        title.className = 'journey-title';
        title.textContent = `${journey.legs[0].source} → ${journey.legs[journey.legs.length - 1].destination}`;
        const meta = document.createElement('div');
        meta.className = 'journey-meta';
        [
            [`bi-shuffle`, `${changes} change${changes > 1 ? 's' : ''} via ${via}`],
            [`bi-clock`, `${formatMinutes(journey.totalMinutes)}${journey.timed ? '' : ' riding'}`],
            [`bi-currency-rupee`, Number(journey.totalFare).toFixed(2)]
        ].forEach(([icon, text]) => meta.appendChild(iconText(icon, text)));
        head.append(title, meta);
        card.appendChild(head);

        const list = document.createElement('ol');
        list.className = 'journey-legs';
        journey.legs.forEach((leg, index) => {
            if (index > 0) {
                const wait = journey.waits[index - 1];
                const transfer = document.createElement('li');
                transfer.className = 'journey-transfer';
                const waitText = wait !== null && wait >= MIN_TRANSFER_MINUTES
                    ? `${formatMinutes(wait)} wait` : 'check timetable for connection';
                transfer.appendChild(iconText('bi-arrow-left-right', `Change at ${leg.source} · ${waitText}`));
                list.appendChild(transfer);
            }

            const item = document.createElement('li');
            item.className = 'journey-leg';
            const badge = document.createElement('span');
            badge.className = 'badge badge-soft leg-route';
            badge.textContent = leg.routeNumber;
            const info = document.createElement('div');
            info.className = 'leg-info';
            const stops = document.createElement('strong');
            stops.textContent = `${leg.source} → ${leg.destination}`;
            const times = document.createElement('span');
            times.textContent = `${leg.departure} – ${leg.arrival} · ₹${Number(leg.fare).toFixed(2)}`;
            info.append(stops, times);
            item.append(badge, info);
            if (allowBooking) {
                const link = document.createElement('a');
                link.className = 'btn btn-sm btn-outline-primary leg-book';
                link.href = `booking.html?routeId=${encodeURIComponent(leg.routeId)}&travelDate=${encodeURIComponent(travelDate)}`;
                link.textContent = 'Book leg';
                item.appendChild(link);
            }
            list.appendChild(item);
        });
        card.appendChild(list);
        container.appendChild(card);
    });
}

function iconText(icon, text) {
    const span = document.createElement('span');
    const i = document.createElement('i');
    i.className = `bi ${icon}`;
    span.append(i, document.createTextNode(text));
    return span;
}

// ---------- "Use my location" ----------
// Approximate coordinates of common Chennai bus terminuses. Stop names from the
// database are matched by the longest known name they contain.
const STOP_COORDINATES = {
    chennaicentral: [13.0827, 80.2757], central: [13.0827, 80.2757], broadway: [13.0878, 80.2847],
    parrys: [13.0890, 80.2880], mint: [13.0950, 80.2840], egmore: [13.0784, 80.2610],
    annasquare: [13.0626, 80.2812], tnagar: [13.0418, 80.2341],
    thiyagarayanagar: [13.0418, 80.2341], guindy: [13.0067, 80.2206], adyar: [13.0012, 80.2565],
    annanagar: [13.0850, 80.2101], thirumangalam: [13.0850, 80.2020], velachery: [12.9791, 80.2185],
    tambaram: [12.9249, 80.1000], koyambedu: [13.0694, 80.1948], cmbt: [13.0694, 80.1948],
    vadapalani: [13.0500, 80.2121], ashoknagar: [13.0358, 80.2120], kknagar: [13.0410, 80.1990],
    kodambakkam: [13.0521, 80.2255], saidapet: [13.0213, 80.2231], mylapore: [13.0339, 80.2697],
    mandaveli: [13.0270, 80.2630], besantnagar: [13.0002, 80.2668], thiruvanmiyur: [12.9830, 80.2594],
    sholinganallur: [12.9010, 80.2279], siruseri: [12.8250, 80.2220], kelambakkam: [12.7860, 80.2200],
    medavakkam: [12.9171, 80.1923], alandur: [12.9988, 80.2014], pallavaram: [12.9675, 80.1491],
    chromepet: [12.9516, 80.1462], kilambakkam: [12.8728, 80.0816], guduvancheri: [12.8452, 80.0603],
    chengalpattu: [12.6921, 79.9762], mamallapuram: [12.6208, 80.1945], porur: [13.0382, 80.1565],
    kundrathur: [12.9977, 80.0970], poonamallee: [13.0473, 80.0945], tirumazhisai: [13.0507, 80.0617],
    avadi: [13.1149, 80.1012], ambattur: [13.1143, 80.1548], padi: [13.0990, 80.1880],
    villivakkam: [13.1080, 80.2050], ayanavaram: [13.0996, 80.2307], perambur: [13.1210, 80.2326],
    redhills: [13.1865, 80.1999], thiruvallur: [13.1439, 79.9070], tondiarpet: [13.1290, 80.2890],
    royapuram: [13.1137, 80.2954], tiruvottiyur: [13.1643, 80.3001], manali: [13.1667, 80.2667],
    ennore: [13.2146, 80.3203]
};
const MAX_NEAREST_STOP_KM = 30;

function stopCoordinates(name) {
    const normalized = (name || '').toLowerCase().replace(/[^a-z]/g, '');
    let best = null;
    Object.keys(STOP_COORDINATES).forEach((key) => {
        if (normalized.includes(key) && (!best || key.length > best.length)) best = key;
    });
    return best ? STOP_COORDINATES[best] : null;
}

function distanceKm([lat1, lon1], [lat2, lon2]) {
    const rad = (degrees) => degrees * Math.PI / 180;
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function setupLocateButtons() {
    document.querySelectorAll('[data-locate-for]').forEach((button) => {
        const select = document.querySelector(`#${button.dataset.locateFor}`);
        if (!select) return;
        const label = button.innerHTML;
        const notify = (message, type) => {
            if (window.showToast) window.showToast(message, type);
            else showSearchMessage(message, type === 'danger');
        };

        button.addEventListener('click', () => {
            if (!('geolocation' in navigator)) {
                notify('Location is not supported by this browser.', 'warning');
                return;
            }
            if (!window.isSecureContext) {
                notify('Location needs a secure page (https or localhost).', 'warning');
                return;
            }
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Finding you...';
            const done = () => {
                button.disabled = false;
                button.innerHTML = label;
            };

            navigator.geolocation.getCurrentPosition((position) => {
                done();
                const here = [position.coords.latitude, position.coords.longitude];
                let nearest = null;
                [...select.options].forEach((option) => {
                    const coordinates = option.value && stopCoordinates(option.value);
                    if (!coordinates) return;
                    const km = distanceKm(here, coordinates);
                    if (!nearest || km < nearest.km) nearest = { value: option.value, km };
                });
                if (!nearest) {
                    notify('No stops with known locations were found. Please choose the source manually.', 'warning');
                } else if (nearest.km > MAX_NEAREST_STOP_KM) {
                    notify(`The nearest stop (${nearest.value}) is ${Math.round(nearest.km)} km away. Please choose the source manually.`, 'warning');
                } else {
                    select.value = nearest.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    notify(`Source set to ${nearest.value} (${nearest.km.toFixed(1)} km away).`, 'success');
                }
            }, (error) => {
                done();
                const messages = {
                    1: 'Location permission was denied. Allow location access to use this.',
                    2: 'Your location could not be determined.',
                    3: 'Finding your location took too long. Please try again.'
                };
                notify(messages[error.code] || 'Your location could not be determined.', 'danger');
            }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
        });
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
            setText('ticketIssuedAt', formatDate(ticket.issuedAt));
            setText('ticketValidUntil', ticket.demoActive ? 'No expiry (demo ticket)' : formatDate(ticket.validUntil));
            const invoiceLink = document.querySelector('#invoiceLink');
            if (invoiceLink) invoiceLink.href = `invoice.html?bookingId=${encodeURIComponent(bookingId)}`;
            showTicketValidity(bookingId, ticket);
        })
        .catch(() => showTicketError('Ticket details could not be loaded.'));
}

/**
 * Shows whether the ticket is active, loads the QR image and, for an active
 * ticket, counts down to expiry. The server sends secondsLeft (worked out by
 * Oracle), so the countdown does not depend on the browser's clock being right.
 * When it reaches zero the QR is loaded again, and the server returns it blurred.
 */
function showTicketValidity(bookingId, ticket) {
    const qrUrl = `ticket-qr?bookingId=${encodeURIComponent(bookingId)}`;
    const expiresAt = Date.now() + Number(ticket.secondsLeft || 0) * 1000;
    const countdown = document.querySelector('#ticketCountdown');
    let timer = null;

    const render = (state) => {
        const labels = { ACTIVE: ticket.demoActive ? 'Active · Demo' : 'Active', EXPIRED: 'Expired',
            CANCELLED: 'Cancelled', USED: 'Used' };
        const badge = document.querySelector('#ticketStatus');
        if (badge) {
            badge.className = `status-badge status-${state.toLowerCase()} mb-3`;
            badge.textContent = labels[state] || state;
        }
        document.querySelector('#qrBox')?.classList.toggle('is-expired', state !== 'ACTIVE');
        const notes = {
            ACTIVE: ticket.demoActive
                ? 'Demo ticket: this QR stays active so it can always be shown.'
                : `Show this code when you board. Tickets are valid for ${ticket.validityHours} hours from departure.`,
            EXPIRED: `This ticket expired at ${formatDate(ticket.validUntil)}. The QR code can no longer be used.`,
            CANCELLED: 'This booking was cancelled. The QR code can no longer be used.',
            USED: 'This ticket has already been used.'
        };
        setText('qrNote', notes[state] || '');
        if (countdown) countdown.classList.toggle('d-none', state !== 'ACTIVE' || ticket.demoActive);
    };

    const loadQr = () => {
        const image = document.querySelector('#qrImage');
        if (!image) return;
        image.onload = () => {
            image.classList.remove('d-none');
            document.querySelector('#qrPlaceholder')?.classList.add('d-none');
        };
        image.src = `${qrUrl}&t=${Date.now()}`;
    };

    const tick = () => {
        const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
        if (left === 0) {
            clearInterval(timer);
            render('EXPIRED');
            loadQr();
            return;
        }
        const hours = Math.floor(left / 3600);
        const minutes = Math.floor((left % 3600) / 60);
        const seconds = left % 60;
        if (countdown) {
            countdown.classList.toggle('is-ending', left < 15 * 60);
            countdown.textContent = `Expires in ${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        }
    };

    render(ticket.ticketState);
    loadQr();
    if (ticket.ticketState === 'ACTIVE' && !ticket.demoActive) {
        tick();
        timer = setInterval(tick, 1000);
    }
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
                row.innerHTML = '<td colspan="9" class="text-center text-muted">No previous bookings found.</td>';
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
                const ticketBadge = statusBadge(item.ticketState === 'NONE' ? '-' : item.ticketState);
                if (item.ticketState === 'ACTIVE' && item.demoActive) ticketBadge.textContent = 'ACTIVE · DEMO';
                addNodeCell(row, ticketBadge);
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

// ---------- Login selection popup (home page) ----------

// Shows the User Login / Admin Login / Register choice. It opens on the first
// visit in a browser session, from the Login links, after logout, and after a
// failed popup login (the servlet redirects back with ?login=user|admin).
function setupLoginChooser() {
    const modalElement = document.querySelector('#loginChooser');
    if (!modalElement || !window.bootstrap) return;
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    const views = modalElement.querySelectorAll('[data-login-view]');

    const showView = (name) => {
        views.forEach((view) => { view.hidden = view.dataset.loginView !== name; });
        const active = modalElement.querySelector(`[data-login-view="${name}"]`);
        const field = active?.querySelector('input:not([type="hidden"])') || active?.querySelector('button');
        if (modalElement.classList.contains('show')) field?.focus();
        else modalElement.addEventListener('shown.bs.modal', () => field?.focus(), { once: true });
    };
    const open = (name) => {
        showView(name);
        modal.show();
    };

    modalElement.querySelectorAll('[data-show-view]').forEach((button) => {
        button.addEventListener('click', () => {
            // Clear old errors when moving between the forms.
            modalElement.querySelectorAll('.login-alert').forEach((host) => host.replaceChildren());
            showView(button.dataset.showView);
        });
    });
    document.querySelectorAll('[data-open-login]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            open(link.dataset.openLogin);
        });
    });
    modalElement.querySelector('[data-fill-demo]')?.addEventListener('click', () => {
        // Only fills the form; the servlet still checks the hashed password in Oracle.
        modalElement.querySelector('#popupAdminUsername').value = 'admin';
        modalElement.querySelector('#popupAdminPassword').value = 'Admin@123';
        modalElement.querySelector('[data-login-view="admin"] button[type="submit"]').focus();
    });

    const params = new URLSearchParams(window.location.search);
    const requested = params.get('login');
    let firstVisit = false;
    try {
        firstVisit = !sessionStorage.getItem('loginChooserSeen');
        sessionStorage.setItem('loginChooserSeen', '1');
    } catch (error) {
        // Storage can be blocked; the popup then opens only from the links.
    }

    if (['choose', 'user', 'admin'].includes(requested)) {
        open(requested);
    } else if (params.get('success') === 'logged-out' || firstVisit) {
        open('choose');
    }

    // Remove the login parameters so a page refresh does not reopen the error.
    if (requested || params.has('error') || params.has('success')) {
        window.history.replaceState(null, '', window.location.pathname);
    }
}

// ---------- Admin pages ----------

function setupAdminPages() {
    const page = document.body.dataset.adminPage;
    if (!page) return;
    const setup = {
        dashboard: setupAdminDashboard,
        bookings: setupAdminBookings,
        users: setupAdminUsers,
        reports: setupAdminReports
    }[page];
    setup?.();
}

// Read one admin view from AdminDataServlet. An expired session goes back to
// the admin login popup instead of showing a broken page.
async function loadAdminData(view) {
    const response = await fetch(`admin-data?view=${encodeURIComponent(view)}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
    });
    if (response.status === 401) {
        window.location.href = 'index.html?login=admin&error=login-required';
        throw new Error('Please log in as admin.');
    }
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Admin data could not be loaded.');
    }
    return result.data;
}

function showAdminError(message) {
    const element = document.querySelector('#adminMessage');
    if (!element) return;
    element.textContent = message;
    element.className = 'alert alert-danger';
}

function formatMoney(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCount(value) {
    return Number(value || 0).toLocaleString('en-IN');
}

function statusBadge(status) {
    const badge = document.createElement('span');
    badge.className = `status-badge status-${String(status || '').toLowerCase()}`;
    badge.textContent = status || '-';
    return badge;
}

function addNodeCell(row, ...nodes) {
    const cell = document.createElement('td');
    cell.append(...nodes);
    row.appendChild(cell);
    return cell;
}

function twoLineText(main, sub) {
    const wrapper = document.createElement('div');
    const strong = document.createElement('strong');
    strong.className = 'd-block';
    strong.textContent = main || '-';
    const small = document.createElement('small');
    small.className = 'text-muted';
    small.textContent = sub || '';
    wrapper.append(strong, small);
    return wrapper;
}

function emptyRow(container, columns, text) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = columns;
    cell.className = 'text-center text-muted';
    cell.textContent = text;
    row.appendChild(cell);
    container.replaceChildren(row);
}

function bookingRow(booking, compact) {
    const row = document.createElement('tr');
    addCell(row, `#${booking.bookingId}`);
    addNodeCell(row, twoLineText(booking.passengerName, booking.passengerEmail));
    addNodeCell(row, twoLineText(`${booking.source} → ${booking.destination}`, booking.routeNumber));
    if (!compact) {
        addCell(row, booking.travelDate || '-');
        addCell(row, booking.passengerCount);
        addCell(row, booking.seatNumber || '-');
    }
    addCell(row, formatMoney(booking.totalFare));
    addNodeCell(row, statusBadge(booking.status));
    if (!compact) addCell(row, booking.bookingDate || '-');
    return row;
}

// Overview: live counts and the latest bookings.
async function setupAdminDashboard() {
    try {
        const summary = await loadAdminData('summary');
        setText('statUsers', formatCount(summary.totalUsers));
        setText('statUsersSub', `${formatCount(summary.activeUsers)} active`);
        setText('statRoutes', formatCount(summary.totalRoutes));
        setText('statRoutesSub', `${formatCount(summary.activeRoutes)} active`);
        setText('statBookings', formatCount(summary.totalBookings));
        setText('statBookingsSub', `${formatCount(summary.confirmedBookings)} confirmed · ${formatCount(summary.pendingBookings)} pending`);
        setText('statRevenue', formatMoney(summary.revenue));
    } catch (error) {
        ['statUsers', 'statRoutes', 'statBookings', 'statRevenue'].forEach((id) => setText(id, '-'));
        showAdminError(`${error.message} Check that Tomcat can reach Oracle.`);
    }

    const recent = document.querySelector('#recentBookings');
    if (!recent) return;
    try {
        const bookings = (await loadAdminData('bookings')).slice(0, 5);
        if (bookings.length === 0) {
            emptyRow(recent, 5, 'No bookings yet.');
            return;
        }
        recent.replaceChildren(...bookings.map((booking) => bookingRow(booking, true)));
    } catch (error) {
        emptyRow(recent, 5, 'Recent bookings could not be loaded.');
    }
}

// Bookings: every booking with passenger, route, fare and status, plus a filter.
async function setupAdminBookings() {
    const results = document.querySelector('#adminBookingResults');
    const search = document.querySelector('#bookingSearch');
    const statusFilter = document.querySelector('#bookingStatusFilter');
    if (!results) return;
    let bookings = [];

    const render = () => {
        const text = (search?.value || '').trim().toLowerCase();
        const status = statusFilter?.value || '';
        const visible = bookings.filter((booking) => {
            const haystack = [booking.bookingId, booking.passengerName, booking.passengerEmail,
                booking.routeNumber, booking.source, booking.destination].join(' ').toLowerCase();
            return (!text || haystack.includes(text)) && (!status || booking.status === status);
        });
        setText('bookingCount', `${visible.length} of ${bookings.length} bookings`);
        if (visible.length === 0) {
            emptyRow(results, 9, bookings.length ? 'No bookings match the filter.' : 'No bookings yet.');
            return;
        }
        results.replaceChildren(...visible.map((booking) => bookingRow(booking, false)));
    };

    search?.addEventListener('input', render);
    statusFilter?.addEventListener('change', render);
    try {
        bookings = await loadAdminData('bookings');
        render();
    } catch (error) {
        emptyRow(results, 9, 'Bookings could not be loaded.');
        showAdminError(error.message);
    }
}

// Users: registered passengers (admin accounts and passwords are not listed).
async function setupAdminUsers() {
    const results = document.querySelector('#adminUserResults');
    const search = document.querySelector('#userSearch');
    if (!results) return;
    let users = [];

    const render = () => {
        const text = (search?.value || '').trim().toLowerCase();
        const visible = users.filter((user) => !text
            || [user.fullName, user.email, user.phoneNumber].join(' ').toLowerCase().includes(text));
        setText('userCount', `${visible.length} of ${users.length} users`);
        if (visible.length === 0) {
            emptyRow(results, 7, users.length ? 'No users match the search.' : 'No registered users yet.');
            return;
        }
        results.replaceChildren(...visible.map((user) => {
            const row = document.createElement('tr');
            addCell(row, user.userId);
            addCell(row, user.fullName);
            addCell(row, user.email);
            addCell(row, user.phoneNumber || '-');
            addCell(row, user.createdAt || '-');
            addCell(row, user.bookingCount);
            addNodeCell(row, statusBadge(user.status));
            return row;
        }));
    };

    search?.addEventListener('input', render);
    try {
        users = await loadAdminData('users');
        render();
    } catch (error) {
        emptyRow(results, 7, 'Users could not be loaded.');
        showAdminError(error.message);
    }
}

// Reports: booking status breakdown, totals and the busiest routes.
async function setupAdminReports() {
    try {
        const { summary, topRoutes } = await loadAdminData('reports');
        setText('reportRevenue', formatMoney(summary.revenue));
        setText('reportPassengers', formatCount(summary.totalPassengers));
        const average = summary.confirmedBookings ? summary.revenue / summary.confirmedBookings : 0;
        setText('reportAverage', formatMoney(average));
        setText('reportUsers', `${formatCount(summary.activeUsers)} / ${formatCount(summary.totalUsers)}`);

        const statuses = [
            ['Confirmed', summary.confirmedBookings, 'confirmed'],
            ['Pending', summary.pendingBookings, 'pending'],
            ['Cancelled', summary.cancelledBookings, 'cancelled']
        ];
        const bars = document.querySelector('#statusBars');
        if (bars) {
            bars.replaceChildren(...statuses.map(([label, count, key]) => {
                const percent = summary.totalBookings ? Math.round((count / summary.totalBookings) * 100) : 0;
                const item = document.createElement('div');
                item.className = 'report-bar';
                item.innerHTML = '<div class="report-bar-label"><span></span><strong></strong></div><div class="report-bar-track"><div class="report-bar-fill"></div></div>';
                item.querySelector('span').textContent = label;
                item.querySelector('strong').textContent = `${formatCount(count)} (${percent}%)`;
                const fill = item.querySelector('.report-bar-fill');
                fill.classList.add(`fill-${key}`);
                fill.style.width = `${percent}%`;
                return item;
            }));
        }

        const results = document.querySelector('#topRouteResults');
        if (!results) return;
        if (topRoutes.length === 0) {
            emptyRow(results, 5, 'No bookings yet.');
            return;
        }
        results.replaceChildren(...topRoutes.map((route) => {
            const row = document.createElement('tr');
            addCell(row, route.routeNumber);
            addCell(row, `${route.source} → ${route.destination}`);
            addCell(row, formatCount(route.bookings));
            addCell(row, formatCount(route.passengers));
            addCell(row, formatMoney(route.revenue));
            return row;
        }));
    } catch (error) {
        showAdminError(`${error.message} Check that Tomcat can reach Oracle.`);
        const results = document.querySelector('#topRouteResults');
        if (results) emptyRow(results, 5, 'Reports could not be loaded.');
    }
}
