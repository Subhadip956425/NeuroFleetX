package com.infosys.service;

import com.infosys.dto.PaymentOrderRequest;
import com.infosys.dto.PaymentVerificationRequest;
import com.infosys.model.Payment;
import org.json.JSONObject;

import java.util.List;
import java.util.Map;

public interface PaymentService {
    
    // Create Razorpay order
    JSONObject createRazorpayOrder(PaymentOrderRequest request) throws Exception;
    
    // Verify payment signature
    Payment verifyPayment(PaymentVerificationRequest request) throws Exception;
    
    // Get payment by booking ID
    Payment getPaymentByBookingId(Long bookingId);
    
    // Get customer payment history
    List<Payment> getCustomerPayments(Long customerId);
    
    // Get total revenue
    Double getTotalRevenue();
    
    // Get revenue statistics
    Map<String, Object> getRevenueStatistics();
}
