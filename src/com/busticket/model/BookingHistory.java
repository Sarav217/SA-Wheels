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
    private Timestamp departureTime;
    private Timestamp arrivalTime;
    // Filled only by the admin booking list, which joins the USERS table.
    private String userName;

    public BookingHistory(long bookingId, long userId, long routeId, String routeNumber,
                          String source, String destination, Timestamp bookingDate,
                          Timestamp travelDate, int passengerCount, BigDecimal totalFare,
                          String bookingStatus, Timestamp departureTime, Timestamp arrivalTime) {
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
        this.departureTime = departureTime;
        this.arrivalTime = arrivalTime;
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
    public Timestamp getDepartureTime() { return departureTime; }
    public Timestamp getArrivalTime() { return arrivalTime; }
    public String getUserName() { return userName; }

    public void setUserName(String userName) { this.userName = userName; }
}
