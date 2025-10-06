package com.infosys.repository;

import com.infosys.model.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VehicleStatusRepository extends JpaRepository<VehicleStatus, Long> {
    Optional<VehicleStatus> findByName(String name);
}

