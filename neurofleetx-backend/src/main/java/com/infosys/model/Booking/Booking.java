package com.infosys.model.Booking;

import com.infosys.model.User;
import com.infosys.model.Vehicle;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/*
 Purpose: Store bookings made by customers
 Workflow:
 - Created with PENDING status
 - Driver accepts → CONFIRMED status + route created
 - Driver rejects → remains PENDING for other drivers
 - Manager rejects → CANCELLED status
 - Booking completed after trip ends → COMPLETED status
*/
@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ========== Customer Reference ==========
    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    // ========== Vehicle Reference ==========
    @Column(name = "vehicle_id")
    private Long vehicleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle assignedVehicle;

    // ========== Driver Assignment ==========
    @Column(name = "assigned_driver_id")
    private Long assignedDriverId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private User driver;

    // ========== Booking Details ==========
    @Column(name = "vehicle_type")
    private String vehicleType;

    @Column(name = "is_ev")
    private Boolean isEv;

    @Column(name = "seats")
    private Integer seats;

    // ========== Location Fields - TEXT ADDRESSES ==========
    @Column(name = "pickup_location", length = 500)
    private String pickupLocation;

    @Column(name = "dropoff_location", length = 500)
    private String dropoffLocation;

    // ========== NEW: Location Coordinates for Heatmap ==========
    @Column(name = "pickup_lat")
    private Double pickupLat;

    @Column(name = "pickup_lng")
    private Double pickupLng;

    @Column(name = "dropoff_lat")
    private Double dropoffLat;

    @Column(name = "dropoff_lng")
    private Double dropoffLng;

    // ========== Time Fields ==========
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "distance")
    private Double distance;  // in KM

    @Column(name = "duration")
    private Integer duration;  // in minutes

    @Column(name = "price")
    private Double price;

    // ========== Status & Rejection ==========
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    @Column(name = "rejected_by")
    private String rejectedBy;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    // ========== Timestamps ==========
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ========== Helper Methods ==========

    /**
     * Get booking date (alias for createdAt for analytics compatibility)
     */
    public LocalDateTime getBookingDate() {
        return this.createdAt;
    }

    /**
     * Set driver and update assignedDriverId
     */
    public void setDriver(User driver) {
        this.driver = driver;
        if (driver != null) {
            this.assignedDriverId = driver.getId();
        }
    }

    /**
     * Set assigned vehicle and update vehicleId
     */
    public void setAssignedVehicle(Vehicle vehicle) {
        this.assignedVehicle = vehicle;
        if (vehicle != null) {
            this.vehicleId = vehicle.getId();
        }
    }

    /**
     * Get vehicle ID (from either stored field or relationship)
     */
    public Long getVehicleId() {
        if (this.vehicleId != null) {
            return this.vehicleId;
        }
        return this.assignedVehicle != null ? this.assignedVehicle.getId() : null;
    }

    /**
     * Check if booking is in active state
     */
    public boolean isActive() {
        return this.status == BookingStatus.PENDING || this.status == BookingStatus.CONFIRMED;
    }

    /**
     * Check if booking can be cancelled
     */
    public boolean canBeCancelled() {
        return this.status == BookingStatus.PENDING || this.status == BookingStatus.CONFIRMED;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = BookingStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
