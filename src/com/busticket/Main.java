package com.busticket;

import java.sql.Connection;
import database.DBConnection;

/**
 * Entry point for SA Wheels, the Public Transport Bus Ticketing System.
 *
 * The application modules will be added incrementally.
 * This class currently tests the Oracle database connection.
 */
public class Main {

    public static void main(String[] args) {

        System.out.println("SA Wheels - Public Transport Bus Ticketing System");

        try {
            Connection connection = DBConnection.getConnection();

            System.out.println("Oracle Database Connected Successfully!");

            connection.close();

        } catch (Exception e) {
            System.out.println("Database Connection Failed!");
            e.printStackTrace();
        }

        System.out.println("Project structure created. Modules will be implemented next.");
    }
}
