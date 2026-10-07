package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.BookingHistory;
import com.busticket.model.Route;
import com.busticket.model.Ticket;
import com.busticket.util.QrCodeGenerator;
import com.busticket.util.TicketValidity;

import com.google.zxing.WriterException;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDateTime;

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
            BookingHistory booking = databaseOperations.getBookingHistoryById(userId, bookingId);
            Ticket ticket = databaseOperations.getTicketByBookingId(bookingId);
            if (booking == null || ticket == null) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Ticket not found.");
                return;
            }

            // The QR code is only shown while the ticket is inside its 6-hour window.
            Route route = databaseOperations.getRouteById(booking.getRouteId());
            LocalDateTime validUntil = TicketValidity.validUntil(ticket.getIssuedAt(),
                    booking.getTravelDate(), route == null ? null : route.getDepartureTime());
            if (!"VALID".equalsIgnoreCase(ticket.getTicketStatus())
                    || TicketValidity.isExpired(validUntil)) {
                response.sendError(HttpServletResponse.SC_GONE, "This ticket has expired.");
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
