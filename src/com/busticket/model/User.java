package com.busticket.model;

import java.sql.Timestamp;

/** Represents a record from the USERS table. */
public class User {

    private long userId;
    private String fullName;
    private String email;
    private String password;
    private String phoneNumber;
    private Timestamp createdAt;
    private String userStatus;

    public User() {
    }

    public User(long userId, String fullName, String email, String password,
                String phoneNumber, Timestamp createdAt, String userStatus) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.phoneNumber = phoneNumber;
        this.createdAt = createdAt;
        this.userStatus = userStatus;
    }

    public long getUserId() { return userId; }
    public void setUserId(long userId) { this.userId = userId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
    public String getUserStatus() { return userStatus; }
    public void setUserStatus(String userStatus) { this.userStatus = userStatus; }

    @Override
    public String toString() {
        return "User{" +
                "userId=" + userId +
                ", fullName='" + fullName + '\'' +
                ", email='" + email + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", userStatus='" + userStatus + '\'' +
                '}';
    }
}
