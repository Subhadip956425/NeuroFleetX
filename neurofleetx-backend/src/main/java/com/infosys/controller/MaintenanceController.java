package com.infosys.controller;

import com.infosys.dto.ReportRequest;
import com.infosys.dto.StatusUpdate;
import com.infosys.model.MaintenanceTicket;
import com.infosys.service.MaintenanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    @Autowired
    private MaintenanceService maintenanceService;

    // Drivers report issues
    @PostMapping("/report")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<MaintenanceTicket> reportIssue(@RequestBody ReportRequest req, @AuthenticationPrincipal UserDetails userDetails) {
        // userDetails.getUsername() => email
        // find reporter id using UserRepository or UserService. For brevity, assume userService can resolve.
        Long reporterId = resolveUserIdFromPrincipal(userDetails);
        MaintenanceTicket ticket = maintenanceService.createTicket(req.getVehicleId(), reporterId, req.getDescription(), req.getSeverity());
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

    // helper - please implement resolving User id from principal (UserRepository)
    private Long resolveUserIdFromPrincipal(UserDetails userDetails) {
        // naive: find user by email in UserRepository (you have this repo)
        // implement actual lookup in your code; placeholder here:
        // User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow(...)
        // return user.getId();
        throw new UnsupportedOperationException("Implement resolveUserIdFromPrincipal using UserRepository");
    }
}
