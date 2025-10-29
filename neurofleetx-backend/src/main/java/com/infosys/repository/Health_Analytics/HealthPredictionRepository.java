package com.infosys.repository.Health_Analytics;

import com.infosys.model.Health_Analytics.MaintenancePrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthPredictionRepository extends JpaRepository<MaintenancePrediction, Long> {
    List<MaintenancePrediction> findByVehicleIdOrderByPredictedAtDesc(Long vehicleId);
}
