package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.Booking;
import com.busticket.model.Invoice;
import com.busticket.model.Route;
import com.busticket.model.Ticket;
import com.busticket.util.TicketValidity;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/** Creates a booking, ticket, and invoice for the logged-in user. */
public class BookingServlet extends HttpServlet {

    private final DatabaseOperations databaseOperations = new DatabaseOperations();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            response.sendRedirect(request.getContextPath() + "/login.html?error=login-required");
            return;
        }

        try {
            long userId = (Long) session.getAttribute("userId");
            long routeId = parseLong(request.getParameter("routeId"), "Invalid route.");
            int passengerCount = parsePassengerCount(request.getParameter("passengerCount"));
            LocalDate travelDate = parseTravelDate(request.getParameter("travelDate"));
            String paymentMethod = value(request.getParameter("paymentMethod"));
            validatePaymentMethod(paymentMethod);

            Route route = databaseOperations.getRouteById(routeId);
            if (route == null || !"ACTIVE".equalsIgnoreCase(route.getRouteStatus())) {
                redirectError(request, response, "route-unavailable");
                return;
            }

            BigDecimal totalFare = route.getFare().multiply(BigDecimal.valueOf(passengerCount));
            String uniqueToken = UUID.randomUUID().toString();
            // SEAT_NUMBER is VARCHAR2(10) in Oracle: AUTO- plus five characters.
            String seatReference = "AUTO-" + uniqueToken.substring(0, 5).toUpperCase();
            String ticketNumber = "TKT-" + uniqueToken.substring(0, 12).toUpperCase();
            String invoiceNumber = "INV-" + uniqueToken.substring(0, 12).toUpperCase();

            Timestamp travelTimestamp = Timestamp.valueOf(travelDate.atStartOfDay());
            // Oracle DATE has no fractions of a second, so store whole seconds.
            Timestamp issuedAt = Timestamp.valueOf(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
            LocalDateTime validUntil = TicketValidity.validUntil(issuedAt, travelTimestamp,
                    route.getDepartureTime());

            Booking booking = new Booking(0, userId, routeId, null,
                    travelTimestamp, seatReference,
                    passengerCount, totalFare, "CONFIRMED");
            Ticket ticket = new Ticket(0, 0, ticketNumber,
                    createQrPayload(route, userId, passengerCount, totalFare, validUntil),
                    issuedAt, "VALID");
            Invoice invoice = new Invoice(0, 0, invoiceNumber, null, totalFare,
                    paymentMethod, "PAID");

            // One transaction prevents a booking without its ticket or invoice.
            databaseOperations.createCompleteBooking(booking, ticket, invoice);
            response.sendRedirect(request.getContextPath() + "/ticket.html?bookingId="
                    + booking.getBookingId());
        } catch (IllegalArgumentException exception) {
            redirectError(request, response, "invalid-booking");
        } catch (SQLException exception) {
            redirectError(request, response, "booking-failed");
        }
    }

    private String createQrPayload(Route route, long userId, int passengerCount,
                                   BigDecimal totalFare, LocalDateTime validUntil) {
        return "BOOKING_ID={BOOKING_ID};USER_ID=" + userId +
                ";ROUTE_ID=" + route.getRouteId() +
                ";SOURCE=" + route.getSourceLocation() +
                ";DESTINATION=" + route.getDestination() +
                ";PASSENGERS=" + passengerCount +
                ";FARE=" + totalFare +
                ";VALID_UNTIL=" + validUntil;
    }

    private int parsePassengerCount(String value) {
        try {
            int count = Integer.parseInt(value);
            if (count < 1 || count > 6) throw new NumberFormatException();
            return count;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Passenger count must be between 1 and 6.");
        }
    }

    private long parseLong(String value, String message) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(message);
        }
    }

    private LocalDate parseTravelDate(String value) {
        try {
            if (value == null || value.isBlank()) {
                throw new IllegalArgumentException("Travel date is required.");
            }
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("Travel date is invalid.");
        }
    }

    private void validatePaymentMethod(String paymentMethod) {
        if (!paymentMethod.equals("UPI") && !paymentMethod.equals("CARD")
                && !paymentMethod.equals("CASH")) {
            throw new IllegalArgumentException("Payment method is invalid.");
        }
    }

    private String value(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    private void redirectError(HttpServletRequest request, HttpServletResponse response,
                               String error) throws IOException {
        response.sendRedirect(request.getContextPath() + "/booking.html?error=" + error);
    }
}
