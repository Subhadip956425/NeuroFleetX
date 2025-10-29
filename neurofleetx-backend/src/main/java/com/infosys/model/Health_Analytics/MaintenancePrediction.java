package com.infosys.model.Health_Analytics;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/*
  Purpose: Store periodic prediction outputs for analytics (optional).
*/
@Entity
@Table(name = "maintenance_predictions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenancePrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long vehicleId;
    private LocalDateTime predictedAt;
    private Double daysToService;
    private String reason; // e.g., "tire_wear_trend"
}
