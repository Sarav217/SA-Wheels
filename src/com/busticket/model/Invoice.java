package com.busticket.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

/** Represents a record from the INVOICES table. */
public class Invoice {

    private long invoiceId;
    private long bookingId;
    private String invoiceNumber;
    private Timestamp invoiceDate;
    private BigDecimal amount;
    private String paymentMethod;
    private String paymentStatus;

    public Invoice() {
    }

    public Invoice(long invoiceId, long bookingId, String invoiceNumber,
                   Timestamp invoiceDate, BigDecimal amount, String paymentMethod,
                   String paymentStatus) {
        this.invoiceId = invoiceId;
        this.bookingId = bookingId;
        this.invoiceNumber = invoiceNumber;
        this.invoiceDate = invoiceDate;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
    }

    public long getInvoiceId() { return invoiceId; }
    public void setInvoiceId(long invoiceId) { this.invoiceId = invoiceId; }
    public long getBookingId() { return bookingId; }
    public void setBookingId(long bookingId) { this.bookingId = bookingId; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public Timestamp getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(Timestamp invoiceDate) { this.invoiceDate = invoiceDate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    @Override
    public String toString() {
        return "Invoice{" +
                "invoiceId=" + invoiceId +
                ", bookingId=" + bookingId +
                ", invoiceNumber='" + invoiceNumber + '\'' +
                ", amount=" + amount +
                ", paymentMethod='" + paymentMethod + '\'' +
                ", paymentStatus='" + paymentStatus + '\'' +
                '}';
    }
}
