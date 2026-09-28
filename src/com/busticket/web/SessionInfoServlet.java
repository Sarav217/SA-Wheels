package com.busticket.web;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * Tells the static pages who is logged in so they can show the right name
 * and navigation links. It never returns passwords or database details.
 */
public class SessionInfoServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        boolean user = session != null && session.getAttribute("userId") != null;
        boolean admin = session != null && session.getAttribute("adminId") != null;

        String userName = user ? (String) session.getAttribute("userName") : null;
        String adminName = admin ? (String) session.getAttribute("adminName") : null;

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write("{" +
                "\"loggedIn\":" + (user || admin) + "," +
                "\"user\":" + user + "," +
                "\"admin\":" + admin + "," +
                "\"userName\":" + RouteJson.quote(userName) + "," +
                "\"adminName\":" + RouteJson.quote(adminName) +
                "}");
    }
}
