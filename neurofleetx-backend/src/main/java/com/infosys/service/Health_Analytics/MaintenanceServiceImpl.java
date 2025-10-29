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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

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

    // thresholds (tunable)
    private static final double TIRE_WEAR_THRESHOLD = 80.0; // % wear -> needs service
    private static final double ENGINE_TEMP_CRITICAL = 110.0; // deg C

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

//     Only perform analytics & prediction — no ticket creation.
    @Override
    public void evaluateHealthForVehicle(Long vehicleId) {
        List<HealthReading> readings =
                readingRepo.findTop100ByVehicleIdOrderByTimestampDesc(vehicleId);

        if (readings.isEmpty()) return;

        List<HealthReading> sample =
                readings.size() > 10 ? readings.subList(0, 10) : readings;

        if (sample.size() >= 3) {
            HealthReading newest = sample.get(0);
            HealthReading oldest = sample.get(sample.size() - 1);

            double wearDelta = newest.getTireWear() - oldest.getTireWear();
            long days = Math.max(1,
                    java.time.Duration.between(oldest.getTimestamp(), newest.getTimestamp()).toDays());
            double dailyIncrease = wearDelta / (double) days;

            double currentWear = newest.getTireWear();
            if (dailyIncrease > 0) {
                double daysToThreshold = (TIRE_WEAR_THRESHOLD - currentWear) / dailyIncrease;
                daysToThreshold = Math.max(0.0, daysToThreshold);

                // ✅ Only save prediction, no ticket creation
                MaintenancePrediction pred = MaintenancePrediction.builder()
                        .vehicleId(vehicleId)
                        .predictedAt(LocalDateTime.now())
                        .daysToService(daysToThreshold)
                        .reason("tire_wear_trend")
                        .build();
                predictionRepo.save(pred);
            }
        }
    }


    @Override
    public MaintenanceTicket createTicket(MaintenanceTicket ticket) {
        // fetch entities from IDs if needed
        if (ticket.getVehicle() == null || ticket.getReportedBy() == null) {
            throw new IllegalArgumentException("Vehicle and Reporter must be set");
        }
        ticket.setStatus(ticket.getStatus() != null ? ticket.getStatus() : "OPEN");
        ticket.setCreatedAt(ticket.getCreatedAt() != null ? ticket.getCreatedAt() : LocalDateTime.now());
        return ticketRepo.save(ticket);
    }


}
