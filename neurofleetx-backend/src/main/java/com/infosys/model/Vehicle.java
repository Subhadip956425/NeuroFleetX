package com.infosys.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "type_id")
    private VehicleType type;

    @ManyToOne
    @JoinColumn(name = "status_id")
    private VehicleStatus status;

    private Boolean isEv = false;

    private Double batteryLevel;
    private Double fuelLevel;
    private Double speed;
    private Double latitude;
    private Double longitude;

    // Health analytics
    private Double tireWear;
    private Double mileage;

    private LocalDateTime lastUpdated;

    // ✅ Driver assignment
    @Column(name = "assigned_driver_id")
    private Long assignedDriverId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_driver_id", insertable = false, updatable = false)
    private User assignedDriver;

    // ✅ AI/ML Health Metrics (for predictive maintenance)
    @Column(name = "engine_temp")
    private Double engineTemp;

    @Column(name = "tire_pressure")
    private Double tirePressure;

    @Column(name = "oil_level")
    private Double oilLevel;

    @Column(name = "brake_wear")
    private Double brakeWear;

    @Column(name = "days_since_last_maintenance")
    private Integer daysSinceLastMaintenance;

    // Maintenance tracking
    @Column(name = "last_maintenance_date")
    private LocalDateTime lastMaintenanceDate;

    @Column(name = "next_maintenance_date")
    private LocalDateTime nextMaintenanceDate;

    @Column(name = "maintenance_status")
    private String maintenanceStatus = "HEALTHY"; // HEALTHY, DUE, CRITICAL

    private Long ownerId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
