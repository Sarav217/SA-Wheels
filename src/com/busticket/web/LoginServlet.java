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

/** Handles user login and creates a simple user session. */
public class LoginServlet extends HttpServlet {

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
            throw new ServletException("Login could not be completed.", exception);
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
