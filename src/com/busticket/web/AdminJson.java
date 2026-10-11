package com.busticket.web;

import com.busticket.model.AdminBooking;
import com.busticket.model.AdminSummary;
import com.busticket.model.RouteReport;
import com.busticket.model.UserAccount;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Function;

/** Small JSON writer for the admin pages, written without an extra library. */
final class AdminJson {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private AdminJson() {
    }

    /** Overview counts shown on the admin dashboard and reports page. */
    static String summary(AdminSummary summary) {
        return "{" +
                "\"totalUsers\":" + summary.getTotalUsers() + "," +
                "\"activeUsers\":" + summary.getActiveUsers() + "," +
                "\"totalRoutes\":" + summary.getTotalRoutes() + "," +
                "\"activeRoutes\":" + summary.getActiveRoutes() + "," +
                "\"totalBookings\":" + summary.getTotalBookings() + "," +
                "\"confirmedBookings\":" + summary.getConfirmedBookings() + "," +
                "\"pendingBookings\":" + summary.getPendingBookings() + "," +
                "\"cancelledBookings\":" + summary.getCancelledBookings() + "," +
                "\"totalPassengers\":" + summary.getTotalPassengers() + "," +
                "\"revenue\":" + number(summary.getRevenue()) +
                "}";
    }

    /** Booking rows with passenger, route, fare and status details. */
    static String bookings(List<AdminBooking> bookings) {
        return list(bookings, booking -> "{" +
                "\"bookingId\":" + booking.getBookingId() + "," +
                "\"passengerName\":" + quote(booking.getPassengerName()) + "," +
                "\"passengerEmail\":" + quote(booking.getPassengerEmail()) + "," +
                "\"routeNumber\":" + quote(booking.getRouteNumber()) + "," +
                "\"source\":" + quote(booking.getSource()) + "," +
                "\"destination\":" + quote(booking.getDestination()) + "," +
                "\"bookingDate\":" + quote(format(booking.getBookingDate(), DATE_TIME_FORMAT)) + "," +
                "\"travelDate\":" + quote(format(booking.getTravelDate(), DATE_FORMAT)) + "," +
                "\"seatNumber\":" + quote(booking.getSeatNumber()) + "," +
                "\"passengerCount\":" + booking.getPassengerCount() + "," +
                "\"totalFare\":" + number(booking.getTotalFare()) + "," +
                "\"status\":" + quote(booking.getBookingStatus()) +
                "}");
    }

    /** Registered passenger accounts. Passwords are never included. */
    static String users(List<UserAccount> users) {
        return list(users, user -> "{" +
                "\"userId\":" + user.getUserId() + "," +
                "\"fullName\":" + quote(user.getFullName()) + "," +
                "\"email\":" + quote(user.getEmail()) + "," +
                "\"phoneNumber\":" + quote(user.getPhoneNumber()) + "," +
                "\"createdAt\":" + quote(format(user.getCreatedAt(), DATE_FORMAT)) + "," +
                "\"status\":" + quote(user.getUserStatus()) + "," +
                "\"bookingCount\":" + user.getBookingCount() +
                "}");
    }

    /** Busiest routes for the reports page. */
    static String routeReports(List<RouteReport> reports) {
        return list(reports, report -> "{" +
                "\"routeNumber\":" + quote(report.getRouteNumber()) + "," +
                "\"source\":" + quote(report.getSource()) + "," +
                "\"destination\":" + quote(report.getDestination()) + "," +
                "\"bookings\":" + report.getBookings() + "," +
                "\"passengers\":" + report.getPassengers() + "," +
                "\"revenue\":" + number(report.getRevenue()) +
                "}");
    }

    private static <T> String list(List<T> items, Function<T, String> writer) {
        StringBuilder json = new StringBuilder("[");
        for (int index = 0; index < items.size(); index++) {
            if (index > 0) {
                json.append(',');
            }
            json.append(writer.apply(items.get(index)));
        }
        return json.append(']').toString();
    }

    private static String format(Timestamp timestamp, DateTimeFormatter formatter) {
        return timestamp == null ? null : timestamp.toLocalDateTime().format(formatter);
    }

    private static String number(BigDecimal value) {
        return value == null ? "0" : value.toPlainString();
    }

    /** Quote a string for JSON, escaping quotes, backslashes and control characters. */
    static String quote(String value) {
        if (value == null) {
            return "null";
        }
        StringBuilder json = new StringBuilder("\"");
        for (char character : value.toCharArray()) {
            switch (character) {
                case '"' -> json.append("\\\"");
                case '\\' -> json.append("\\\\");
                case '\n' -> json.append("\\n");
                case '\r' -> json.append("\\r");
                case '\t' -> json.append("\\t");
                default -> {
                    if (character < 0x20) {
                        json.append(String.format("\\u%04x", (int) character));
                    } else {
                        json.append(character);
                    }
                }
            }
        }
        return json.append('"').toString();
    }
}
