package com.infosys.service;

import com.infosys.dto.VehicleRequest;
import com.infosys.dto.VehicleResponse;

import java.util.List;

public interface VehicleService {

    VehicleResponse createVehicle(VehicleRequest req);

    VehicleResponse updateVehicle(Long id, VehicleRequest req);

    void deleteVehicle(Long id);

    VehicleResponse getVehicle(Long id);

    List<VehicleResponse> listVehicles();

    // Advanced APIs
    List<VehicleResponse> filterVehicles(Long typeId, Long statusId);

    VehicleResponse updateTelemetry(Long vehicleId, Double speed, Double battery, Double fuel,
                                    Double latitude, Double longitude);

    // Assignment APIs
    VehicleResponse assignDriver(Long vehicleId, Long driverId);

    VehicleResponse unassignDriver(Long vehicleId);
}
