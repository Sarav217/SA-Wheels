package com.busticket.web;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/** Protects the simple user and admin pages using session attributes. */
public class AuthFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        HttpSession session = httpRequest.getSession(false);

        String path = httpRequest.getRequestURI().substring(httpRequest.getContextPath().length());
        boolean adminPage = path.startsWith("/admin-") || path.equals("/route-management.html");
        boolean loggedIn = session != null && (adminPage
                ? session.getAttribute("adminId") != null
                : session.getAttribute("userId") != null);

        if (!loggedIn) {
            String loginPage = adminPage ? "/admin-login.html" : "/login.html";
            httpResponse.sendRedirect(httpRequest.getContextPath() + loginPage + "?error=login-required");
            return;
        }

        chain.doFilter(request, response);
    }
}
