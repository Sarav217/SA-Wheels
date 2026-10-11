package com.busticket.model;

import java.sql.Timestamp;

/** Represents a record from the TICKETS table. */
public class Ticket {

    /** A ticket can be used for this many hours after it is issued. */
    public static final int VALIDITY_HOURS = 6;

    /** Validity states shown to the passenger. */
    public static final String STATE_ACTIVE = "ACTIVE";
    public static final String STATE_EXPIRED = "EXPIRED";
    public static final String STATE_CANCELLED = "CANCELLED";

    private long ticketId;
    private long bookingId;
    private String ticketNumber;
    private String qrCode;
    private Timestamp issuedAt;
    private String ticketStatus;
    private Timestamp validUntil;
    private long secondsLeft;
    private boolean demoActive;

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
    public Timestamp getValidUntil() { return validUntil; }
    public void setValidUntil(Timestamp validUntil) { this.validUntil = validUntil; }
    public long getSecondsLeft() { return secondsLeft; }
    public void setSecondsLeft(long secondsLeft) { this.secondsLeft = secondsLeft; }
    public boolean isDemoActive() { return demoActive; }
    public void setDemoActive(boolean demoActive) { this.demoActive = demoActive; }

    /**
     * Returns ACTIVE or EXPIRED for a VALID ticket, otherwise the stored
     * status (USED or CANCELLED). Demo tickets never expire; other tickets
     * expire when no validity time is left.
     */
    public String getValidityState() {
        if (!"VALID".equals(ticketStatus)) {
            return ticketStatus;
        }
        if (demoActive || secondsLeft > 0) {
            return STATE_ACTIVE;
        }
        return STATE_EXPIRED;
    }

    /** Same as {@link #getValidityState()}, but a cancelled booking always cancels its ticket. */
    public String getValidityState(String bookingStatus) {
        return "CANCELLED".equals(bookingStatus) ? STATE_CANCELLED : getValidityState();
    }

    /** True when the ticket may still be used for travel. */
    public boolean isActive(String bookingStatus) {
        return STATE_ACTIVE.equals(getValidityState(bookingStatus));
    }

    @Override
    public String toString() {
        return "Ticket{" +
                "ticketId=" + ticketId +
                ", bookingId=" + bookingId +
                ", ticketNumber='" + ticketNumber + '\'' +
                ", ticketStatus='" + ticketStatus + '\'' +
                ", validity='" + getValidityState() + '\'' +
                '}';
    }
}
