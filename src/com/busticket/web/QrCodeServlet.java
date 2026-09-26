package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.Ticket;
import com.busticket.util.QrCodeGenerator;

import com.google.zxing.WriterException;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;

/** Streams a QR PNG for a ticket owned by the logged-in user. */
public class QrCodeServlet extends HttpServlet {

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
            long bookingId = Long.parseLong(request.getParameter("bookingId"));
            long userId = (Long) session.getAttribute("userId");
            if (databaseOperations.getBookingHistoryById(userId, bookingId) == null) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Ticket not found.");
                return;
            }
            Ticket ticket = databaseOperations.getTicketByBookingId(bookingId);
            if (ticket == null) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Ticket not found.");
                return;
            }

            response.setContentType("image/png");
            response.setHeader("Cache-Control", "no-store");
            QrCodeGenerator.writePng(ticket.getQrCode(), response.getOutputStream());
        } catch (NumberFormatException exception) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Booking ID is invalid.");
        } catch (SQLException | WriterException exception) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "QR code could not be generated.");
        }
    }
}
