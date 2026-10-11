package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.Admin;
import com.busticket.util.PasswordHasher;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;

/**
 * Handles administrator login.
 *
 * Admins sign in with ADMIN.USERNAME and a PBKDF2 password hash stored in
 * ADMIN.PASSWORD_HASH. This is separate from passenger login in LoginServlet.
 */
public class AdminLoginServlet extends HttpServlet {

    private static final int SESSION_TIMEOUT_SECONDS = 30 * 60;
    private static final LoginAttemptLimiter LIMITER = new LoginAttemptLimiter();
    private final DatabaseOperations databaseOperations = new DatabaseOperations();

    /** Validate the username and password, then start a new admin session. */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String username = value(request.getParameter("username"));
        String password = request.getParameter("password");

        if (username.isBlank() || password == null || password.isBlank()) {
            redirectWithError(request, response, "missing-fields");
            return;
        }
        if (LIMITER.isLocked(username)) {
            redirectWithError(request, response, "too-many-attempts");
            return;
        }

        try {
            Admin admin = databaseOperations.findAdminByUsername(username);
            // The same message is used for an unknown username and a wrong
            // password so the form does not reveal which admin names exist.
            if (admin == null || !PasswordHasher.verify(password, admin.getPasswordHash())) {
                LIMITER.recordFailure(username);
                redirectWithError(request, response, "invalid-credentials");
                return;
            }

            LIMITER.reset(username);
            HttpSession session = LoginRedirects.startNewSession(request, SESSION_TIMEOUT_SECONDS);
            session.setAttribute("adminId", admin.getAdminId());
            session.setAttribute("adminUserId", admin.getUserId());
            session.setAttribute("adminUsername", admin.getUsername());
            session.setAttribute("adminRole", admin.getAdminRole());
            response.sendRedirect(request.getContextPath() + "/admin-dashboard.html");
        } catch (SQLException exception) {
            // Keep database details out of the browser and show a simple message.
            log("Admin login failed because of a database error.", exception);
            redirectWithError(request, response, "database-error");
        }
    }

    private void redirectWithError(HttpServletRequest request, HttpServletResponse response,
                                   String error) throws IOException {
        LoginRedirects.toLoginForm(request, response, "admin", "/admin-login.html", error);
    }

    private String value(String value) {
        return value == null ? "" : value.trim();
    }
}
