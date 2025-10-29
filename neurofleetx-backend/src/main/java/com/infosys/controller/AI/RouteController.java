package com.infosys.controller.AI;

import com.infosys.dto.CreateRouteRequest;
import com.infosys.model.AI.Route;
import com.infosys.service.AI.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = "*")
public class RouteController {

    @Autowired
    private RouteService routeService;

    // Admin: Get all routes
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Route>> getAllRoutes() {
        List<Route> routes = routeService.getAllRoutes();
        return ResponseEntity.ok(routes);
    }


    // -----------------------------
    // Create a new route (Manager/Admin)
    // -----------------------------
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Route> createRoute(@RequestBody CreateRouteRequest req) {
        Route created = routeService.createRoute(req);
        return ResponseEntity.ok(created);
    }

    // Admin: Filter routes by status or driver
    @GetMapping("/filter")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Route>> filterRoutes(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long driverId
    ) {
        List<Route> routes = routeService.filterRoutes(status, driverId);
        return ResponseEntity.ok(routes);
    }

    // -----------------------------
    // Assign driver & vehicle (Manager/Admin)
    // -----------------------------
    @PostMapping("/assign/{routeId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public Route assignRoute(@PathVariable Long routeId,
                             @RequestParam Long vehicleId,
                             @RequestParam Long driverId) {
        return routeService.assignDriverAndVehicle(routeId, vehicleId, driverId);
    }

    // -----------------------------
    // Get routes for manager
    // -----------------------------
    @GetMapping("/manager")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public List<Route> getManagerRoutes() {
        return routeService.getRoutesForManager();
    }

    // -----------------------------
    // Get routes for driver
    // -----------------------------
    @GetMapping("/driver/{driverId}")
    @PreAuthorize("hasRole('DRIVER')")
    public List<Route> getDriverRoutes(@PathVariable Long driverId) {
        return routeService.getRoutesForDriver(driverId);
    }

    // -----------------------------
    // Update route status (Driver)
    // -----------------------------
    @PatchMapping("/status/{routeId}")
    @PreAuthorize("hasRole('DRIVER')")
    public Route updateStatus(@PathVariable Long routeId,
                              @RequestParam String status) {
        return routeService.updateRouteStatus(routeId, status);
    }
}
