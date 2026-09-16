-- Public Transport Bus Ticketing System
-- Read-only test queries for Oracle Database 21c XE.
-- Run this script after 01_create_tables.sql and 02_insert_sample_data.sql.

-- 1. View all users.
SELECT user_id, full_name, email, phone_number, user_status, created_at
FROM users ORDER BY user_id;

-- 2. View all routes.
SELECT route_id, route_number, source_location, destination, departure_time, arrival_time, fare, route_status
FROM routes ORDER BY route_id;

-- 3. Search routes by source and destination.
SELECT route_id, route_number, source_location, destination, departure_time, arrival_time, fare
FROM routes
WHERE UPPER(source_location) = UPPER('Chennai Central')
  AND UPPER(destination) = UPPER('Tambaram');

-- 4. View all bookings.
SELECT booking_id, user_id, route_id, booking_date, travel_date, seat_number, total_fare, booking_status
FROM bookings ORDER BY booking_id;

-- 5. Join bookings with the related user and route.
SELECT b.booking_id, u.full_name, u.email, r.route_number, r.source_location,
       r.destination, b.travel_date, b.seat_number, b.total_fare, b.booking_status
FROM bookings b
JOIN users u ON u.user_id = b.user_id
JOIN routes r ON r.route_id = b.route_id
ORDER BY b.booking_id;

-- 6. View ticket details with booking, user, and route information.
SELECT t.ticket_id, t.ticket_number, t.qr_code, t.issued_at, t.ticket_status,
       b.booking_id, u.full_name, r.route_number, r.source_location,
       r.destination, b.travel_date, b.seat_number
FROM tickets t
JOIN bookings b ON b.booking_id = t.booking_id
JOIN users u ON u.user_id = b.user_id
JOIN routes r ON r.route_id = b.route_id
ORDER BY t.ticket_id;

-- 7. View invoice details with booking, user, and route information.
SELECT i.invoice_id, i.invoice_number, i.invoice_date, i.amount,
       i.payment_method, i.payment_status, b.booking_id, u.full_name,
       r.route_number, r.source_location, r.destination
FROM invoices i
JOIN bookings b ON b.booking_id = i.booking_id
JOIN users u ON u.user_id = b.user_id
JOIN routes r ON r.route_id = b.route_id
ORDER BY i.invoice_id;

