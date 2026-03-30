package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.entity.PayoutRequest;
import com.mtritran.travelplatform.enums.BookingStatus;
import com.mtritran.travelplatform.enums.PayoutStatus;
import com.mtritran.travelplatform.repository.BookingRepository;
import com.mtritran.travelplatform.repository.PayoutRequestRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminReportService {
    BookingRepository bookingRepository;
    PayoutRequestRepository payoutRequestRepository;
    UserRepository userRepository;

    public Map<String, Object> getFinancialSummary() {
        List<Booking> completedBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .toList();

        BigDecimal totalRevenue = completedBookings.stream()
                .map(Booking::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Platform fee is 10%
        BigDecimal totalCommission = totalRevenue.multiply(new BigDecimal("0.1"));

        List<PayoutRequest> approvedPayouts = payoutRequestRepository.findAll().stream()
                .filter(p -> p.getStatus() == PayoutStatus.APPROVED)
                .toList();

        BigDecimal totalPayouts = approvedPayouts.stream()
                .map(PayoutRequest::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalGuides = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("GUIDE")))
                .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRevenue", totalRevenue);
        summary.put("totalCommission", totalCommission);
        summary.put("totalPayouts", totalPayouts);
        summary.put("totalGuides", totalGuides);
        summary.put("totalBookings", completedBookings.size());
        
        return summary;
    }
}
