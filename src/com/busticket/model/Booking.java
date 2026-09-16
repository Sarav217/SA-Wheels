package com.busticket.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

/** Represents a record from the BOOKINGS table. */
public class Booking {

    private long bookingId;
    private long userId;
    private long routeId;
    private Timestamp bookingDate;
    private Timestamp travelDate;
    private String seatNumber;
    private BigDecimal totalFare;
    private String bookingStatus;

    public Booking() {
    }

    public Booking(long bookingId, long userId, long routeId, Timestamp bookingDate,
                   Timestamp travelDate, String seatNumber, BigDecimal totalFare,
                   String bookingStatus) {
        this.bookingId = bookingId;
        this.userId = userId;
        this.routeId = routeId;
        this.bookingDate = bookingDate;
        this.travelDate = travelDate;
        this.seatNumber = seatNumber;
        this.totalFare = totalFare;
        this.bookingStatus = bookingStatus;
    }

    public long getBookingId() { return bookingId; }
    public void setBookingId(long bookingId) { this.bookingId = bookingId; }
    public long getUserId() { return userId; }
    public void setUserId(long userId) { this.userId = userId; }
    public long getRouteId() { return routeId; }
    public void setRouteId(long routeId) { this.routeId = routeId; }
    public Timestamp getBookingDate() { return bookingDate; }
    public void setBookingDate(Timestamp bookingDate) { this.bookingDate = bookingDate; }
    public Timestamp getTravelDate() { return travelDate; }
    public void setTravelDate(Timestamp travelDate) { this.travelDate = travelDate; }
    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }
    public BigDecimal getTotalFare() { return totalFare; }
    public void setTotalFare(BigDecimal totalFare) { this.totalFare = totalFare; }
    public String getBookingStatus() { return bookingStatus; }
    public void setBookingStatus(String bookingStatus) { this.bookingStatus = bookingStatus; }

    @Override
    public String toString() {
        return "Booking{" +
                "bookingId=" + bookingId +
                ", userId=" + userId +
                ", routeId=" + routeId +
                ", travelDate=" + travelDate +
                ", seatNumber='" + seatNumber + '\'' +
                ", totalFare=" + totalFare +
                ", bookingStatus='" + bookingStatus + '\'' +
                '}';
    }
}
