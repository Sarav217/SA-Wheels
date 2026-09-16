package com.busticket.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

/** Represents a record from the ROUTES table. */
public class Route {

    private long routeId;
    private String routeNumber;
    private String sourceLocation;
    private String destination;
    private Timestamp departureTime;
    private Timestamp arrivalTime;
    private BigDecimal fare;
    private String routeStatus;

    public Route() {
    }

    public Route(long routeId, String routeNumber, String sourceLocation,
                 String destination, Timestamp departureTime, Timestamp arrivalTime,
                 BigDecimal fare, String routeStatus) {
        this.routeId = routeId;
        this.routeNumber = routeNumber;
        this.sourceLocation = sourceLocation;
        this.destination = destination;
        this.departureTime = departureTime;
        this.arrivalTime = arrivalTime;
        this.fare = fare;
        this.routeStatus = routeStatus;
    }

    public long getRouteId() { return routeId; }
    public void setRouteId(long routeId) { this.routeId = routeId; }
    public String getRouteNumber() { return routeNumber; }
    public void setRouteNumber(String routeNumber) { this.routeNumber = routeNumber; }
    public String getSourceLocation() { return sourceLocation; }
    public void setSourceLocation(String sourceLocation) { this.sourceLocation = sourceLocation; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public Timestamp getDepartureTime() { return departureTime; }
    public void setDepartureTime(Timestamp departureTime) { this.departureTime = departureTime; }
    public Timestamp getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(Timestamp arrivalTime) { this.arrivalTime = arrivalTime; }
    public BigDecimal getFare() { return fare; }
    public void setFare(BigDecimal fare) { this.fare = fare; }
    public String getRouteStatus() { return routeStatus; }
    public void setRouteStatus(String routeStatus) { this.routeStatus = routeStatus; }

    @Override
    public String toString() {
        return "Route{" +
                "routeId=" + routeId +
                ", routeNumber='" + routeNumber + '\'' +
                ", sourceLocation='" + sourceLocation + '\'' +
                ", destination='" + destination + '\'' +
                ", fare=" + fare +
                ", routeStatus='" + routeStatus + '\'' +
                '}';
    }
}
