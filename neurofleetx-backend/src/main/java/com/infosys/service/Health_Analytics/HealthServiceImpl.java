package com.infosys.service.Health_Analytics;

import com.infosys.model.Health_Analytics.HealthReading;
import com.infosys.repository.Health_Analytics.HealthReadingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HealthServiceImpl implements HealthService {

    @Autowired
    private HealthReadingRepository readingRepo;

    @Override
    public HealthReading ingest(HealthReading reading) {
        return readingRepo.save(reading);
    }

    @Override
    public List<HealthReading> getRecentReadings(Long vehicleId, int limit) {
        // repository method returns top100; slice if needed
        List<HealthReading> list = readingRepo.findTop100ByVehicleIdOrderByTimestampDesc(vehicleId);
        return list.size() > limit ? list.subList(0, limit) : list;
    }

    @Override
    public List<HealthReading> getAllReadingsForVehicle(Long vehicleId) {
        return readingRepo.findByVehicleIdOrderByTimestampDesc(vehicleId);
    }
}
