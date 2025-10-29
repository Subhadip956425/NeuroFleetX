package com.infosys.service.AI;


import com.infosys.dto.CreateRouteRequest;
import com.infosys.model.AI.Route;

import java.util.List;

public interface RouteService {
    Route createRoute(CreateRouteRequest req);
    Route assignRoute(Long routeId, Long vehicleId, Long driverId);

    Route assignDriverAndVehicle(Long routeId, Long driverId, Long vehicleId);
    List<Route> getRoutesForManager();
    List<Route> getRoutesForDriver(Long driverId);
    Route updateRouteStatus(Long routeId, String status);
    List<Route> getAllRoutes();
    List<Route> filterRoutes(String status, Long driverId);
}
