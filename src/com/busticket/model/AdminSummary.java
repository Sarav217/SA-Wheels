package com.busticket.model;

import java.math.BigDecimal;

/** Totals shown on the admin dashboard and the reports page. */
public class AdminSummary {

    private final int totalUsers;
    private final int activeUsers;
    private final int totalRoutes;
    private final int activeRoutes;
    private final int totalBookings;
    private final int confirmedBookings;
    private final int pendingBookings;
    private final int cancelledBookings;
    private final int totalPassengers;
    private final BigDecimal revenue;

    public AdminSummary(int totalUsers, int activeUsers, int totalRoutes, int activeRoutes,
                        int totalBookings, int confirmedBookings, int pendingBookings,
                        int cancelledBookings, int totalPassengers, BigDecimal revenue) {
        this.totalUsers = totalUsers;
        this.activeUsers = activeUsers;
        this.totalRoutes = totalRoutes;
        this.activeRoutes = activeRoutes;
        this.totalBookings = totalBookings;
        this.confirmedBookings = confirmedBookings;
        this.pendingBookings = pendingBookings;
        this.cancelledBookings = cancelledBookings;
        this.totalPassengers = totalPassengers;
        this.revenue = revenue;
    }

    public int getTotalUsers() { return totalUsers; }
    public int getActiveUsers() { return activeUsers; }
    public int getTotalRoutes() { return totalRoutes; }
    public int getActiveRoutes() { return activeRoutes; }
    public int getTotalBookings() { return totalBookings; }
    public int getConfirmedBookings() { return confirmedBookings; }
    public int getPendingBookings() { return pendingBookings; }
    public int getCancelledBookings() { return cancelledBookings; }
    public int getTotalPassengers() { return totalPassengers; }
    public BigDecimal getRevenue() { return revenue; }
}
