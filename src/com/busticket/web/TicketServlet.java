package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.BookingHistory;
import com.busticket.model.Ticket;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;

/**
 * Returns one ticket only when it belongs to the logged-in user. The JSON
 * includes the 6-hour validity window and whether the ticket is still active.
 */
public class TicketServlet extends HttpServlet {

    private final DatabaseOperations databaseOperations = new DatabaseOperations();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Login is required.");
            return;
        }

        try {
            long userId = (Long) session.getAttribute("userId");
            long bookingId = Long.parseLong(request.getParameter("bookingId"));
            BookingHistory booking = databaseOperations.getBookingHistoryById(userId, bookingId);
            Ticket ticket = databaseOperations.getTicketByBookingId(bookingId);
            if (booking == null || ticket == null) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Ticket not found.");
                return;
            }

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{" +
                    "\"bookingId\":" + booking.getBookingId() + "," +
                    "\"userId\":" + booking.getUserId() + "," +
                    "\"routeId\":" + booking.getRouteId() + "," +
                    "\"routeNumber\":" + quote(booking.getRouteNumber()) + "," +
                    "\"source\":" + quote(booking.getSource()) + "," +
                    "\"destination\":" + quote(booking.getDestination()) + "," +
                    "\"travelDate\":" + quote(String.valueOf(booking.getTravelDate())) + "," +
                    "\"passengerCount\":" + booking.getPassengerCount() + "," +
                    "\"totalFare\":" + booking.getTotalFare() + "," +
                    "\"status\":" + quote(booking.getBookingStatus()) + "," +
                    "\"ticketNumber\":" + quote(ticket.getTicketNumber()) + "," +
                    "\"issuedAt\":" + quote(formatTime(ticket.getIssuedAt())) + "," +
                    "\"validUntil\":" + quote(formatTime(ticket.getValidUntil())) + "," +
                    "\"validityHours\":" + Ticket.VALIDITY_HOURS + "," +
                    "\"secondsLeft\":" + ticket.getSecondsLeft() + "," +
                    "\"demoActive\":" + ticket.isDemoActive() + "," +
                    "\"ticketState\":" + quote(ticket.getValidityState(booking.getBookingStatus())) +
                    "}");
        } catch (NumberFormatException exception) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Booking ID is invalid.");
        } catch (SQLException exception) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Ticket could not be loaded.");
        }
    }

    private String formatTime(Timestamp time) {
        return time == null ? "" : new SimpleDateFormat("yyyy-MM-dd HH:mm").format(time);
    }

    private String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
