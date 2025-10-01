package com.hepsi.demo.services;

import com.hepsi.demo.model.Vehicle;
import java.util.List;

public interface VehicleService {
    Vehicle addVehicle(Vehicle vehicle);
    List<Vehicle> getAllVehicles();
    Vehicle updateVehicle(Long id, Vehicle vehicle);
    boolean deleteVehicle(Long id);
}
