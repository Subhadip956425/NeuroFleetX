package com.infosys.repository;

import com.infosys.model.Vehicle;
import com.infosys.model.VehicleStatus;
import com.infosys.model.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByType(VehicleType type);
    List<Vehicle> findByStatus(VehicleStatus status);
    List<Vehicle> findByTypeAndStatus(VehicleType type, VehicleStatus status);
}

