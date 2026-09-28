package com.busticket.model;

import java.math.BigDecimal;

/** Simple totals shown on the admin dashboard. */
public class DashboardSummary {

    private long totalRoutes;
    private long activeRoutes;
    private long totalBookings;
    private long totalUsers;
    private BigDecimal revenue;

    public DashboardSummary(long totalRoutes, long activeRoutes, long totalBookings,
                            long totalUsers, BigDecimal revenue) {
        this.totalRoutes = totalRoutes;
        this.activeRoutes = activeRoutes;
        this.totalBookings = totalBookings;
        this.totalUsers = totalUsers;
        this.revenue = revenue;
    }

    public long getTotalRoutes() { return totalRoutes; }
    public long getActiveRoutes() { return activeRoutes; }
    public long getTotalBookings() { return totalBookings; }
    public long getTotalUsers() { return totalUsers; }
    public BigDecimal getRevenue() { return revenue; }
}
