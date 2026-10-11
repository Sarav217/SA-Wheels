-- Ticket expiry: every ticket is valid for 6 hours from the bus departure on the
-- travel date (or from ISSUED_AT if it was booked after the bus left).
-- Run this script after 01-06. It is safe to run more than once.
--
-- The application works out expiry when a ticket is read
-- (start + 6 hours compared with SYSDATE), so no scheduled job is needed.
-- Expired tickets show a blurred QR code that cannot be scanned.
--
-- DEMO_ACTIVE = 'Y' keeps a ticket active permanently so the ticket and QR
-- can always be shown in a demo. All other tickets expire normally.

-- 1. Add the DEMO_ACTIVE flag (skip if it already exists).
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE tickets ADD (demo_active CHAR(1) DEFAULT ''N'' NOT NULL)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1430 THEN -- ORA-01430: column already exists
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE tickets ADD CONSTRAINT ck_tickets_demo_active ' ||
                      'CHECK (demo_active IN (''Y'', ''N''))';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -2264 THEN -- ORA-02264: constraint name already used
            RAISE;
        END IF;
END;
/

-- 2. Keep the two most recent tickets of the demo user active permanently.
--    Log in as arun.kumar@example.com / Arun@123 to show them; his older
--    tickets expire normally, so both states can be shown.
UPDATE tickets
SET demo_active = 'Y'
WHERE ticket_id IN (
    SELECT ticket_id
    FROM (
        SELECT t.ticket_id
        FROM tickets t
        JOIN bookings b ON b.booking_id = t.booking_id
        JOIN users u ON u.user_id = b.user_id
        WHERE u.email = 'arun.kumar@example.com'
          AND t.ticket_status = 'VALID'
          AND b.booking_status = 'CONFIRMED'
        ORDER BY t.issued_at DESC, t.ticket_id DESC
    )
    WHERE ROWNUM <= 2
);

COMMIT;

-- To keep any other ticket active for a demo:
--   UPDATE tickets SET demo_active = 'Y' WHERE ticket_number = 'TKT-...';
--   COMMIT;
-- To let it expire normally again, set demo_active = 'N'.

-- Check the result.
SELECT ticket_id, booking_id, ticket_number,
       TO_CHAR(issued_at, 'YYYY-MM-DD HH24:MI') AS issued_at,
       TO_CHAR(valid_from + INTERVAL '6' HOUR, 'YYYY-MM-DD HH24:MI') AS valid_until,
       CASE
           WHEN demo_active = 'Y' THEN 'ACTIVE (DEMO)'
           WHEN SYSDATE < valid_from + INTERVAL '6' HOUR THEN 'ACTIVE'
           ELSE 'EXPIRED'
       END AS validity
FROM (
    SELECT t.*,
           GREATEST(t.issued_at, TRUNC(b.travel_date) +
                    (r.departure_time - TRUNC(r.departure_time))) AS valid_from
    FROM tickets t
    JOIN bookings b ON b.booking_id = t.booking_id
    JOIN routes r ON r.route_id = b.route_id
)
ORDER BY ticket_id;
