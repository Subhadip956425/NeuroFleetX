package com.infosys.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Customer who booked
    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    // Assigned vehicle (nullable until assigned)
    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Column(nullable = false)
    private String status; // BOOKED, CANCELLED, COMPLETED

    private String pickupLocation;
    private String dropLocation;

    private Double price;
}
