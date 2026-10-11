package com.busticket.model;

import java.math.BigDecimal;

/** Booking totals for one route, used by the admin reports page. */
public class RouteReport {

    private final String routeNumber;
    private final String source;
    private final String destination;
    private final int bookings;
    private final int passengers;
    private final BigDecimal revenue;

    public RouteReport(String routeNumber, String source, String destination,
                       int bookings, int passengers, BigDecimal revenue) {
        this.routeNumber = routeNumber;
        this.source = source;
        this.destination = destination;
        this.bookings = bookings;
        this.passengers = passengers;
        this.revenue = revenue;
    }

    public String getRouteNumber() { return routeNumber; }
    public String getSource() { return source; }
    public String getDestination() { return destination; }
    public int getBookings() { return bookings; }
    public int getPassengers() { return passengers; }
    public BigDecimal getRevenue() { return revenue; }
}
