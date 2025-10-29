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

//    Health analytics
    private Double tireWear;
    private Double mileage;

    private LocalDateTime lastUpdated;

    // ✅ ADD THIS: Direct driver ID field for easier queries
    @Column(name = "assigned_driver_id")
    private Long assignedDriverId;

    // Keep the relationship for object access
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_driver_id", insertable = false, updatable = false)
    private User assignedDriver;
}

