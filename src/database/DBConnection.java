package database;

import java.sql.Connection;
import java.sql.Driver;
import java.sql.SQLException;
import java.util.Properties;

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

        // Explicit loading keeps the Oracle driver available when Tomcat uses
        // a separate web application classloader.
        try {
            Driver driver = (Driver) Class.forName("oracle.jdbc.OracleDriver")
                    .getDeclaredConstructor()
                    .newInstance();
            Properties properties = new Properties();
            properties.setProperty("user", username);
            properties.setProperty("password", password);
            Connection connection = driver.connect(url, properties);
            if (connection == null) {
                throw new SQLException("Oracle JDBC driver could not connect to the configured URL.");
            }
            return connection;
        } catch (ClassNotFoundException exception) {
            throw new SQLException("Oracle JDBC driver was not found.", exception);
        } catch (ReflectiveOperationException exception) {
            throw new SQLException("Oracle JDBC driver could not be initialized.", exception);
        }
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
