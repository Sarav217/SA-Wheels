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

    /**
     * Admin pages need an admin session and user pages need a user session.
     * A visitor who is not logged in is sent to the matching login popup on
     * the home page; JSON requests get a 401 status instead of a redirect.
     */
    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        HttpSession session = httpRequest.getSession(false);

        String path = httpRequest.getRequestURI().substring(httpRequest.getContextPath().length());
        boolean adminPage = path.startsWith("/admin-")
                || path.equals("/route-management.html")
                || path.equals("/route-management");
        boolean loggedIn = session != null && (adminPage
                ? session.getAttribute("adminId") != null
                : session.getAttribute("userId") != null);

        // Do not let the browser cache protected pages, so the Back button
        // cannot show them again after logout.
        httpResponse.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        httpResponse.setHeader("Pragma", "no-cache");
        httpResponse.setDateHeader("Expires", 0);

        if (!loggedIn) {
            if (path.equals("/admin-data")) {
                httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                httpResponse.setContentType("application/json");
                httpResponse.setCharacterEncoding("UTF-8");
                httpResponse.getWriter().write("{\"success\":false,\"message\":\"Please log in as admin.\"}");
                return;
            }
            String popupView = adminPage ? "admin" : "user";
            httpResponse.sendRedirect(httpRequest.getContextPath()
                    + "/index.html?login=" + popupView + "&error=login-required");
            return;
        }

        chain.doFilter(request, response);
    }
}
