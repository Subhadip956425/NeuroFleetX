package com.infosys.repository;

import com.infosys.model.Booking;
import com.infosys.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomer(User customer);
    List<Booking> findByVehicleId(Long vehicleId);
}
