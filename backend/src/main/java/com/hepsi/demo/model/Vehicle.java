package com.hepsi.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String vehicleNumber;
    private String type;        // Car, Bike, EV, Truck
    private String status;      // Available, In Use, Maintenance
    private double battery;     // in %
    private double fuel;        // in %
    private double speed;       // in km/h
    private String location;    // city/coordinates
}
