package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.BookingHistory;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

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
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(toJson(history));
        } catch (SQLException exception) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Travel history could not be loaded.");
        }
    }

    private String toJson(List<BookingHistory> history) {
        StringBuilder json = new StringBuilder("[");
        for (int index = 0; index < history.size(); index++) {
            if (index > 0) json.append(',');
            BookingHistory item = history.get(index);
            json.append("{\"bookingId\":").append(item.getBookingId())
                    .append(",\"bookingDate\":").append(quote(String.valueOf(item.getBookingDate())))
                    .append(",\"travelDate\":").append(quote(String.valueOf(item.getTravelDate())))
                    .append(",\"source\":").append(quote(item.getSource()))
                    .append(",\"destination\":").append(quote(item.getDestination()))
                    .append(",\"passengerCount\":").append(item.getPassengerCount())
                    .append(",\"totalFare\":").append(item.getTotalFare())
                    .append(",\"status\":").append(quote(item.getBookingStatus()))
                    .append('}');
        }
        return json.append(']').toString();
    }

    private String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
