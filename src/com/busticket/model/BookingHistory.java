package com.busticket.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

/** Joined booking and route details used by the user's travel history page. */
public class BookingHistory {

    private long bookingId;
    private long userId;
    private long routeId;
    private String routeNumber;
    private String source;
    private String destination;
    private Timestamp bookingDate;
    private Timestamp travelDate;
    private int passengerCount;
    private BigDecimal totalFare;
    private String bookingStatus;

    public BookingHistory(long bookingId, long userId, long routeId, String routeNumber,
                          String source, String destination, Timestamp bookingDate,
                          Timestamp travelDate, int passengerCount, BigDecimal totalFare,
                          String bookingStatus) {
        this.bookingId = bookingId;
        this.userId = userId;
        this.routeId = routeId;
        this.routeNumber = routeNumber;
        this.source = source;
        this.destination = destination;
        this.bookingDate = bookingDate;
        this.travelDate = travelDate;
        this.passengerCount = passengerCount;
        this.totalFare = totalFare;
        this.bookingStatus = bookingStatus;
    }

    public long getBookingId() { return bookingId; }
    public long getUserId() { return userId; }
    public long getRouteId() { return routeId; }
    public String getRouteNumber() { return routeNumber; }
    public String getSource() { return source; }
    public String getDestination() { return destination; }
    public Timestamp getBookingDate() { return bookingDate; }
    public Timestamp getTravelDate() { return travelDate; }
    public int getPassengerCount() { return passengerCount; }
    public BigDecimal getTotalFare() { return totalFare; }
    public String getBookingStatus() { return bookingStatus; }
}
