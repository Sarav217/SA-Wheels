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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Returns the logged-in user's booking history as simple JSON. */
public class TravelHistoryServlet extends HttpServlet {

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
            List<BookingHistory> history = databaseOperations.getBookingHistoryByUserId(userId);
            Map<Long, Ticket> tickets = new HashMap<>();
            for (Ticket ticket : databaseOperations.getTicketsByUserId(userId)) {
                tickets.put(ticket.getBookingId(), ticket);
            }
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(toJson(history, tickets));
        } catch (SQLException exception) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Travel history could not be loaded.");
        }
    }

    /** Builds the history JSON; ticketState is ACTIVE, EXPIRED, CANCELLED, USED or NONE. */
    private String toJson(List<BookingHistory> history, Map<Long, Ticket> tickets) {
        StringBuilder json = new StringBuilder("[");
        for (int index = 0; index < history.size(); index++) {
            if (index > 0) json.append(',');
            BookingHistory item = history.get(index);
            Ticket ticket = tickets.get(item.getBookingId());
            String ticketState = ticket == null ? "NONE" : ticket.getValidityState(item.getBookingStatus());
            json.append("{\"bookingId\":").append(item.getBookingId())
                    .append(",\"bookingDate\":").append(quote(String.valueOf(item.getBookingDate())))
                    .append(",\"travelDate\":").append(quote(String.valueOf(item.getTravelDate())))
                    .append(",\"source\":").append(quote(item.getSource()))
                    .append(",\"destination\":").append(quote(item.getDestination()))
                    .append(",\"passengerCount\":").append(item.getPassengerCount())
                    .append(",\"totalFare\":").append(item.getTotalFare())
                    .append(",\"status\":").append(quote(item.getBookingStatus()))
                    .append(",\"ticketState\":").append(quote(ticketState))
                    .append(",\"demoActive\":").append(ticket != null && ticket.isDemoActive())
                    .append('}');
        }
        return json.append(']').toString();
    }

    private String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
