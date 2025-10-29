package com.infosys.model.Health_Analytics;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/*
  Purpose: Represents a single telemetry/health sample for a vehicle.
  Kept minimal: engineTemp, tireWear (0-100), batteryLevel, fuelLevel, mileage.
*/
@Entity
@Table(name = "health_readings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long vehicleId;

    private Double engineTemp;      // °C
    private Double tireWear;        // percentage 0-100 (higher = more worn)
    private Double batteryLevel;    // percentage 0-100
    private Double fuelLevel;       // percentage 0-100
    private Double mileage;         // total km reading

    private LocalDateTime timestamp;
}
