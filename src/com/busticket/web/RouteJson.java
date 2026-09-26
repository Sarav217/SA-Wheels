package com.busticket.web;

import com.busticket.model.Route;

import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** Small JSON writer used by the route pages without adding another library. */
final class RouteJson {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private RouteJson() {
    }

    static String list(List<Route> routes) {
        StringBuilder json = new StringBuilder("[");
        for (int index = 0; index < routes.size(); index++) {
            if (index > 0) {
                json.append(',');
            }
            json.append(route(routes.get(index)));
        }
        return json.append(']').toString();
    }

    static String route(Route route) {
        return "{" +
                "\"routeId\":" + route.getRouteId() + "," +
                "\"routeNumber\":" + quote(route.getRouteNumber()) + "," +
                "\"source\":" + quote(route.getSourceLocation()) + "," +
                "\"destination\":" + quote(route.getDestination()) + "," +
                "\"stops\":\"Not configured\"," +
                "\"travelTimeMinutes\":" + travelTimeMinutes(route) + "," +
                "\"departure\":" + quote(formatTime(route.getDepartureTime())) + "," +
                "\"arrival\":" + quote(formatTime(route.getArrivalTime())) + "," +
                "\"fare\":" + route.getFare() + "," +
                "\"status\":" + quote(route.getRouteStatus()) +
                "}";
    }

    static long travelTimeMinutes(Route route) {
        if (route.getDepartureTime() == null || route.getArrivalTime() == null) {
            return 0;
        }
        return Duration.between(route.getDepartureTime().toInstant(),
                route.getArrivalTime().toInstant()).toMinutes();
    }

    private static String formatTime(java.sql.Timestamp timestamp) {
        return timestamp == null ? "" : timestamp.toLocalDateTime().format(TIME_FORMAT);
    }

    private static String quote(String value) {
        if (value == null) {
            return "null";
        }
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
