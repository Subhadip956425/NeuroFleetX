package com.infosys.controller.Health_Analytics;

import com.infosys.dto.ReportRequest;
import com.infosys.dto.StatusUpdate;
import com.infosys.model.Health_Analytics.HealthReading;
import com.infosys.model.Health_Analytics.MaintenanceTicket;
import com.infosys.model.User;
import com.infosys.repository.UserRepository;
import com.infosys.service.Health_Analytics.HealthService;
import com.infosys.service.Health_Analytics.MaintenanceService;
import com.infosys.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@CrossOrigin(origins = "*")
public class MaintenanceController {

    @Autowired
    private MaintenanceService maintenanceService;

    @Autowired
    private HealthService healthService;

    @Autowired
    private UserRepository userRepository;  // ✅ ADD THIS

    @Autowired
    private UserService userService;


    // Drivers report issues
    @PostMapping("/report")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<MaintenanceTicket> reportIssue(
            @RequestBody ReportRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long reporterId = resolveUserIdFromPrincipal(userDetails);
        MaintenanceTicket ticket = maintenanceService.createTicket(
                req.getVehicleId(),
                reporterId,
                req.getDescription(),
                req.getSeverity()
        );
        return ResponseEntity.ok(ticket);
    }

    // Managers/Admins view all tickets
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<List<MaintenanceTicket>> listAll() {
        return ResponseEntity.ok(maintenanceService.listAll());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<MaintenanceTicket> updateStatus(@PathVariable Long id, @RequestBody StatusUpdate req) {
        return ResponseEntity.ok(maintenanceService.updateStatus(id, req.getStatus()));
    }

    // ✅ EVEN BETTER - Use UserService
    private Long resolveUserIdFromPrincipal(UserDetails userDetails) {
        User user = userService.getCurrentUser(); // This gets user from SecurityContext
        return user.getId();
    }


    // ingest reading (used by simulator or IoT)
    @PostMapping("/readings")
    //@PreAuthorize("hasRole('DRIVER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public HealthReading ingestReading(@RequestBody HealthReading reading) {
        return healthService.ingest(reading);
    }

    @GetMapping("/readings/{vehicleId}")
    public List<HealthReading> getRecentReadings(@PathVariable Long vehicleId) {
        return healthService.getRecentReadings(vehicleId, 50);
    }

    // tickets
    @GetMapping("/tickets")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public List<MaintenanceTicket> getOpenTickets() {
        return maintenanceService.getOpenTickets();
    }

    @GetMapping("/tickets/vehicle/{vehicleId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('DRIVER')")
    public List<MaintenanceTicket> getTicketsForVehicle(@PathVariable Long vehicleId) {
        return maintenanceService.getTicketsForVehicle(vehicleId);
    }

    @PostMapping("/tickets")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public MaintenanceTicket createTicket(@RequestBody MaintenanceTicket ticket) {
        return maintenanceService.createTicket(ticket);
    }

    @PutMapping("/tickets/{ticketId}/resolve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public MaintenanceTicket resolveTicket(@PathVariable Long ticketId) {
        return maintenanceService.resolveTicket(ticketId);
    }
}
