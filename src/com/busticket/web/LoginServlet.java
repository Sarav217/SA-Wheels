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
    private final DatabaseOperations databaseOperations = new DatabaseOperations();

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

            // Store only the information needed by the protected user pages.
            HttpSession session = request.getSession(true);
            session.setAttribute("userId", user.getUserId());
            session.setAttribute("userName", user.getFullName());
            session.setAttribute("userRole", "USER");
            response.sendRedirect(request.getContextPath() + "/user-dashboard.html");
        } catch (SQLException exception) {
            // Do not expose JDBC or Oracle details in the browser.
            redirectToLogin(request, response, "database-error");
        }
    }

    private void redirectToLogin(HttpServletRequest request, HttpServletResponse response,
                                 String error) throws IOException {
        response.sendRedirect(request.getContextPath() + "/login.html?error=" + error);
    }

    private String value(String value) {
        return value == null ? "" : value.trim();
    }
}
