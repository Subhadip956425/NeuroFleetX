package com.infosys.model;

import com.infosys.model.AI.RouteStatus;
import com.infosys.model.Booking.Booking;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverRoute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;



    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    // Location details
    private String pickupLocation;
    private String dropoffLocation;
    private String pickupCoordinates; // "lat,lng"
    private String dropoffCoordinates; // "lat,lng"

    // Route optimization
    private Double distanceKm;
    private Double estimatedTimeMinutes;
    private String optimizedPath; // JSON array of waypoints
    private Double trafficLevel; // 0.2 (Low) to 0.8 (High)

    // Route alternatives
    private String fastestRoutePath; // JSON
    private String balancedRoutePath; // JSON
    private String avoidTrafficRoutePath; // JSON

    private Double fastestEta;
    private Double balancedEta;
    private Double avoidTrafficEta;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RouteStatus status; // ASSIGNED, IN_TRANSIT, COMPLETED, CANCELLED

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime updatedAt;

    // Vehicle health at route start
    private Double batteryLevelAtStart;
    private Double fuelLevelAtStart;

    @Transient
    public Long getBookingId() {
        return booking != null ? booking.getId() : null;
    }

    @Transient
    public Long getDriverId() {
        return driver != null ? driver.getId() : null;
    }

    @Transient
    public Long getVehicleId() {
        return vehicle != null ? vehicle.getId() : null;
    }

}
