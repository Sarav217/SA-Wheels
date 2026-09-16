package com.busticket.web;

import com.busticket.DatabaseOperations;
import com.busticket.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.util.regex.Pattern;

/** Handles the simple user registration form. */
public class RegisterServlet extends HttpServlet {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9]{10}$");

    private final DatabaseOperations databaseOperations = new DatabaseOperations();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");

        String fullName = trim(request.getParameter("fullName"));
        String email = trim(request.getParameter("email"));
        String phoneNumber = trim(request.getParameter("phoneNumber"));
        String password = request.getParameter("password");
        String confirmPassword = request.getParameter("confirmPassword");

        if (isBlank(fullName) || isBlank(email) || isBlank(phoneNumber)
                || isBlank(password) || isBlank(confirmPassword)) {
            redirectWithMessage(request, response, "register.html", "error", "missing-fields");
            return;
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            redirectWithMessage(request, response, "register.html", "error", "invalid-email");
            return;
        }

        if (!PHONE_PATTERN.matcher(phoneNumber).matches()) {
            redirectWithMessage(request, response, "register.html", "error", "invalid-phone");
            return;
        }

        if (!password.equals(confirmPassword)) {
            redirectWithMessage(request, response, "register.html", "error", "password-mismatch");
            return;
        }

        try {
            if (databaseOperations.findUserByEmail(email) != null) {
                redirectWithMessage(request, response, "register.html", "error", "email-exists");
                return;
            }

            // The current college-project schema stores the basic password value in USERS.
            User user = new User();
            user.setFullName(fullName);
            user.setEmail(email);
            user.setPhoneNumber(phoneNumber);
            user.setPassword(password);
            databaseOperations.addUser(user);

            redirectWithMessage(request, response, "register.html", "success", "registered");
        } catch (SQLException exception) {
            throw new ServletException("Registration could not be completed.", exception);
        }
    }

    private void redirectWithMessage(HttpServletRequest request, HttpServletResponse response,
                                     String page, String parameter, String value) throws IOException {
        response.sendRedirect(request.getContextPath() + "/" + page + "?" + parameter + "=" + value);
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
