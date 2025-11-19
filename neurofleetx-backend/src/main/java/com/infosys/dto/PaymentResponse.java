package com.infosys.dto;

import com.infosys.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private Long bookingId;
    private Long customerId;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private Double amount;
    private String currency;
    private PaymentStatus status;
    private String paymentMethod;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
