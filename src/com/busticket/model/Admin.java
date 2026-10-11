package com.busticket.model;

import java.sql.Timestamp;

/**
 * Represents a record from the ADMIN table.
 *
 * Administrators sign in with their own username and a hashed password, kept
 * separate from the passenger accounts in the USERS table.
 */
public class Admin {

    private long adminId;
    private long userId;
    private String adminRole;
    private Timestamp createdAt;
    private String username;
    private String passwordHash;

    public Admin() {
    }

    public Admin(long adminId, long userId, String adminRole, Timestamp createdAt) {
        this.adminId = adminId;
        this.userId = userId;
        this.adminRole = adminRole;
        this.createdAt = createdAt;
    }

    public long getAdminId() { return adminId; }
    public void setAdminId(long adminId) { this.adminId = adminId; }
    public long getUserId() { return userId; }
    public void setUserId(long userId) { this.userId = userId; }
    public String getAdminRole() { return adminRole; }
    public void setAdminRole(String adminRole) { this.adminRole = adminRole; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    @Override
    public String toString() {
        // The password hash is deliberately left out of log output.
        return "Admin{" +
                "adminId=" + adminId +
                ", userId=" + userId +
                ", username='" + username + '\'' +
                ", adminRole='" + adminRole + '\'' +
                '}';
    }
}
