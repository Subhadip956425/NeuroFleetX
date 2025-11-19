package com.infosys.service;

import com.infosys.dto.PaymentOrderRequest;
import com.infosys.dto.PaymentVerificationRequest;
import com.infosys.model.Booking.Booking;
import com.infosys.model.Payment;
import com.infosys.model.PaymentStatus;
import com.infosys.repository.BookingRepository;
import com.infosys.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PaymentServiceImpl implements PaymentService {

    // ✅ FIXED: Use fully qualified class name to avoid ambiguity
    private static final org.slf4j.Logger logger =
            org.slf4j.LoggerFactory.getLogger(PaymentServiceImpl.class);

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Autowired
    private PaymentRepository paymentRepo;

    @Autowired
    private BookingRepository bookingRepo;

    @Override
    @Transactional
    public JSONObject createRazorpayOrder(PaymentOrderRequest request) throws Exception {
        logger.info("💳 Creating Razorpay order for booking ID: {}", request.getBookingId());

        // 1. Get booking details
        Booking booking = bookingRepo.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // 2. Check if payment already exists
        Optional<Payment> existingPayment = paymentRepo.findByBookingId(booking.getId());
        if (existingPayment.isPresent() && existingPayment.get().getStatus() == PaymentStatus.COMPLETED) {
            throw new RuntimeException("Payment already completed for this booking");
        }

        // 3. Initialize Razorpay client
        RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

        // 4. Create order request
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", (int)(booking.getPrice() * 100)); // Amount in paise
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "booking_" + booking.getId());

        JSONObject notes = new JSONObject();
        notes.put("booking_id", booking.getId());
        notes.put("customer_id", booking.getCustomerId());
        notes.put("vehicle_type", booking.getVehicleType());
        orderRequest.put("notes", notes);

        // 5. Create Razorpay order
        Order order = razorpay.orders.create(orderRequest);

        // ✅ FIXED: Cast to String to avoid ambiguity
        String orderId = (String) order.get("id");
        logger.info("✅ Razorpay order created: {}", orderId);

        // 6. Save payment record
        Payment payment;
        if (existingPayment.isPresent()) {
            payment = existingPayment.get();
            payment.setRazorpayOrderId(orderId);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setUpdatedAt(LocalDateTime.now());
        } else {
            payment = Payment.builder()
                    .booking(booking)
                    .customerId(booking.getCustomerId())
                    .razorpayOrderId(orderId)
                    .amount(booking.getPrice())
                    .currency("INR")
                    .status(PaymentStatus.PENDING)
                    .description("Payment for " + booking.getVehicleType() + " booking")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        }

        paymentRepo.save(payment);

        // 7. Return order details for frontend
        JSONObject response = new JSONObject();
        response.put("orderId", orderId); // ✅ FIXED: Use String variable
        response.put("amount", booking.getPrice());
        response.put("currency", "INR");
        response.put("key", razorpayKeyId);
        response.put("name", "NeuroFleetX");
        response.put("description", "Booking Payment - " + booking.getVehicleType());
        response.put("bookingId", booking.getId());

        return response;
    }

    @Override
    @Transactional
    public Payment verifyPayment(PaymentVerificationRequest request) throws Exception {
        logger.info("🔍 Verifying payment: {}", request.getRazorpayPaymentId());

        // 1. Find payment by order ID
        Payment payment = paymentRepo.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        // 2. Verify signature
        String generatedSignature = generateSignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId()
        );

        if (!generatedSignature.equals(request.getRazorpaySignature())) {
            logger.error("❌ Invalid payment signature");
            payment.setStatus(PaymentStatus.FAILED);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepo.save(payment);
            throw new RuntimeException("Payment verification failed: Invalid signature");
        }

        // 3. Update payment status
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());

        paymentRepo.save(payment);
        logger.info("✅ Payment verified successfully for booking {}", payment.getBooking().getId());

        return payment;
    }

    /**
     * Generate HMAC SHA256 signature for verification
     */
    private String generateSignature(String orderId, String paymentId) throws Exception {
        String data = orderId + "|" + paymentId;
        Mac sha256HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(razorpayKeySecret.getBytes(), "HmacSHA256");
        sha256HMAC.init(secretKey);
        byte[] hash = sha256HMAC.doFinal(data.getBytes());
        return bytesToHex(hash);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    @Override
    public Payment getPaymentByBookingId(Long bookingId) {
        return paymentRepo.findByBookingId(bookingId)
                .orElse(null);
    }

    @Override
    public List<Payment> getCustomerPayments(Long customerId) {
        return paymentRepo.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Override
    public Double getTotalRevenue() {
        Double revenue = paymentRepo.getTotalRevenue();
        return revenue != null ? revenue : 0.0;
    }

    @Override
    public Map<String, Object> getRevenueStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Total revenue
        Double totalRevenue = getTotalRevenue();
        stats.put("totalRevenue", totalRevenue);

        // Today's revenue
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(23, 59, 59);
        Double todayRevenue = paymentRepo.getRevenueByDateRange(todayStart, todayEnd);
        stats.put("todayRevenue", todayRevenue != null ? todayRevenue : 0.0);

        // This month's revenue
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = LocalDateTime.now();
        Double monthRevenue = paymentRepo.getRevenueByDateRange(monthStart, monthEnd);
        stats.put("monthRevenue", monthRevenue != null ? monthRevenue : 0.0);

        // Payment counts
        List<Payment> allPayments = paymentRepo.findAll();
        stats.put("totalPayments", allPayments.size());
        stats.put("completedPayments", allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .count());
        stats.put("pendingPayments", allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .count());
        stats.put("failedPayments", allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.FAILED)
                .count());

        return stats;
    }
}
