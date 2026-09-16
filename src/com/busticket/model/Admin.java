package com.busticket.model;

import java.sql.Timestamp;

/** Represents a record from the ADMIN table. */
public class Admin {

    private long adminId;
    private long userId;
    private String adminRole;
    private Timestamp createdAt;

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

    @Override
    public String toString() {
        return "Admin{" +
                "adminId=" + adminId +
                ", userId=" + userId +
                ", adminRole='" + adminRole + '\'' +
                '}';
    }
}
