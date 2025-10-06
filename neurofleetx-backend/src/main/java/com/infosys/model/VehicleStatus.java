package com.infosys.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vehicle_statuses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;
}

