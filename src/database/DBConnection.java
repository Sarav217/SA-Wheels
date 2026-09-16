package database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {

    private static final String DEFAULT_URL =
            "jdbc:oracle:thin:@localhost:1521/XEPDB1";

    public static Connection getConnection() throws SQLException {
        String url = setting("DB_URL", DEFAULT_URL);
        String username = setting("DB_USERNAME", "");
        String password = setting("DB_PASSWORD", "");

        if (username.isBlank() || password.isBlank()) {
            throw new SQLException(
                    "Database credentials are not configured. Set DB_USERNAME and DB_PASSWORD.");
        }

        return DriverManager.getConnection(url, username, password);
    }

    private static String setting(String name, String defaultValue) {
        String systemValue = System.getProperty(name);
        if (systemValue != null && !systemValue.isBlank()) {
            return systemValue;
        }

        String environmentValue = System.getenv(name);
        return environmentValue == null || environmentValue.isBlank()
                ? defaultValue
                : environmentValue;
    }
}
