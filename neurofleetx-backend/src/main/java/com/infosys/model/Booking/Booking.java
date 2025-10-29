package com.infosys.model.Booking;

import com.infosys.model.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/*
 Purpose: Store bookings made by customers
*/
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

    private Long customerId;         // FK to user (customer)

    private Long vehicleId;          // assigned vehicle (nullable until assigned)

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;

    @Column(name = "seats")
    private Integer seats;

    @Column(name = "pickup_location")
    private String pickupLocation;

    @Column(name = "drop_location")
    private String dropoffLocation;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Double price;            // computed price for the slot

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    @Column(name = "rejected_by")
    private String rejectedBy;

    private Boolean isEv;            // whether customer requested EV

    private String vehicleType;      // e.g., "Sedan", "SUV", etc.

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Column(name = "assigned_driver_id")
    private Long assignedDriverId;

    @Column(name = "reject_reason")
    private String rejectReason;
}
