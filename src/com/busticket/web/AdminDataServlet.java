package com.busticket.web;

import com.busticket.DatabaseOperations;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;

/**
 * Read-only JSON data for the admin pages.
 *
 * GET /admin-data?view=summary   overview counts and revenue
 * GET /admin-data?view=bookings  recent bookings with passenger details
 * GET /admin-data?view=users     registered passenger accounts
 * GET /admin-data?view=reports   summary plus the busiest routes
 */
public class AdminDataServlet extends HttpServlet {

    private static final int BOOKING_LIMIT = 200;
    private static final int USER_LIMIT = 500;
    private static final int TOP_ROUTE_LIMIT = 10;
    private final DatabaseOperations databaseOperations = new DatabaseOperations();

    /** Return the requested admin view as JSON. */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // AuthFilter already checks this; checking again keeps the servlet safe
        // even if the filter mapping is changed later.
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("adminId") == null) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Please log in as admin.");
            return;
        }

        String view = request.getParameter("view") == null ? "summary" : request.getParameter("view");
        try {
            String data = switch (view) {
                case "summary" -> AdminJson.summary(databaseOperations.getAdminSummary());
                case "bookings" -> AdminJson.bookings(databaseOperations.getRecentBookings(BOOKING_LIMIT));
                case "users" -> AdminJson.users(databaseOperations.getUserAccounts(USER_LIMIT));
                case "reports" -> "{\"summary\":" + AdminJson.summary(databaseOperations.getAdminSummary())
                        + ",\"topRoutes\":" + AdminJson.routeReports(databaseOperations.getTopRoutes(TOP_ROUTE_LIMIT))
                        + "}";
                default -> null;
            };
            if (data == null) {
                writeError(response, HttpServletResponse.SC_BAD_REQUEST, "Unknown admin view.");
                return;
            }
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"success\":true,\"data\":" + data + "}");
        } catch (SQLException exception) {
            log("Admin data could not be loaded.", exception);
            writeError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Admin data could not be loaded from the database.");
        }
    }

    private void writeError(HttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":" + AdminJson.quote(message) + "}");
    }
}
