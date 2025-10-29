package com.infosys.model.Health_Analytics;

import com.infosys.model.User;
import com.infosys.model.Vehicle;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceTicket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "reported_by")
    private User reportedBy; // driver who reported

    private String issue;      // short description e.g. "Tire wear high", "Engine temp spike"
    private String description;
    private String severity; // LOW, MEDIUM, HIGH
    private String status; // OPEN, IN_PROGRESS, RESOLVED
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private Double predictedDaysToService; // estimated days left
}
