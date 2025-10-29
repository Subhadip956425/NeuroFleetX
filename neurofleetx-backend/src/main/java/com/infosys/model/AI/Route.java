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

    private String origin;
    private String destination;

    private Double distanceKm;
    private Double predictedEta; // ETA from AI

    @Enumerated(EnumType.STRING)
    private RouteStatus status; // PENDING, ASSIGNED, COMPLETED

//    private Long assignedVehicleId; // Vehicle ID
//    private Long assignedDriverId;  // Driver ID

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "assigned_vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "assigned_driver_id", insertable = false, updatable = false)
    private User driver;

}
