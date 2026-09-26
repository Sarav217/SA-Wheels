package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.BookingHistory;
import com.busticket.model.Invoice;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;

/** Returns one invoice only when it belongs to the logged-in user. */
public class InvoiceServlet extends HttpServlet {

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
            Invoice invoice = databaseOperations.getInvoiceByBookingId(bookingId);
            if (booking == null || invoice == null) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Invoice not found.");
                return;
            }

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{" +
                    "\"bookingId\":" + booking.getBookingId() + "," +
                    "\"invoiceNumber\":" + quote(invoice.getInvoiceNumber()) + "," +
                    "\"invoiceDate\":" + quote(String.valueOf(invoice.getInvoiceDate())) + "," +
                    "\"passengerCount\":" + booking.getPassengerCount() + "," +
                    "\"passengerName\":" + quote(String.valueOf(session.getAttribute("userName"))) + "," +
                    "\"route\":" + quote(booking.getRouteNumber()) + "," +
                    "\"amount\":" + invoice.getAmount() + "," +
                    "\"paymentMethod\":" + quote(invoice.getPaymentMethod()) + "," +
                    "\"paymentStatus\":" + quote(invoice.getPaymentStatus()) +
                    "}");
        } catch (NumberFormatException exception) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Booking ID is invalid.");
        } catch (SQLException exception) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Invoice could not be loaded.");
        }
    }

    private String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
