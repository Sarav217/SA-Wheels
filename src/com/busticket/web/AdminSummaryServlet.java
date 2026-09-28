package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.BookingHistory;
import com.busticket.model.DashboardSummary;
import com.busticket.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

/** Returns live totals, recent bookings, and passengers for the admin dashboard. */
public class AdminSummaryServlet extends HttpServlet {

    private static final int RECENT_BOOKING_LIMIT = 10;
    private final DatabaseOperations databaseOperations = new DatabaseOperations();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("adminId") == null) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "Administrator login is required.");
            return;
        }

        try {
            DashboardSummary summary = databaseOperations.getDashboardSummary();
            List<BookingHistory> bookings = databaseOperations.getRecentBookings(RECENT_BOOKING_LIMIT);
            List<User> users = databaseOperations.getPassengerUsers();

            StringBuilder json = new StringBuilder("{");
            json.append("\"summary\":{")
                    .append("\"totalRoutes\":").append(summary.getTotalRoutes())
                    .append(",\"activeRoutes\":").append(summary.getActiveRoutes())
                    .append(",\"totalBookings\":").append(summary.getTotalBookings())
                    .append(",\"totalUsers\":").append(summary.getTotalUsers())
                    .append(",\"revenue\":").append(summary.getRevenue())
                    .append("},");

            json.append("\"recentBookings\":[");
            for (int index = 0; index < bookings.size(); index++) {
                if (index > 0) json.append(',');
                BookingHistory item = bookings.get(index);
                json.append("{\"bookingId\":").append(item.getBookingId())
                        .append(",\"passengerName\":").append(RouteJson.quote(item.getUserName()))
                        .append(",\"routeNumber\":").append(RouteJson.quote(item.getRouteNumber()))
                        .append(",\"source\":").append(RouteJson.quote(item.getSource()))
                        .append(",\"destination\":").append(RouteJson.quote(item.getDestination()))
                        .append(",\"travelDate\":").append(RouteJson.quote(String.valueOf(item.getTravelDate())))
                        .append(",\"passengerCount\":").append(item.getPassengerCount())
                        .append(",\"totalFare\":").append(item.getTotalFare())
                        .append(",\"status\":").append(RouteJson.quote(item.getBookingStatus()))
                        .append('}');
            }
            json.append("],");

            // Passwords are intentionally left out of this response.
            json.append("\"users\":[");
            for (int index = 0; index < users.size(); index++) {
                if (index > 0) json.append(',');
                User user = users.get(index);
                json.append("{\"userId\":").append(user.getUserId())
                        .append(",\"fullName\":").append(RouteJson.quote(user.getFullName()))
                        .append(",\"email\":").append(RouteJson.quote(user.getEmail()))
                        .append(",\"phoneNumber\":").append(RouteJson.quote(user.getPhoneNumber()))
                        .append(",\"createdAt\":").append(RouteJson.quote(String.valueOf(user.getCreatedAt())))
                        .append(",\"status\":").append(RouteJson.quote(user.getUserStatus()))
                        .append('}');
            }
            json.append("]}");

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(json.toString());
        } catch (SQLException exception) {
            writeError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Dashboard data could not be loaded from the database.");
        }
    }

    private void writeError(HttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
