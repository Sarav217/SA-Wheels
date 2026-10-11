package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.regex.Pattern;

/** Handles user login and creates a simple user session. */
public class LoginServlet extends HttpServlet {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final int SESSION_TIMEOUT_SECONDS = 30 * 60;
    private final DatabaseOperations databaseOperations = new DatabaseOperations();

    /** Check the email and password against USERS, then open the user dashboard. */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String email = value(request.getParameter("email"));
        String password = request.getParameter("password");

        if (email.isBlank() || password == null || password.isBlank()) {
            redirectToLogin(request, response, "missing-fields");
            return;
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            redirectToLogin(request, response, "invalid-email");
            return;
        }

        try {
            User user = databaseOperations.findUserByEmail(email);
            if (user == null || !password.equals(user.getPassword())
                    || !"ACTIVE".equalsIgnoreCase(user.getUserStatus())) {
                redirectToLogin(request, response, "invalid-credentials");
                return;
            }

            // Start a fresh session after login and store only what the user pages need.
            HttpSession session = LoginRedirects.startNewSession(request, SESSION_TIMEOUT_SECONDS);
            session.setAttribute("userId", user.getUserId());
            session.setAttribute("userName", user.getFullName());
            session.setAttribute("userRole", "USER");
            response.sendRedirect(request.getContextPath() + "/user-dashboard.html");
        } catch (SQLException exception) {
            // Do not expose JDBC or Oracle details in the browser.
            log("User login failed because of a database error.", exception);
            redirectToLogin(request, response, "database-error");
        }
    }

    private void redirectToLogin(HttpServletRequest request, HttpServletResponse response,
                                 String error) throws IOException {
        LoginRedirects.toLoginForm(request, response, "user", "/login.html", error);
    }

    private String value(String value) {
        return value == null ? "" : value.trim();
    }
}
