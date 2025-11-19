package com.infosys.model;

public enum PaymentStatus {
    PENDING,      // Payment order created
    COMPLETED,    // Payment successful
    FAILED,       // Payment failed
    REFUNDED      // Payment refunded
}
