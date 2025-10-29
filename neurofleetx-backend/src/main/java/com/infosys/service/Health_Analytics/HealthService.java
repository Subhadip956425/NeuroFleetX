package com.infosys.service.Health_Analytics;

import com.infosys.model.Health_Analytics.HealthReading;

import java.util.List;

public interface HealthService {
    HealthReading ingest(HealthReading reading); // persist a reading
    List<HealthReading> getRecentReadings(Long vehicleId, int limit);
    List<HealthReading> getAllReadingsForVehicle(Long vehicleId);
}
