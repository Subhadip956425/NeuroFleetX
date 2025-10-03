package com.hepsi.demo.services;

import com.hepsi.demo.model.Vehicle;
import com.hepsi.demo.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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
        Optional<Vehicle> optionalVehicle = vehicleRepository.findById(id);
        if (optionalVehicle.isPresent()) {
            Vehicle existingVehicle = optionalVehicle.get();
            existingVehicle.setVehicleNumber(updatedVehicle.getVehicleNumber());
            existingVehicle.setType(updatedVehicle.getType());
            existingVehicle.setStatus(updatedVehicle.getStatus());
            existingVehicle.setBattery(updatedVehicle.getBattery());
            existingVehicle.setFuel(updatedVehicle.getFuel());
            existingVehicle.setSpeed(updatedVehicle.getSpeed());
            existingVehicle.setLocation(updatedVehicle.getLocation());
            return vehicleRepository.save(existingVehicle);
        } else {
            return null; // You could throw a custom exception here instead
        }
    }

    @Override
    public boolean deleteVehicle(Long id) {
        if (vehicleRepository.existsById(id)) {
            vehicleRepository.deleteById(id);
            return true;
        } else {
            return false;
        }
    }
}
