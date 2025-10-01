package com.hepsi.demo.services;

import com.hepsi.demo.model.Vehicle;
import com.hepsi.demo.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleServiceImpl(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Override
    public Vehicle addVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    @Override
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    @Override
    public Vehicle updateVehicle(Long id, Vehicle updatedVehicle) {
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setVehicleNumber(updatedVehicle.getVehicleNumber());
            vehicle.setType(updatedVehicle.getType());
            vehicle.setStatus(updatedVehicle.getStatus());
            vehicle.setBattery(updatedVehicle.getBattery());
            vehicle.setFuel(updatedVehicle.getFuel());
            vehicle.setSpeed(updatedVehicle.getSpeed());
            vehicle.setLocation(updatedVehicle.getLocation());
            return vehicleRepository.save(vehicle);
        }).orElse(null);
    }

    @Override
    public boolean deleteVehicle(Long id) {
        if (vehicleRepository.existsById(id)) {
        vehicleRepository.deleteById(id);
        return true;
    }
    return false;
    }
}
