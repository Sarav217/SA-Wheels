package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.Route;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/** Provides simple admin route CRUD operations. */
public class RouteManagementServlet extends HttpServlet {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");
    private final DatabaseOperations databaseOperations = new DatabaseOperations();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(RouteJson.list(databaseOperations.getAllRoutes()));
        } catch (SQLException exception) {
            writeError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Routes could not be loaded from the database.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        if (request.getSession(false) == null
                || request.getSession(false).getAttribute("adminId") == null) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "Administrator login is required.");
            return;
        }

        String action = value(request.getParameter("action"));
        try {
            if ("delete".equalsIgnoreCase(action)) {
                deleteRoute(request, response);
            } else if ("update".equalsIgnoreCase(action)) {
                updateRoute(request, response);
            } else {
                addRoute(request, response);
            }
        } catch (IllegalArgumentException exception) {
            writeError(response, HttpServletResponse.SC_BAD_REQUEST, exception.getMessage());
        } catch (SQLException exception) {
            writeError(response, HttpServletResponse.SC_CONFLICT,
                    "The route operation could not be completed. Check duplicate route numbers or related bookings.");
        }
    }

    private void addRoute(HttpServletRequest request, HttpServletResponse response)
            throws SQLException, IOException {
        Route route = readRoute(request, 0);
        databaseOperations.addRoute(route);
        writeSuccess(response, "Route added successfully.");
    }

    private void updateRoute(HttpServletRequest request, HttpServletResponse response)
            throws SQLException, IOException {
        long routeId = parseLong(request.getParameter("routeId"), "Route ID is required.");
        Route route = readRoute(request, routeId);
        if (!databaseOperations.updateRoute(route)) {
            throw new IllegalArgumentException("Route was not found.");
        }
        writeSuccess(response, "Route updated successfully.");
    }

    private void deleteRoute(HttpServletRequest request, HttpServletResponse response)
            throws SQLException, IOException {
        long routeId = parseLong(request.getParameter("routeId"), "Route ID is required.");
        if (!databaseOperations.deleteRoute(routeId)) {
            throw new IllegalArgumentException("Route was not found.");
        }
        writeSuccess(response, "Route deleted successfully.");
    }

    private Route readRoute(HttpServletRequest request, long routeId) {
        String routeNumber = value(request.getParameter("routeNumber"));
        String source = value(request.getParameter("source"));
        String destination = value(request.getParameter("destination"));
        String departure = value(request.getParameter("departure"));
        String arrival = value(request.getParameter("arrival"));
        String fareText = value(request.getParameter("fare"));
        String status = value(request.getParameter("status")).toUpperCase();
        if (status.isBlank()) {
            status = "ACTIVE";
        }
        if (!status.equals("ACTIVE") && !status.equals("INACTIVE")) {
            throw new IllegalArgumentException("Status must be ACTIVE or INACTIVE.");
        }

        if (routeNumber.isBlank() || source.isBlank() || destination.isBlank()
                || departure.isBlank() || arrival.isBlank() || fareText.isBlank()) {
            throw new IllegalArgumentException("All route fields are required.");
        }
        if (source.equalsIgnoreCase(destination)) {
            throw new IllegalArgumentException("Source and destination must be different.");
        }

        BigDecimal fare;
        try {
            fare = new BigDecimal(fareText);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Fare must be a valid number.");
        }
        if (fare.signum() < 0) {
            throw new IllegalArgumentException("Fare cannot be negative.");
        }

        Timestamp departureTime = timeAsTimestamp(departure);
        Timestamp arrivalTime = timeAsTimestamp(arrival);
        if (!arrivalTime.after(departureTime)) {
            throw new IllegalArgumentException("Arrival time must be after departure time.");
        }

        return new Route(routeId, routeNumber, source, destination, departureTime,
                arrivalTime, fare, status);
    }

    private Timestamp timeAsTimestamp(String time) {
        try {
            LocalTime parsedTime = LocalTime.parse(time, TIME_FORMAT);
            return Timestamp.valueOf(LocalDate.of(2026, 1, 1).atTime(parsedTime));
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("Time must use HH:mm format.");
        }
    }

    private long parseLong(String value, String message) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(message);
        }
    }

    private String value(String value) {
        return value == null ? "" : value.trim();
    }

    private void writeSuccess(HttpServletResponse response, String message) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"success\":true,\"message\":\"" + message + "\"}");
    }

    private void writeError(HttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
