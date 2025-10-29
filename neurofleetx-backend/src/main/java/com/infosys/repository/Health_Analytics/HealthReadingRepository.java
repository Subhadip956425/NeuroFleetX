package com.infosys.repository.Health_Analytics;

import com.infosys.model.Health_Analytics.HealthReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthReadingRepository extends JpaRepository<HealthReading, Long> {
    List<HealthReading> findTop100ByVehicleIdOrderByTimestampDesc(Long vehicleId);
    List<HealthReading> findByVehicleIdOrderByTimestampDesc(Long vehicleId);
}
