-- Public Transport Bus Ticketing System
-- Sample data for Oracle Database 21c XE.
-- Run this script after 01_create_tables.sql.

-- Demo users. These passwords are for local development only.
INSERT INTO users (full_name, email, password, phone_number)
VALUES ('Arun Kumar', 'arun.kumar@example.com', 'Arun@123', '9876543210');

INSERT INTO users (full_name, email, password, phone_number)
VALUES ('Priya Sharma', 'priya.sharma@example.com', 'Priya@123', '9876543211');

INSERT INTO users (full_name, email, password, phone_number)
VALUES ('System Administrator', 'admin@busticket.com', 'Admin@123', '9876543212');

-- Link the administrator role to the admin user by unique email.
INSERT INTO admin (user_id, admin_role)
SELECT user_id, 'ADMIN' FROM users WHERE email = 'admin@busticket.com';

-- Sample routes with distinct source/destination combinations and fares.
INSERT INTO routes (route_number, source_location, destination, departure_time, arrival_time, fare)
VALUES ('R101', 'Chennai Central', 'Tambaram', TO_DATE('2026-01-01 06:30', 'YYYY-MM-DD HH24:MI'), TO_DATE('2026-01-01 07:30', 'YYYY-MM-DD HH24:MI'), 35.00);

INSERT INTO routes (route_number, source_location, destination, departure_time, arrival_time, fare)
VALUES ('R102', 'Tambaram', 'Chennai Central', TO_DATE('2026-01-01 08:00', 'YYYY-MM-DD HH24:MI'), TO_DATE('2026-01-01 09:00', 'YYYY-MM-DD HH24:MI'), 35.00);

INSERT INTO routes (route_number, source_location, destination, departure_time, arrival_time, fare)
VALUES ('R201', 'Koyambedu', 'Guindy', TO_DATE('2026-01-01 07:15', 'YYYY-MM-DD HH24:MI'), TO_DATE('2026-01-01 08:00', 'YYYY-MM-DD HH24:MI'), 25.00);

INSERT INTO routes (route_number, source_location, destination, departure_time, arrival_time, fare)
VALUES ('R202', 'Guindy', 'Koyambedu', TO_DATE('2026-01-01 17:30', 'YYYY-MM-DD HH24:MI'), TO_DATE('2026-01-01 18:15', 'YYYY-MM-DD HH24:MI'), 25.00);

INSERT INTO routes (route_number, source_location, destination, departure_time, arrival_time, fare)
VALUES ('R301', 'Adyar', 'Anna Nagar', TO_DATE('2026-01-01 09:00', 'YYYY-MM-DD HH24:MI'), TO_DATE('2026-01-01 09:50', 'YYYY-MM-DD HH24:MI'), 30.00);

INSERT INTO routes (route_number, source_location, destination, departure_time, arrival_time, fare)
VALUES ('R302', 'Anna Nagar', 'Adyar', TO_DATE('2026-01-01 18:00', 'YYYY-MM-DD HH24:MI'), TO_DATE('2026-01-01 18:50', 'YYYY-MM-DD HH24:MI'), 30.00);

INSERT INTO routes (route_number, source_location, destination, departure_time, arrival_time, fare)
VALUES ('R401', 'Velachery', 'T Nagar', TO_DATE('2026-01-01 06:45', 'YYYY-MM-DD HH24:MI'), TO_DATE('2026-01-01 07:35', 'YYYY-MM-DD HH24:MI'), 28.50);

INSERT INTO routes (route_number, source_location, destination, departure_time, arrival_time, fare)
VALUES ('R402', 'T Nagar', 'Velachery', TO_DATE('2026-01-01 19:00', 'YYYY-MM-DD HH24:MI'), TO_DATE('2026-01-01 19:50', 'YYYY-MM-DD HH24:MI'), 28.50);

COMMIT;

-- Display the generated sample records.
SELECT user_id, full_name, email, user_status FROM users ORDER BY user_id;
SELECT route_id, route_number, source_location, destination, fare FROM routes ORDER BY route_id;

