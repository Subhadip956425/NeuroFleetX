package com.infosys.model.Booking;

/*
 Purpose: Booking lifecycle states
*/
public enum BookingStatus {
    PENDING,    // created by customer; awaiting manager auto-confirm or immediate confirm policy
    CONFIRMED,  // vehicle reserved
    CANCELLED,
    COMPLETED,
    REJECTED,
    }
