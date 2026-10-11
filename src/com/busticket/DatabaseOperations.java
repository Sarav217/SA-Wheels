package com.busticket;

import com.busticket.model.Admin;
import com.busticket.model.AdminBooking;
import com.busticket.model.AdminSummary;
import com.busticket.model.Booking;
import com.busticket.model.BookingHistory;
import com.busticket.model.Invoice;
import com.busticket.model.Route;
import com.busticket.model.RouteReport;
import com.busticket.model.Ticket;
import com.busticket.model.User;
import com.busticket.model.UserAccount;
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
     * Find an admin by the ADMIN.USERNAME column (added by
     * database/06_admin_credentials.sql). The password hash is loaded so the
     * caller can verify it; it is never sent to the browser.
     */
    public Admin findAdminByUsername(String username) throws SQLException {
        String sql = "SELECT admin_id, user_id, admin_role, created_at, username, password_hash " +
                "FROM admin WHERE LOWER(username) = LOWER(?)";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, username);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return null;
                }
                Admin admin = mapAdmin(resultSet);
                admin.setUsername(resultSet.getString("username"));
                admin.setPasswordHash(resultSet.getString("password_hash"));
                return admin;
            }
        } catch (SQLException exception) {
            throw new SQLException("Could not find an admin by username.", exception);
        }
    }

    /** Count users, routes and bookings for the admin dashboard in one query. */
    public AdminSummary getAdminSummary() throws SQLException {
        // Admin accounts are excluded so "users" means registered passengers.
        String sql = "SELECT " +
                "(SELECT COUNT(*) FROM users u WHERE NOT EXISTS " +
                "  (SELECT 1 FROM admin a WHERE a.user_id = u.user_id)) total_users, " +
                "(SELECT COUNT(*) FROM users u WHERE u.user_status = 'ACTIVE' AND NOT EXISTS " +
                "  (SELECT 1 FROM admin a WHERE a.user_id = u.user_id)) active_users, " +
                "(SELECT COUNT(*) FROM routes) total_routes, " +
                "(SELECT COUNT(*) FROM routes WHERE route_status = 'ACTIVE') active_routes, " +
                "(SELECT COUNT(*) FROM bookings) total_bookings, " +
                "(SELECT COUNT(*) FROM bookings WHERE booking_status = 'CONFIRMED') confirmed_bookings, " +
                "(SELECT COUNT(*) FROM bookings WHERE booking_status = 'PENDING') pending_bookings, " +
                "(SELECT COUNT(*) FROM bookings WHERE booking_status = 'CANCELLED') cancelled_bookings, " +
                "(SELECT NVL(SUM(passenger_count), 0) FROM bookings " +
                "  WHERE booking_status <> 'CANCELLED') total_passengers, " +
                "(SELECT NVL(SUM(total_fare), 0) FROM bookings " +
                "  WHERE booking_status = 'CONFIRMED') revenue " +
                "FROM dual";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {
            resultSet.next();
            return new AdminSummary(
                    resultSet.getInt("total_users"),
                    resultSet.getInt("active_users"),
                    resultSet.getInt("total_routes"),
                    resultSet.getInt("active_routes"),
                    resultSet.getInt("total_bookings"),
                    resultSet.getInt("confirmed_bookings"),
                    resultSet.getInt("pending_bookings"),
                    resultSet.getInt("cancelled_bookings"),
                    resultSet.getInt("total_passengers"),
                    resultSet.getBigDecimal("revenue"));
        } catch (SQLException exception) {
            throw new SQLException("Could not load the admin summary.", exception);
        }
    }

    /** Load the most recent bookings with passenger and route details. */
    public List<AdminBooking> getRecentBookings(int limit) throws SQLException {
        String sql = "SELECT b.booking_id, b.user_id, b.route_id, r.route_number, " +
                "r.source_location, r.destination, b.booking_date, b.travel_date, " +
                "b.passenger_count, b.total_fare, b.booking_status, b.seat_number, " +
                "u.full_name, u.email " +
                "FROM bookings b " +
                "JOIN routes r ON r.route_id = b.route_id " +
                "JOIN users u ON u.user_id = b.user_id " +
                "ORDER BY b.booking_date DESC, b.booking_id DESC " +
                "FETCH FIRST ? ROWS ONLY";
        List<AdminBooking> bookings = new ArrayList<>();

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, limit);
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    bookings.add(new AdminBooking(
                            resultSet.getLong("booking_id"),
                            resultSet.getLong("user_id"),
                            resultSet.getLong("route_id"),
                            resultSet.getString("route_number"),
                            resultSet.getString("source_location"),
                            resultSet.getString("destination"),
                            resultSet.getTimestamp("booking_date"),
                            resultSet.getTimestamp("travel_date"),
                            resultSet.getInt("passenger_count"),
                            resultSet.getBigDecimal("total_fare"),
                            resultSet.getString("booking_status"),
                            resultSet.getString("full_name"),
                            resultSet.getString("email"),
                            resultSet.getString("seat_number")));
                }
            }
            return bookings;
        } catch (SQLException exception) {
            throw new SQLException("Could not load bookings.", exception);
        }
    }

    /** Load registered passenger accounts (not admins) with their booking counts. */
    public List<UserAccount> getUserAccounts(int limit) throws SQLException {
        String sql = "SELECT u.user_id, u.full_name, u.email, u.phone_number, u.created_at, " +
                "u.user_status, " +
                "(SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.user_id) booking_count " +
                "FROM users u " +
                "WHERE NOT EXISTS (SELECT 1 FROM admin a WHERE a.user_id = u.user_id) " +
                "ORDER BY u.created_at DESC, u.user_id DESC " +
                "FETCH FIRST ? ROWS ONLY";
        List<UserAccount> users = new ArrayList<>();

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, limit);
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    users.add(new UserAccount(
                            resultSet.getLong("user_id"),
                            resultSet.getString("full_name"),
                            resultSet.getString("email"),
                            resultSet.getString("phone_number"),
                            resultSet.getTimestamp("created_at"),
                            resultSet.getString("user_status"),
                            resultSet.getInt("booking_count")));
                }
            }
            return users;
        } catch (SQLException exception) {
            throw new SQLException("Could not load users.", exception);
        }
    }

    /** Booking totals per route, most booked first, for the reports page. */
    public List<RouteReport> getTopRoutes(int limit) throws SQLException {
        String sql = "SELECT r.route_number, r.source_location, r.destination, " +
                "COUNT(b.booking_id) bookings, NVL(SUM(b.passenger_count), 0) passengers, " +
                "NVL(SUM(b.total_fare), 0) revenue " +
                "FROM routes r JOIN bookings b ON b.route_id = r.route_id " +
                "WHERE b.booking_status <> 'CANCELLED' " +
                "GROUP BY r.route_number, r.source_location, r.destination " +
                "ORDER BY bookings DESC, revenue DESC " +
                "FETCH FIRST ? ROWS ONLY";
        List<RouteReport> reports = new ArrayList<>();

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, limit);
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    reports.add(new RouteReport(
                            resultSet.getString("route_number"),
                            resultSet.getString("source_location"),
                            resultSet.getString("destination"),
                            resultSet.getInt("bookings"),
                            resultSet.getInt("passengers"),
                            resultSet.getBigDecimal("revenue")));
                }
            }
            return reports;
        } catch (SQLException exception) {
            throw new SQLException("Could not load the route report.", exception);
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

    /** Add a route and return it with the generated route ID. */
    public Route addRoute(Route route) throws SQLException {
        String sql = "INSERT INTO routes " +
                "(route_number, source_location, destination, departure_time, " +
                "arrival_time, fare, route_status) VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql, new String[]{"ROUTE_ID"})) {
            statement.setString(1, route.getRouteNumber());
            statement.setString(2, route.getSourceLocation());
            statement.setString(3, route.getDestination());
            statement.setTimestamp(4, route.getDepartureTime());
            statement.setTimestamp(5, route.getArrivalTime());
            statement.setBigDecimal(6, route.getFare());
            statement.setString(7, defaultValue(route.getRouteStatus(), "ACTIVE"));
            statement.executeUpdate();
            route.setRouteId(getGeneratedId(statement));
            return getRouteById(route.getRouteId());
        } catch (SQLException exception) {
            throw new SQLException("Could not add the route.", exception);
        }
    }

    /** Update an existing route using its primary key. */
    public boolean updateRoute(Route route) throws SQLException {
        String sql = "UPDATE routes SET route_number = ?, source_location = ?, " +
                "destination = ?, departure_time = ?, arrival_time = ?, fare = ?, " +
                "route_status = ? WHERE route_id = ?";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, route.getRouteNumber());
            statement.setString(2, route.getSourceLocation());
            statement.setString(3, route.getDestination());
            statement.setTimestamp(4, route.getDepartureTime());
            statement.setTimestamp(5, route.getArrivalTime());
            statement.setBigDecimal(6, route.getFare());
            statement.setString(7, defaultValue(route.getRouteStatus(), "ACTIVE"));
            statement.setLong(8, route.getRouteId());
            return statement.executeUpdate() == 1;
        } catch (SQLException exception) {
            throw new SQLException("Could not update the route.", exception);
        }
    }

    /** Delete a route by ID. Foreign-key errors are returned to the caller. */
    public boolean deleteRoute(long routeId) throws SQLException {
        String sql = "DELETE FROM routes WHERE route_id = ?";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, routeId);
            return statement.executeUpdate() == 1;
        } catch (SQLException exception) {
            throw new SQLException("Could not delete the route. It may have related bookings.", exception);
        }
    }

    /** Find one route by its generated ID. */
    public Route getRouteById(long routeId) throws SQLException {
        String sql = "SELECT route_id, route_number, source_location, destination, " +
                "departure_time, arrival_time, fare, route_status FROM routes WHERE route_id = ?";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, routeId);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? mapRoute(resultSet) : null;
            }
        } catch (SQLException exception) {
            throw new SQLException("Could not find the route.", exception);
        }
    }

    /** Add a booking and return it with the generated booking ID. */
    public Booking addBooking(Booking booking) throws SQLException {
        String sql = "INSERT INTO bookings " +
                "(user_id, route_id, travel_date, seat_number, passenger_count, total_fare, booking_status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql, new String[]{"BOOKING_ID"})) {
            statement.setLong(1, booking.getUserId());
            statement.setLong(2, booking.getRouteId());
            statement.setTimestamp(3, booking.getTravelDate());
            statement.setString(4, booking.getSeatNumber());
            statement.setInt(5, booking.getPassengerCount());
            statement.setBigDecimal(6, booking.getTotalFare());
            statement.setString(7, defaultValue(booking.getBookingStatus(), "CONFIRMED"));
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
                "seat_number, passenger_count, total_fare, booking_status " +
                "FROM bookings WHERE booking_id = ?";

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

    /** Load a user's bookings together with the related route information. */
    public List<BookingHistory> getBookingHistoryByUserId(long userId) throws SQLException {
        String sql = "SELECT b.booking_id, b.user_id, b.route_id, r.route_number, " +
                "r.source_location, r.destination, b.booking_date, b.travel_date, " +
                "b.passenger_count, b.total_fare, b.booking_status " +
                "FROM bookings b JOIN routes r ON r.route_id = b.route_id " +
                "WHERE b.user_id = ? ORDER BY b.booking_date DESC";
        List<BookingHistory> history = new ArrayList<>();

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, userId);
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    history.add(mapBookingHistory(resultSet));
                }
            }
            return history;
        } catch (SQLException exception) {
            throw new SQLException("Could not load travel history.", exception);
        }
    }

    /** Load one booking only when it belongs to the logged-in user. */
    public BookingHistory getBookingHistoryById(long userId, long bookingId) throws SQLException {
        String sql = "SELECT b.booking_id, b.user_id, b.route_id, r.route_number, " +
                "r.source_location, r.destination, b.booking_date, b.travel_date, " +
                "b.passenger_count, b.total_fare, b.booking_status " +
                "FROM bookings b JOIN routes r ON r.route_id = b.route_id " +
                "WHERE b.user_id = ? AND b.booking_id = ?";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, userId);
            statement.setLong(2, bookingId);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? mapBookingHistory(resultSet) : null;
            }
        } catch (SQLException exception) {
            throw new SQLException("Could not load the booking details.", exception);
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

    /**
     * Ticket columns plus the validity window. The expiry time and the seconds
     * left are worked out by Oracle (SYSDATE) so they do not depend on the web
     * server's clock. The two ? parameters are the validity hours.
     */
    private static final String TICKET_COLUMNS =
            "t.ticket_id, t.booking_id, t.ticket_number, t.qr_code, t.issued_at, " +
            "t.ticket_status, t.demo_active, " +
            "t.issued_at + NUMTODSINTERVAL(?, 'HOUR') valid_until, " +
            "GREATEST(ROUND((t.issued_at + NUMTODSINTERVAL(?, 'HOUR') - SYSDATE) * 86400), 0) " +
            "seconds_left ";

    /** Find the ticket belonging to one booking, including its validity window. */
    public Ticket getTicketByBookingId(long bookingId) throws SQLException {
        String sql = "SELECT " + TICKET_COLUMNS + "FROM tickets t WHERE t.booking_id = ?";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, Ticket.VALIDITY_HOURS);
            statement.setInt(2, Ticket.VALIDITY_HOURS);
            statement.setLong(3, bookingId);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? mapTicket(resultSet) : null;
            }
        } catch (SQLException exception) {
            throw new SQLException("Could not find the ticket.", exception);
        }
    }

    /** Load every ticket of one user so travel history can show which are still active. */
    public List<Ticket> getTicketsByUserId(long userId) throws SQLException {
        String sql = "SELECT " + TICKET_COLUMNS +
                "FROM tickets t JOIN bookings b ON b.booking_id = t.booking_id " +
                "WHERE b.user_id = ?";
        List<Ticket> tickets = new ArrayList<>();

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, Ticket.VALIDITY_HOURS);
            statement.setInt(2, Ticket.VALIDITY_HOURS);
            statement.setLong(3, userId);
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    tickets.add(mapTicket(resultSet));
                }
            }
            return tickets;
        } catch (SQLException exception) {
            throw new SQLException("Could not load the user's tickets.", exception);
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

    /**
     * Create the booking, ticket, and invoice together so a failed ticket or
     * invoice insert rolls back the booking as well.
     */
    public void createCompleteBooking(Booking booking, Ticket ticket, Invoice invoice)
            throws SQLException {
        String bookingSql = "INSERT INTO bookings " +
                "(user_id, route_id, travel_date, seat_number, passenger_count, total_fare, booking_status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        String ticketSql = "INSERT INTO tickets " +
                "(booking_id, ticket_number, qr_code, ticket_status) VALUES (?, ?, ?, ?)";
        String invoiceSql = "INSERT INTO invoices " +
                "(booking_id, invoice_number, amount, payment_method, payment_status) " +
                "VALUES (?, ?, ?, ?, ?)";

        try (Connection connection = DBConnection.getConnection()) {
            connection.setAutoCommit(false);
            try (PreparedStatement bookingStatement = connection.prepareStatement(
                    bookingSql, new String[]{"BOOKING_ID"});
                 PreparedStatement ticketStatement = connection.prepareStatement(
                         ticketSql, new String[]{"TICKET_ID"});
                 PreparedStatement invoiceStatement = connection.prepareStatement(
                         invoiceSql, new String[]{"INVOICE_ID"})) {

                bookingStatement.setLong(1, booking.getUserId());
                bookingStatement.setLong(2, booking.getRouteId());
                bookingStatement.setTimestamp(3, booking.getTravelDate());
                bookingStatement.setString(4, booking.getSeatNumber());
                bookingStatement.setInt(5, booking.getPassengerCount());
                bookingStatement.setBigDecimal(6, booking.getTotalFare());
                bookingStatement.setString(7, defaultValue(booking.getBookingStatus(), "CONFIRMED"));
                bookingStatement.executeUpdate();
                booking.setBookingId(getGeneratedId(bookingStatement));

                ticketStatement.setLong(1, booking.getBookingId());
                ticketStatement.setString(2, ticket.getTicketNumber());
                String qrCode = ticket.getQrCode().replace("{BOOKING_ID}",
                        String.valueOf(booking.getBookingId()));
                ticketStatement.setString(3, qrCode);
                ticketStatement.setString(4, defaultValue(ticket.getTicketStatus(), "VALID"));
                ticketStatement.executeUpdate();
                ticket.setBookingId(booking.getBookingId());
                ticket.setQrCode(qrCode);
                ticket.setTicketId(getGeneratedId(ticketStatement));

                invoiceStatement.setLong(1, booking.getBookingId());
                invoiceStatement.setString(2, invoice.getInvoiceNumber());
                invoiceStatement.setBigDecimal(3, invoice.getAmount());
                invoiceStatement.setString(4, invoice.getPaymentMethod());
                invoiceStatement.setString(5, defaultValue(invoice.getPaymentStatus(), "PAID"));
                invoiceStatement.executeUpdate();
                invoice.setBookingId(booking.getBookingId());
                invoice.setInvoiceId(getGeneratedId(invoiceStatement));

                connection.commit();
            } catch (SQLException exception) {
                connection.rollback();
                throw exception;
            }
        } catch (SQLException exception) {
            throw new SQLException("Could not create the booking, ticket, and invoice.", exception);
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
                resultSet.getInt("passenger_count"),
                resultSet.getBigDecimal("total_fare"),
                resultSet.getString("booking_status"));
    }

    private BookingHistory mapBookingHistory(ResultSet resultSet) throws SQLException {
        return new BookingHistory(
                resultSet.getLong("booking_id"),
                resultSet.getLong("user_id"),
                resultSet.getLong("route_id"),
                resultSet.getString("route_number"),
                resultSet.getString("source_location"),
                resultSet.getString("destination"),
                resultSet.getTimestamp("booking_date"),
                resultSet.getTimestamp("travel_date"),
                resultSet.getInt("passenger_count"),
                resultSet.getBigDecimal("total_fare"),
                resultSet.getString("booking_status"));
    }

    private Ticket mapTicket(ResultSet resultSet) throws SQLException {
        Ticket ticket = new Ticket(
                resultSet.getLong("ticket_id"),
                resultSet.getLong("booking_id"),
                resultSet.getString("ticket_number"),
                resultSet.getString("qr_code"),
                resultSet.getTimestamp("issued_at"),
                resultSet.getString("ticket_status"));
        ticket.setDemoActive("Y".equals(resultSet.getString("demo_active")));
        ticket.setValidUntil(resultSet.getTimestamp("valid_until"));
        ticket.setSecondsLeft(resultSet.getLong("seconds_left"));
        return ticket;
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
