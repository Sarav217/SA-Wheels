package com.busticket.model;

import java.sql.Timestamp;

/** A registered user with their booking count, shown on the admin "Manage Users" page. */
public class UserAccount extends User {

    private final int bookingCount;

    public UserAccount(long userId, String fullName, String email, String phoneNumber,
                       Timestamp createdAt, String userStatus, int bookingCount) {
        // The password is never loaded for admin screens.
        super(userId, fullName, email, null, phoneNumber, createdAt, userStatus);
        this.bookingCount = bookingCount;
    }

    public int getBookingCount() { return bookingCount; }
}
