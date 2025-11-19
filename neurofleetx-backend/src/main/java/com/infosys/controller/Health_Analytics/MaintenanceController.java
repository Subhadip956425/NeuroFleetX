package com.infosys.controller.Health_Analytics;

import com.infosys.dto.ReportRequest;
import com.infosys.dto.StatusUpdate;
import com.infosys.model.Health_Analytics.HealthReading;
import com.infosys.model.Health_Analytics.MaintenancePrediction;
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
import java.util.Map;

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
    // Drivers AND Customers can report issues
    @PostMapping("/report")
    @PreAuthorize("hasAnyRole('DRIVER', 'CUSTOMER')") // ✅ CHANGED: Allow CUSTOMER too
    public ResponseEntity<MaintenanceTicket> reportIssue(
            @RequestBody ReportRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long reporterId = resolveUserIdFromPrincipal(userDetails);

        // ✅ Add prefix based on role
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(auth -> auth.getAuthority())
                .orElse("USER");

        String prefix = role.contains("CUSTOMER") ? "CUSTOMER REPORT: " : "";

        MaintenanceTicket ticket = maintenanceService.createTicket(
                req.getVehicleId(),
                reporterId,
                prefix + req.getDescription(),
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

    @GetMapping("resolved/tickets")
    public ResponseEntity<?> getResolvedTickets() {
        try {
            List<MaintenanceTicket> resolvedTickets = maintenanceService.getResolvedTickets();
            return ResponseEntity.ok(resolvedTickets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("all/tickets")
    public ResponseEntity<?> getAllTickets() {
        try {
            List<MaintenanceTicket> allTickets = maintenanceService.getAllTickets();
            return ResponseEntity.ok(allTickets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ========== ✅ NEW: AI PREDICTION ENDPOINTS ==========

    @GetMapping("/prediction/{vehicleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DRIVER')")
    public ResponseEntity<?> getPrediction(@PathVariable Long vehicleId) {
        try {
            System.out.println("🤖 Getting prediction for vehicle: " + vehicleId);

            MaintenancePrediction prediction = maintenanceService.getLatestPrediction(vehicleId);

            if (prediction == null) {
                System.out.println("⚠️ No prediction found, triggering evaluation...");
                // Trigger evaluation if no prediction exists
                maintenanceService.evaluateHealthForVehicle(vehicleId);
                prediction = maintenanceService.getLatestPrediction(vehicleId);
            }

            if (prediction == null) {
                return ResponseEntity.ok(Map.of(
                        "data", Map.of(
                                "vehicleId", vehicleId,
                                "status", "No Data",
                                "message", "No health readings available for this vehicle"
                        )
                ));
            }

            return ResponseEntity.ok(Map.of("data", prediction));
        } catch (Exception e) {
            System.err.println("❌ Error getting prediction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/predictions/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> getAllPredictions() {
        try {
            System.out.println("📊 Getting all predictions...");
            List<MaintenancePrediction> predictions = maintenanceService.getAllPredictions();
            System.out.println("✅ Found " + predictions.size() + " predictions");
            return ResponseEntity.ok(predictions);
        } catch (Exception e) {
            System.err.println("❌ Error getting all predictions: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/predictions/critical")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> getCriticalVehicles() {
        try {
            System.out.println("🚨 Getting critical vehicles...");
            List<MaintenancePrediction> critical = maintenanceService.getCriticalPredictions();
            System.out.println("✅ Found " + critical.size() + " critical vehicles");
            return ResponseEntity.ok(critical);
        } catch (Exception e) {
            System.err.println("❌ Error getting critical vehicles: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/evaluate/{vehicleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> evaluateVehicle(@PathVariable Long vehicleId) {
        try {
            System.out.println("🔍 Triggering evaluation for vehicle: " + vehicleId);
            maintenanceService.evaluateHealthForVehicle(vehicleId);

            MaintenancePrediction prediction = maintenanceService.getLatestPrediction(vehicleId);

            return ResponseEntity.ok(Map.of(
                    "data", prediction != null ? prediction : Map.of(),
                    "message", "Evaluation complete"
            ));
        } catch (Exception e) {
            System.err.println("❌ Error evaluating vehicle: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> getMaintenanceStats() {
        try {
            System.out.println("📊 Getting maintenance statistics...");
            Map<String, Object> stats = maintenanceService.getStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("❌ Error getting stats: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ NEW: Customer Issue Reporting
    @PostMapping("/customer/report-issue")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<?> reportIssueAsCustomer(
            @RequestBody ReportRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long customerId = resolveUserIdFromPrincipal(userDetails);

            // Create ticket with customer as reporter
            MaintenanceTicket ticket = maintenanceService.createTicket(
                    req.getVehicleId(),
                    customerId,
                    "CUSTOMER REPORT: " + req.getDescription(),
                    req.getSeverity() != null ? req.getSeverity() : "MEDIUM"
            );

            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/customer/my-issues")
    @PreAuthorize("hasRole('CUSTOMER' or hasRole('ROLE_CUSTOMER'))")
    public ResponseEntity<?> getCustomerIssues(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long customerId = resolveUserIdFromPrincipal(userDetails);
            List<MaintenanceTicket> issues = maintenanceService.listByReporter(customerId);
            return ResponseEntity.ok(issues);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }



}
