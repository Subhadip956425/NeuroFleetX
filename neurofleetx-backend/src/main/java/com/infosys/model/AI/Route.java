package com.infosys.model.AI;

import com.infosys.model.User;
import com.infosys.model.Vehicle;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Booking reference
    private Long bookingId;

    // ✅ Location fields (matches your existing "origin/destination")
    @Column(name = "origin")
    private String origin;  // Pickup location

    @Column(name = "destination")
    private String destination;  // Dropoff location

    // ✅ Keep for backward compatibility
    @Transient
    public String getPickupLocation() {
        return origin;
    }

    @Transient
    public String getDropoffLocation() {
        return destination;
    }

    // ✅ Distance and ETA
    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "predicted_eta")
    private Double predictedEta; // ETA in minutes

    @Column(name = "predicted_time")
    private String predictedTime; // Human readable time (e.g., "1h 30m")

    // ✅ Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private RouteStatus status; // ASSIGNED, IN_PROGRESS, COMPLETED

    // ✅ Driver and Vehicle IDs (both FK columns and primitive fields)
    @Column(name = "assigned_driver_id", insertable = true, updatable = true)
    private Long assignedDriverId;

    @Column(name = "assigned_vehicle_id", insertable = true, updatable = true)
    private Long assignedVehicleId;

    // ✅ Relationships (using insertable=false, updatable=false to avoid FK conflicts)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_driver_id", insertable = false, updatable = false)
    private User driver;

    // ✅ Time fields
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // ✅ Additional optimization data
    private Double fuelConsumption;
    private Double co2Emissions;
    private Double trafficLevel;

    // ✅ Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ✅ Helper setters for compatibility
    public void setPickupLocation(String pickup) {
        this.origin = pickup;
    }

    public void setDropoffLocation(String dropoff) {
        this.destination = dropoff;
    }

    public void setDriverId(Long driverId) {
        this.assignedDriverId = driverId;
    }

    public void setVehicleId(Long vehicleId) {
        this.assignedVehicleId = vehicleId;
    }

    public void setDistance(Double distance) {
        this.distanceKm = distance;
    }

    public Double getDistance() {
        return this.distanceKm;
    }
}
