package com.infosys.service.Health_Analytics;

import com.infosys.model.Health_Analytics.HealthReading;
import com.infosys.model.Health_Analytics.MaintenancePrediction;
import com.infosys.model.Health_Analytics.MaintenanceTicket;
import com.infosys.model.User;
import com.infosys.model.Vehicle;
import com.infosys.repository.Health_Analytics.HealthPredictionRepository;
import com.infosys.repository.Health_Analytics.HealthReadingRepository;
import com.infosys.repository.Health_Analytics.MaintenanceTicketRepository;
import com.infosys.repository.UserRepository;
import com.infosys.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MaintenanceServiceImpl implements MaintenanceService {

    @Autowired
    private MaintenanceTicketRepository ticketRepo;
    @Autowired
    private VehicleRepository vehicleRepo;
    @Autowired
    private UserRepository userRepo;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private HealthReadingRepository readingRepo;
    @Autowired
    private HealthPredictionRepository predictionRepo;

    // ✅ INJECT RestTemplate (use the ML-specific one with longer timeouts)
    @Autowired
    @Qualifier("mlServiceRestTemplate")
    private RestTemplate restTemplate;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    // ✅ Configurable thresholds
    private static final double TIRE_WEAR_THRESHOLD = 80.0;
    private static final double ENGINE_TEMP_CRITICAL = 110.0;
    private static final double BATTERY_CRITICAL = 60.0;
    private static final double FUEL_CRITICAL = 20.0;
    private static final double BRAKE_WEAR_CRITICAL = 80.0;
    private static final int DAYS_SINCE_SERVICE_THRESHOLD = 90;

    @Override
    public MaintenanceTicket createTicket(Long vehicleId, Long reporterId, String desc, String severity) {
        Vehicle v = vehicleRepo.findById(vehicleId).orElseThrow(() -> new RuntimeException("Vehicle not found"));
        User u = userRepo.findById(reporterId).orElseThrow(() -> new RuntimeException("Reporter not found"));

        MaintenanceTicket t = new MaintenanceTicket();
        t.setVehicle(v);
        t.setReportedBy(u);
        t.setDescription(desc);
        t.setSeverity(severity);
        t.setStatus("OPEN");
        t.setCreatedAt(LocalDateTime.now());
        return ticketRepo.save(t);
    }

    @Override
    public void evaluateHealthForVehicle(Long vehicleId) {
        try {
            // Get latest health reading
            List<HealthReading> readings =
                    readingRepo.findTop100ByVehicleIdOrderByTimestampDesc(vehicleId);

            if (readings.isEmpty()) {
                System.out.println("⚠️ No health readings found for vehicle " + vehicleId);
                return;
            }

            HealthReading latest = readings.get(0);
            System.out.println("📊 Latest reading for vehicle " + vehicleId + ": " + latest);

            // ✅ Prepare data for ML service with null-safety
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("mileage", latest.getMileage() != null ? latest.getMileage() : 75000.0);
            requestData.put("engineTemp", latest.getEngineTemp() != null ? latest.getEngineTemp() : 90.0);
            requestData.put("tirePressure", latest.getTirePressure() != null ? latest.getTirePressure() : 32.0);
            requestData.put("batteryHealth", latest.getBatteryHealth() != null ? latest.getBatteryHealth() :
                    (latest.getBatteryLevel() != null ? latest.getBatteryLevel() : 85.0));
            requestData.put("oilLevel", latest.getFuelLevel() != null ? latest.getFuelLevel() : 70.0);
            requestData.put("brakeWear", latest.getTireWear() != null ? latest.getTireWear() : 45.0);
            requestData.put("daysSinceLastMaintenance", calculateDaysSinceLastMaintenance(vehicleId));

            // ✅ Call Python ML service
            String url = mlServiceUrl + "/maintenance/predict/" + vehicleId;
            System.out.println("🔧 Calling ML service: " + url);
            System.out.println("📤 Request data: " + requestData);

            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(url, requestData, Map.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    System.out.println("✅ ML service response: " + response.getBody());

                    Map<String, Object> mlResult = (Map<String, Object>) response.getBody().get("data");

                    if (mlResult != null) {
                        // ✅ Save prediction
                        MaintenancePrediction pred = MaintenancePrediction.builder()
                                .vehicleId(vehicleId)
                                .predictedAt(LocalDateTime.now())
                                .daysToService(((Number) mlResult.get("days_until_maintenance")).doubleValue())
                                .reason(mlResult.get("status").toString())
                                .build();
                        predictionRepo.save(pred);
                        System.out.println("💾 Saved prediction: " + pred);

                        // ✅ Auto-create ticket for critical issues
                        List<Map<String, Object>> criticalIssues =
                                (List<Map<String, Object>>) mlResult.get("critical_issues");

                        if (criticalIssues != null && !criticalIssues.isEmpty()) {
                            System.out.println("🚨 Found " + criticalIssues.size() + " critical issues");
                            for (Map<String, Object> issue : criticalIssues) {
                                createAutoTicket(vehicleId, issue);
                            }
                        } else {
                            System.out.println("✅ No critical issues for vehicle " + vehicleId);
                        }
                    }
                } else {
                    System.err.println("⚠️ ML service returned non-successful status: " + response.getStatusCode());
                }
            } catch (Exception mlError) {
                System.err.println("❌ ML Service call failed for vehicle " + vehicleId + ": " + mlError.getMessage());
                mlError.printStackTrace();
                // Continue without ML prediction - service is resilient
            }

        } catch (Exception e) {
            System.err.println("❌ Error evaluating health for vehicle " + vehicleId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void createAutoTicket(Long vehicleId, Map<String, Object> issue) {
        Vehicle v = vehicleRepo.findById(vehicleId).orElse(null);
        if (v == null) {
            System.err.println("⚠️ Vehicle not found: " + vehicleId);
            return;
        }

        // Check if similar ticket already exists
        List<MaintenanceTicket> existing = ticketRepo.findByVehicleIdAndStatus(vehicleId, "OPEN");
        String issueDesc = issue.get("issue").toString();

        boolean alreadyExists = existing.stream()
                .anyMatch(t -> t.getDescription().contains(issueDesc));

        if (!alreadyExists) {
            MaintenanceTicket autoTicket = new MaintenanceTicket();
            autoTicket.setVehicle(v);
            autoTicket.setDescription("AUTO: " + issueDesc + " - " + issue.get("action"));
            autoTicket.setSeverity("CRITICAL");
            autoTicket.setStatus("OPEN");
            autoTicket.setCreatedAt(LocalDateTime.now());
            ticketRepo.save(autoTicket);

            System.out.println("🎫 Auto-created ticket for vehicle " + vehicleId + ": " + issueDesc);

            // Broadcast to managers
            messagingTemplate.convertAndSend("/topic/maintenance/critical", autoTicket);
        } else {
            System.out.println("ℹ️ Similar ticket already exists for vehicle " + vehicleId);
        }
    }

    private int calculateDaysSinceLastMaintenance(Long vehicleId) {
        // Get last resolved ticket for this vehicle
        List<MaintenanceTicket> resolved = ticketRepo.findByVehicleIdAndStatus(vehicleId, "RESOLVED");
        if (resolved.isEmpty()) {
            return 90; // Default: assume 90 days
        }

        MaintenanceTicket last = resolved.stream()
                .filter(t -> t.getResolvedAt() != null)
                .max((a, b) -> a.getResolvedAt().compareTo(b.getResolvedAt()))
                .orElse(null);

        if (last != null && last.getResolvedAt() != null) {
            return (int) java.time.temporal.ChronoUnit.DAYS.between(
                    last.getResolvedAt().toLocalDate(),
                    LocalDate.now()
            );
        }

        return 90;
    }

    @Override
    public List<MaintenanceTicket> listAll() {
        return ticketRepo.findAll();
    }

    @Override
    public List<MaintenanceTicket> listByReporter(Long reporterId) {
        return ticketRepo.findByReportedById(reporterId);
    }

    @Override
    public MaintenanceTicket updateStatus(Long ticketId, String status) {
        MaintenanceTicket t = ticketRepo.findById(ticketId).orElseThrow(() -> new RuntimeException("Ticket not found"));
        t.setStatus(status);
        return ticketRepo.save(t);
    }

    @Override
    public List<MaintenanceTicket> getOpenTickets() {
        return ticketRepo.findByStatus("OPEN");
    }

    @Override
    public List<MaintenanceTicket> getTicketsForVehicle(Long vehicleId) {
        return ticketRepo.findByVehicleId(vehicleId);
    }

    @Override
    public MaintenanceTicket resolveTicket(Long ticketId) {
        MaintenanceTicket t = ticketRepo.findById(ticketId).orElseThrow();
        t.setStatus("RESOLVED");
        t.setResolvedAt(LocalDateTime.now());
        t = ticketRepo.save(t);
        messagingTemplate.convertAndSend("/topic/maintenance", t);
        return t;
    }

    @Override
    public MaintenanceTicket createTicket(MaintenanceTicket ticket) {
        if (ticket.getVehicle() == null || ticket.getReportedBy() == null) {
            throw new IllegalArgumentException("Vehicle and Reporter must be set");
        }
        ticket.setStatus(ticket.getStatus() != null ? ticket.getStatus() : "OPEN");
        ticket.setCreatedAt(ticket.getCreatedAt() != null ? ticket.getCreatedAt() : LocalDateTime.now());
        return ticketRepo.save(ticket);
    }

    public List<MaintenanceTicket> getResolvedTickets() {
        return ticketRepo.findByStatus("RESOLVED");
    }

    public List<MaintenanceTicket> getAllTickets() {
        return ticketRepo.findAll();
    }

    // ========== ✅ NEW: AI PREDICTION SERVICE METHODS ==========

    @Override
    public MaintenancePrediction getLatestPrediction(Long vehicleId) {
        try {
            System.out.println("🔍 Getting latest prediction for vehicle: " + vehicleId);

            // Get most recent prediction
            List<MaintenancePrediction> predictions = predictionRepo.findByVehicleIdOrderByPredictedAtDesc(vehicleId);

            if (predictions.isEmpty()) {
                System.out.println("⚠️ No predictions found for vehicle " + vehicleId);
                return null;
            }

            MaintenancePrediction latest = predictions.get(0);
            System.out.println("✅ Found prediction: " + latest);
            return latest;

        } catch (Exception e) {
            System.err.println("❌ Error getting latest prediction: " + e.getMessage());
            return null;
        }
    }

    @Override
    public List<MaintenancePrediction> getAllPredictions() {
        try {
            // Get all unique vehicle predictions (latest for each vehicle)
            List<MaintenancePrediction> allPredictions = predictionRepo.findAll();

            // Group by vehicleId and get latest for each
            Map<Long, MaintenancePrediction> latestByVehicle = new HashMap<>();

            for (MaintenancePrediction pred : allPredictions) {
                Long vehicleId = pred.getVehicleId();

                if (!latestByVehicle.containsKey(vehicleId) ||
                        pred.getPredictedAt().isAfter(latestByVehicle.get(vehicleId).getPredictedAt())) {
                    latestByVehicle.put(vehicleId, pred);
                }
            }

            return new ArrayList<>(latestByVehicle.values());

        } catch (Exception e) {
            System.err.println("❌ Error getting all predictions: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    public List<MaintenancePrediction> getCriticalPredictions() {
        try {
            List<MaintenancePrediction> allPredictions = getAllPredictions();

            // Filter critical (days to service <= 3 or reason contains "Critical")
            return allPredictions.stream()
                    .filter(p -> p.getDaysToService() <= 3 ||
                            (p.getReason() != null && p.getReason().contains("Critical")))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            System.err.println("❌ Error getting critical predictions: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    public Map<String, Object> getStatistics() {
        try {
            List<MaintenancePrediction> allPredictions = getAllPredictions();
            List<MaintenanceTicket> allTickets = getAllTickets();

            // Calculate statistics
            long healthyCount = allPredictions.stream()
                    .filter(p -> p.getReason() != null && p.getReason().equals("Healthy"))
                    .count();

            long dueCount = allPredictions.stream()
                    .filter(p -> p.getReason() != null && p.getReason().equals("Due"))
                    .count();

            long criticalCount = allPredictions.stream()
                    .filter(p -> p.getReason() != null && p.getReason().equals("Critical"))
                    .count();

            long openTickets = allTickets.stream()
                    .filter(t -> "OPEN".equals(t.getStatus()))
                    .count();

            long resolvedTickets = allTickets.stream()
                    .filter(t -> "RESOLVED".equals(t.getStatus()))
                    .count();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalVehicles", allPredictions.size());
            stats.put("healthy", healthyCount);
            stats.put("due", dueCount);
            stats.put("critical", criticalCount);
            stats.put("openTickets", openTickets);
            stats.put("resolvedTickets", resolvedTickets);
            stats.put("lastUpdated", LocalDateTime.now());

            return stats;

        } catch (Exception e) {
            System.err.println("❌ Error calculating statistics: " + e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

}
