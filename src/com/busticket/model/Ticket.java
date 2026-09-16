package com.busticket.model;

import java.sql.Timestamp;

/** Represents a record from the TICKETS table. */
public class Ticket {

    private long ticketId;
    private long bookingId;
    private String ticketNumber;
    private String qrCode;
    private Timestamp issuedAt;
    private String ticketStatus;

    public Ticket() {
    }

    public Ticket(long ticketId, long bookingId, String ticketNumber, String qrCode,
                  Timestamp issuedAt, String ticketStatus) {
        this.ticketId = ticketId;
        this.bookingId = bookingId;
        this.ticketNumber = ticketNumber;
        this.qrCode = qrCode;
        this.issuedAt = issuedAt;
        this.ticketStatus = ticketStatus;
    }

    public long getTicketId() { return ticketId; }
    public void setTicketId(long ticketId) { this.ticketId = ticketId; }
    public long getBookingId() { return bookingId; }
    public void setBookingId(long bookingId) { this.bookingId = bookingId; }
    public String getTicketNumber() { return ticketNumber; }
    public void setTicketNumber(String ticketNumber) { this.ticketNumber = ticketNumber; }
    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }
    public Timestamp getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Timestamp issuedAt) { this.issuedAt = issuedAt; }
    public String getTicketStatus() { return ticketStatus; }
    public void setTicketStatus(String ticketStatus) { this.ticketStatus = ticketStatus; }

    @Override
    public String toString() {
        return "Ticket{" +
                "ticketId=" + ticketId +
                ", bookingId=" + bookingId +
                ", ticketNumber='" + ticketNumber + '\'' +
                ", ticketStatus='" + ticketStatus + '\'' +
                '}';
    }
}
