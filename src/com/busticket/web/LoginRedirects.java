package com.busticket.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/** Shared helpers for the user and admin login servlets. */
final class LoginRedirects {

    private LoginRedirects() {
    }

    /**
     * Send a failed login back to the form it came from. Forms in the home
     * page popup post from=home; the standalone login pages do not.
     * Only fixed paths are used, so the redirect cannot point to another site.
     */
    static void toLoginForm(HttpServletRequest request, HttpServletResponse response,
                            String popupView, String loginPage, String error) throws IOException {
        String target = "home".equals(request.getParameter("from"))
                ? "/index.html?login=" + popupView + "&error=" + error
                : loginPage + "?error=" + error;
        response.sendRedirect(request.getContextPath() + target);
    }

    /**
     * Replace any existing session with a new one after a successful login,
     * so a session ID set before login cannot be reused (session fixation).
     */
    static HttpSession startNewSession(HttpServletRequest request, int timeoutSeconds) {
        HttpSession oldSession = request.getSession(false);
        if (oldSession != null) {
            oldSession.invalidate();
        }
        HttpSession session = request.getSession(true);
        session.setMaxInactiveInterval(timeoutSeconds);
        return session;
    }
}
