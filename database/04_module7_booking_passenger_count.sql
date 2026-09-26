-- Module 7 migration for an existing Oracle schema.
-- Run this once after database/01_create_tables.sql on databases created before Module 7.

ALTER TABLE bookings ADD (passenger_count NUMBER(3) DEFAULT 1 NOT NULL);

ALTER TABLE bookings ADD CONSTRAINT ck_bookings_passengers
    CHECK (passenger_count BETWEEN 1 AND 6);

-- The QR payload includes route and passenger details.
ALTER TABLE tickets MODIFY (qr_code VARCHAR2(500));
