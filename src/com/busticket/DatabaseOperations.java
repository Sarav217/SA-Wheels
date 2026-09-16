package com.busticket;

import com.busticket.model.Admin;
import com.busticket.model.Booking;
import com.busticket.model.Invoice;
import com.busticket.model.Route;
import com.busticket.model.Ticket;
import com.busticket.model.User;
import database.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Contains the basic JDBC operations for the project.
 *
 * This class intentionally keeps the first database module simple. Later
 * modules can call these methods without duplicating connection code.
 */
public class DatabaseOperations {

    /** Add a user and return the record loaded with its generated ID. */
    public User addUser(User user) throws SQLException {
        String sql = "INSERT INTO users " +
                "(full_name, email, password, phone_number) VALUES (?, ?, ?, ?)";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, user.getFullName());
            statement.setString(2, user.getEmail());
            statement.setString(3, user.getPassword());
            statement.setString(4, user.getPhoneNumber());
            statement.executeUpdate();
        } catch (SQLException exception) {
            throw new SQLException("Could not add the user.", exception);
        }

        return findUserByEmail(user.getEmail());
    }

    /** Find a user using the unique email column. */
    public User findUserByEmail(String email) throws SQLException {
        String sql = "SELECT user_id, full_name, email, password, phone_number, " +
                "created_at, user_status FROM users WHERE LOWER(email) = LOWER(?)";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, email);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? mapUser(resultSet) : null;
            }
        } catch (SQLException exception) {
            throw new SQLException("Could not find a user by email.", exception);
        }
    }

    /**
     * Find an admin using the related user's email as the username.
     * The current ADMIN table does not have a separate username column.
     */
    public Admin findAdminByUsername(String username) throws SQLException {
        String sql = "SELECT a.admin_id, a.user_id, a.admin_role, a.created_at " +
                "FROM admin a JOIN users u ON u.user_id = a.user_id " +
                "WHERE LOWER(u.email) = LOWER(?)";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, username);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? mapAdmin(resultSet) : null;
            }
        } catch (SQLException exception) {
            throw new SQLException("Could not find an admin by username.", exception);
        }
    }

    /** Read all route records from the ROUTES table. */
    public List<Route> getAllRoutes() throws SQLException {
        String sql = "SELECT route_id, route_number, source_location, destination, " +
                "departure_time, arrival_time, fare, route_status FROM routes " +
                "ORDER BY route_id";
        List<Route> routes = new ArrayList<>();

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                routes.add(mapRoute(resultSet));
            }
            return routes;
        } catch (SQLException exception) {
            throw new SQLException("Could not load routes.", exception);
        }
    }

    /** Search routes using the source and destination entered by the user. */
    public List<Route> searchRoutes(String source, String destination) throws SQLException {
        String sql = "SELECT route_id, route_number, source_location, destination, " +
                "departure_time, arrival_time, fare, route_status FROM routes " +
                "WHERE LOWER(source_location) = LOWER(?) " +
                "AND LOWER(destination) = LOWER(?) ORDER BY route_id";
        List<Route> routes = new ArrayList<>();

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, source);
            statement.setString(2, destination);
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    routes.add(mapRoute(resultSet));
                }
            }
            return routes;
        } catch (SQLException exception) {
            throw new SQLException("Could not search routes.", exception);
        }
    }

    /** Add a booking and return it with the generated booking ID. */
    public Booking addBooking(Booking booking) throws SQLException {
        String sql = "INSERT INTO bookings " +
                "(user_id, route_id, travel_date, seat_number, total_fare, booking_status) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql, new String[]{"BOOKING_ID"})) {
            statement.setLong(1, booking.getUserId());
            statement.setLong(2, booking.getRouteId());
            statement.setTimestamp(3, booking.getTravelDate());
            statement.setString(4, booking.getSeatNumber());
            statement.setBigDecimal(5, booking.getTotalFare());
            statement.setString(6, defaultValue(booking.getBookingStatus(), "CONFIRMED"));
            statement.executeUpdate();
            booking.setBookingId(getGeneratedId(statement));
            return getBookingById(booking.getBookingId());
        } catch (SQLException exception) {
            throw new SQLException("Could not add the booking.", exception);
        }
    }

    /** Find one booking by its primary key. */
    public Booking getBookingById(long bookingId) throws SQLException {
        String sql = "SELECT booking_id, user_id, route_id, booking_date, travel_date, " +
                "seat_number, total_fare, booking_status FROM bookings WHERE booking_id = ?";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, bookingId);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? mapBooking(resultSet) : null;
            }
        } catch (SQLException exception) {
            throw new SQLException("Could not find the booking.", exception);
        }
    }

    /** Add a ticket and return it with the generated ticket ID. */
    public Ticket addTicket(Ticket ticket) throws SQLException {
        String sql = "INSERT INTO tickets " +
                "(booking_id, ticket_number, qr_code, ticket_status) VALUES (?, ?, ?, ?)";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql, new String[]{"TICKET_ID"})) {
            statement.setLong(1, ticket.getBookingId());
            statement.setString(2, ticket.getTicketNumber());
            statement.setString(3, ticket.getQrCode());
            statement.setString(4, defaultValue(ticket.getTicketStatus(), "VALID"));
            statement.executeUpdate();
            ticket.setTicketId(getGeneratedId(statement));
            return getTicketByBookingId(ticket.getBookingId());
        } catch (SQLException exception) {
            throw new SQLException("Could not add the ticket.", exception);
        }
    }

    /** Find the ticket belonging to one booking. */
    public Ticket getTicketByBookingId(long bookingId) throws SQLException {
        String sql = "SELECT ticket_id, booking_id, ticket_number, qr_code, issued_at, " +
                "ticket_status FROM tickets WHERE booking_id = ?";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, bookingId);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? mapTicket(resultSet) : null;
            }
        } catch (SQLException exception) {
            throw new SQLException("Could not find the ticket.", exception);
        }
    }

    /** Add an invoice and return it with the generated invoice ID. */
    public Invoice addInvoice(Invoice invoice) throws SQLException {
        String sql = "INSERT INTO invoices " +
                "(booking_id, invoice_number, amount, payment_method, payment_status) " +
                "VALUES (?, ?, ?, ?, ?)";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql, new String[]{"INVOICE_ID"})) {
            statement.setLong(1, invoice.getBookingId());
            statement.setString(2, invoice.getInvoiceNumber());
            statement.setBigDecimal(3, invoice.getAmount());
            statement.setString(4, invoice.getPaymentMethod());
            statement.setString(5, defaultValue(invoice.getPaymentStatus(), "PAID"));
            statement.executeUpdate();
            invoice.setInvoiceId(getGeneratedId(statement));
            return getInvoiceByBookingId(invoice.getBookingId());
        } catch (SQLException exception) {
            throw new SQLException("Could not add the invoice.", exception);
        }
    }

    /** Find the invoice belonging to one booking. */
    public Invoice getInvoiceByBookingId(long bookingId) throws SQLException {
        String sql = "SELECT invoice_id, booking_id, invoice_number, invoice_date, amount, " +
                "payment_method, payment_status FROM invoices WHERE booking_id = ?";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, bookingId);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? mapInvoice(resultSet) : null;
            }
        } catch (SQLException exception) {
            throw new SQLException("Could not find the invoice.", exception);
        }
    }

    private long getGeneratedId(PreparedStatement statement) throws SQLException {
        try (ResultSet generatedKeys = statement.getGeneratedKeys()) {
            if (generatedKeys.next()) {
                return generatedKeys.getLong(1);
            }
        }
        throw new SQLException("The database did not return a generated ID.");
    }

    private String defaultValue(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }

    private User mapUser(ResultSet resultSet) throws SQLException {
        return new User(
                resultSet.getLong("user_id"),
                resultSet.getString("full_name"),
                resultSet.getString("email"),
                resultSet.getString("password"),
                resultSet.getString("phone_number"),
                resultSet.getTimestamp("created_at"),
                resultSet.getString("user_status"));
    }

    private Admin mapAdmin(ResultSet resultSet) throws SQLException {
        return new Admin(
                resultSet.getLong("admin_id"),
                resultSet.getLong("user_id"),
                resultSet.getString("admin_role"),
                resultSet.getTimestamp("created_at"));
    }

    private Route mapRoute(ResultSet resultSet) throws SQLException {
        return new Route(
                resultSet.getLong("route_id"),
                resultSet.getString("route_number"),
                resultSet.getString("source_location"),
                resultSet.getString("destination"),
                resultSet.getTimestamp("departure_time"),
                resultSet.getTimestamp("arrival_time"),
                resultSet.getBigDecimal("fare"),
                resultSet.getString("route_status"));
    }

    private Booking mapBooking(ResultSet resultSet) throws SQLException {
        return new Booking(
                resultSet.getLong("booking_id"),
                resultSet.getLong("user_id"),
                resultSet.getLong("route_id"),
                resultSet.getTimestamp("booking_date"),
                resultSet.getTimestamp("travel_date"),
                resultSet.getString("seat_number"),
                resultSet.getBigDecimal("total_fare"),
                resultSet.getString("booking_status"));
    }

    private Ticket mapTicket(ResultSet resultSet) throws SQLException {
        return new Ticket(
                resultSet.getLong("ticket_id"),
                resultSet.getLong("booking_id"),
                resultSet.getString("ticket_number"),
                resultSet.getString("qr_code"),
                resultSet.getTimestamp("issued_at"),
                resultSet.getString("ticket_status"));
    }

    private Invoice mapInvoice(ResultSet resultSet) throws SQLException {
        return new Invoice(
                resultSet.getLong("invoice_id"),
                resultSet.getLong("booking_id"),
                resultSet.getString("invoice_number"),
                resultSet.getTimestamp("invoice_date"),
                resultSet.getBigDecimal("amount"),
                resultSet.getString("payment_method"),
                resultSet.getString("payment_status"));
    }
}
