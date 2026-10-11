package com.busticket;

import com.busticket.model.Admin;
import com.busticket.model.Route;
import com.busticket.model.User;

import java.sql.SQLException;
import java.util.List;

/**
 * Small executable test for the first database operations module.
 * This is not a replacement for a full testing framework.
 */
public class DatabaseOperationsTest {

    public static void main(String[] args) {
        DatabaseOperations operations = new DatabaseOperations();

        try {
            User user = operations.findUserByEmail("arun.kumar@example.com");
            require(user != null, "User lookup returned no record");
            System.out.println("User lookup passed: " + user.getFullName());

            Admin admin = operations.findAdminByUsername("admin");
            require(admin != null, "Admin lookup returned no record");
            System.out.println("Admin lookup passed: " + admin.getAdminRole());

            List<Route> allRoutes = operations.getAllRoutes();
            require(!allRoutes.isEmpty(), "Route list is empty");
            System.out.println("Route list passed: " + allRoutes.size() + " routes found");

            List<Route> matchingRoutes = operations.searchRoutes("Chennai Central", "Tambaram");
            require(!matchingRoutes.isEmpty(), "Route search returned no record");
            System.out.println("Route search passed: " + matchingRoutes.get(0).getRouteNumber());

            System.out.println("DatabaseOperations basic tests passed.");
        } catch (SQLException | IllegalStateException exception) {
            System.err.println("DatabaseOperations tests failed: " + exception.getMessage());
            System.exit(1);
        }
    }

    private static void require(boolean condition, String message) {
        if (!condition) {
            throw new IllegalStateException(message);
        }
    }
}
