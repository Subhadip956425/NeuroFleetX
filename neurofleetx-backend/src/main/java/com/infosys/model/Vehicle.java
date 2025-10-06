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

    private double batteryLevel;
    private double fuelLevel;
    private double speed;
    private double latitude;
    private double longitude;

    private LocalDateTime lastUpdated;

    @ManyToOne
    @JoinColumn(name = "assigned_driver_id")
    private User assignedDriver;
}

