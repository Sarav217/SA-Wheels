package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.Route;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

/** Returns route data for the logged-in user's route search page. */
public class RouteSearchServlet extends HttpServlet {

    private final DatabaseOperations databaseOperations = new DatabaseOperations();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String routeId = value(request.getParameter("routeId"));
        String source = value(request.getParameter("source"));
        String destination = value(request.getParameter("destination"));

        try {
            List<Route> routes;
            if (!routeId.isBlank()) {
                Route route = databaseOperations.getRouteById(Long.parseLong(routeId));
                routes = route == null ? List.of() : List.of(route);
            } else if (source.isBlank() && destination.isBlank()) {
                routes = databaseOperations.getAllRoutes();
            } else if (source.isBlank() || destination.isBlank()) {
                writeError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Both source and destination are required.");
                return;
            } else {
                routes = databaseOperations.searchRoutes(source, destination);
            }

            // Users should only see routes that are currently available.
            routes = routes.stream()
                    .filter(route -> "ACTIVE".equalsIgnoreCase(route.getRouteStatus()))
                    .toList();

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(RouteJson.list(routes));
        } catch (NumberFormatException exception) {
            writeError(response, HttpServletResponse.SC_BAD_REQUEST, "Route ID must be a number.");
        } catch (SQLException exception) {
            writeError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Routes could not be loaded from the database.");
        }
    }

    private String value(String value) {
        return value == null ? "" : value.trim();
    }

    private void writeError(HttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
