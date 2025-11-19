package com.infosys.controller;

import com.infosys.dto.PaymentOrderRequest;
import com.infosys.dto.PaymentVerificationRequest;
import com.infosys.model.Payment;
import com.infosys.service.PaymentService;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private PaymentService paymentService;

    /**
     * Create Razorpay order for booking
     */
    @PostMapping("/create-order")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createPaymentOrder(@RequestBody PaymentOrderRequest request) {
        try {
            logger.info("💳 Creating payment order for booking: {}", request.getBookingId());
            JSONObject orderDetails = paymentService.createRazorpayOrder(request);
            return ResponseEntity.ok(orderDetails.toMap());
        } catch (Exception e) {
            logger.error("❌ Error creating payment order: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verify payment after Razorpay success
     */
    @PostMapping("/verify")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> verifyPayment(@RequestBody PaymentVerificationRequest request) {
        try {
            logger.info("🔍 Verifying payment: {}", request.getRazorpayPaymentId());
            Payment payment = paymentService.verifyPayment(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Payment verified successfully",
                    "paymentId", payment.getId(),
                    "status", payment.getStatus()
            ));
        } catch (Exception e) {
            logger.error("❌ Error verifying payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Get customer payment history
     */
    @GetMapping("/customer/{customerId}/history")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<?> getPaymentHistory(@PathVariable Long customerId) {
        try {
            List<Payment> payments = paymentService.getCustomerPayments(customerId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            logger.error("❌ Error fetching payment history: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get payment for specific booking
     */
    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<?> getPaymentByBooking(@PathVariable Long bookingId) {
        try {
            Payment payment = paymentService.getPaymentByBookingId(bookingId);
            if (payment == null) {
                return ResponseEntity.ok(Map.of("status", "NO_PAYMENT"));
            }
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            logger.error("❌ Error fetching payment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get revenue statistics (Admin only)
     */
    @GetMapping("/revenue/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getRevenueStatistics() {
        try {
            Map<String, Object> stats = paymentService.getRevenueStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("❌ Error fetching revenue stats: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
