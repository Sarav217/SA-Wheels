package com.busticket.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

/** A booking with passenger details, shown on the admin "View Bookings" page. */
public class AdminBooking extends BookingHistory {

    private final String passengerName;
    private final String passengerEmail;
    private final String seatNumber;

    public AdminBooking(long bookingId, long userId, long routeId, String routeNumber,
                        String source, String destination, Timestamp bookingDate,
                        Timestamp travelDate, int passengerCount, BigDecimal totalFare,
                        String bookingStatus, String passengerName, String passengerEmail,
                        String seatNumber) {
        super(bookingId, userId, routeId, routeNumber, source, destination, bookingDate,
                travelDate, passengerCount, totalFare, bookingStatus);
        this.passengerName = passengerName;
        this.passengerEmail = passengerEmail;
        this.seatNumber = seatNumber;
    }

    public String getPassengerName() { return passengerName; }
    public String getPassengerEmail() { return passengerEmail; }
    public String getSeatNumber() { return seatNumber; }
}
