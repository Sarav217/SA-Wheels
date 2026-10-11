package com.busticket.util;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Works out how long a ticket and its QR code can be used.
 * The six hours start at the bus departure on the travel date, or at the
 * booking time when the ticket is bought after the bus has already left.
 */
public final class TicketValidity {

    public static final Duration VALID_FOR = Duration.ofHours(6);

    private TicketValidity() {
    }

    public static LocalDateTime validUntil(Timestamp issuedAt, Timestamp travelDate,
                                           Timestamp departureTime) {
        LocalDateTime issued = issuedAt == null ? LocalDateTime.now() : issuedAt.toLocalDateTime();
        LocalDateTime departure = travelDate.toLocalDateTime().toLocalDate().atStartOfDay();
        if (departureTime != null) {
            departure = departure.toLocalDate().atTime(departureTime.toLocalDateTime().toLocalTime());
        }
        LocalDateTime validFrom = issued.isAfter(departure) ? issued : departure;
        return validFrom.plus(VALID_FOR);
    }

    public static boolean isExpired(LocalDateTime validUntil) {
        return LocalDateTime.now().isAfter(validUntil);
    }
}
