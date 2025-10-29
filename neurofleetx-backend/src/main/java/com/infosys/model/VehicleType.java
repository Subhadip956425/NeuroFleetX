package com.infosys.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vehicle_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private Boolean isEvType;

    public VehicleType(Long id, String name) {
        this.id = id;
        this.name = name;
        this.isEvType = false;
    }
}

