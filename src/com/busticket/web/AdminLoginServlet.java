package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.Admin;
import com.busticket.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;

/** Handles the simple administrator login form. */
public class AdminLoginServlet extends HttpServlet {

    private final DatabaseOperations databaseOperations = new DatabaseOperations();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String username = value(request.getParameter("username"));
        String password = request.getParameter("password");

        if (username.isBlank() || password == null || password.isBlank()) {
            redirectToAdminLogin(request, response, "missing-fields");
            return;
        }

        try {
            Admin admin = databaseOperations.findAdminByUsername(username);
            User adminUser = databaseOperations.findUserByEmail(username);

            if (admin == null || adminUser == null || !password.equals(adminUser.getPassword())
                    || !"ACTIVE".equalsIgnoreCase(adminUser.getUserStatus())) {
                redirectToAdminLogin(request, response, "invalid-credentials");
                return;
            }

            HttpSession session = request.getSession(true);
            session.setAttribute("adminId", admin.getAdminId());
            session.setAttribute("adminUserId", admin.getUserId());
            session.setAttribute("adminRole", admin.getAdminRole());
            response.sendRedirect(request.getContextPath() + "/admin-dashboard.html");
        } catch (SQLException exception) {
            throw new ServletException("Admin login could not be completed.", exception);
        }
    }

    private void redirectToAdminLogin(HttpServletRequest request, HttpServletResponse response,
                                      String error) throws IOException {
        response.sendRedirect(request.getContextPath() + "/admin-login.html?error=" + error);
    }

    private String value(String value) {
        return value == null ? "" : value.trim();
    }
}
