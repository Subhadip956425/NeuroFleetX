package com.infosys.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_statuses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;

    // ✅ REQUIRED: Name field
    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private Status currentStatus; // ✅ ADD THIS FIELD

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle; // ✅ ADD THIS FIELD

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ✅ ADD THIS ENUM
    public enum Status {
        AVAILABLE,
        IN_USE,
        OFFLINE,
        MAINTENANCE,
        RESERVED,
        INACTIVE,
        NEEDS_MAINTENANCE
    }

    public VehicleStatus(Long id, String name) {
        this.id = id;
        this.name = name;
        this.description = name;
        this.currentStatus = Status.valueOf(name.toUpperCase().replace(" ", "_"));
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getVehicleId() {
        return vehicle != null ? vehicle.getId() : null;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.name == null) {
            this.name = this.currentStatus.toString();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

}
