-- Connecting sample routes for the "Connecting routes" search feature.
-- Each route starts where an existing sample route ends, so journeys such as
-- Chennai Central -> Tambaram -> Guindy -> Adyar can be found with changes.
-- MERGE keeps the script safe to run more than once.

MERGE INTO routes target
USING (
    SELECT 'R601' route_number, 'Tambaram' source_location, 'Guindy' destination,
           TO_DATE('2026-01-01 07:50', 'YYYY-MM-DD HH24:MI') departure_time,
           TO_DATE('2026-01-01 08:40', 'YYYY-MM-DD HH24:MI') arrival_time, 30.00 fare FROM dual
    UNION ALL
    SELECT 'R602', 'Guindy', 'Adyar',
           TO_DATE('2026-01-01 09:00', 'YYYY-MM-DD HH24:MI'),
           TO_DATE('2026-01-01 09:30', 'YYYY-MM-DD HH24:MI'), 20.00 FROM dual
    UNION ALL
    SELECT 'R603', 'Koyambedu', 'Chennai Central',
           TO_DATE('2026-01-01 05:45', 'YYYY-MM-DD HH24:MI'),
           TO_DATE('2026-01-01 06:15', 'YYYY-MM-DD HH24:MI'), 20.00 FROM dual
    UNION ALL
    SELECT 'R604', 'Anna Nagar', 'Koyambedu',
           TO_DATE('2026-01-01 06:40', 'YYYY-MM-DD HH24:MI'),
           TO_DATE('2026-01-01 07:00', 'YYYY-MM-DD HH24:MI'), 15.00 FROM dual
    UNION ALL
    SELECT 'R605', 'Adyar', 'Velachery',
           TO_DATE('2026-01-01 10:00', 'YYYY-MM-DD HH24:MI'),
           TO_DATE('2026-01-01 10:30', 'YYYY-MM-DD HH24:MI'), 18.00 FROM dual
    UNION ALL
    SELECT 'R606', 'T Nagar', 'Guindy',
           TO_DATE('2026-01-01 08:10', 'YYYY-MM-DD HH24:MI'),
           TO_DATE('2026-01-01 08:40', 'YYYY-MM-DD HH24:MI'), 15.00 FROM dual
) source
ON (target.route_number = source.route_number)
WHEN NOT MATCHED THEN
    INSERT (route_number, source_location, destination, departure_time, arrival_time, fare)
    VALUES (source.route_number, source.source_location, source.destination,
            source.departure_time, source.arrival_time, source.fare);

COMMIT;

-- Example journeys after running this script:
--   Anna Nagar -> Guindy      : R604 + R201 (change at Koyambedu)
--   Chennai Central -> Guindy : R101 + R601 (change at Tambaram)
--   Chennai Central -> Adyar  : R101 + R601 + R602 (changes at Tambaram, Guindy)
--   Koyambedu -> Adyar        : R201 + R602 (change at Guindy)
--   T Nagar -> Velachery      : R402 direct, plus R606 + R602 + R605
