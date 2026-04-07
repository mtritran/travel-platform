package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.entity.Transaction;
import com.mtritran.travelplatform.enums.TransactionType;
import com.mtritran.travelplatform.repository.TransactionRepository;
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
        TransactionRepository transactionRepository;
        UserRepository userRepository;

        public Map<String, Object> getFinancialSummary() {
                // Total Escrow In: All customer payments (100% of price)
                List<Transaction> revenues = transactionRepository.findAllByTypeInOrderByCreatedAtDesc(List.of(TransactionType.REVENUE));
                BigDecimal grossRevenue = revenues.stream()
                                .map(Transaction::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Total Refunds: Money returned to customers
                List<Transaction> refunds = transactionRepository.findAllByTypeInOrderByCreatedAtDesc(List.of(TransactionType.REFUND));
                BigDecimal totalRefunds = refunds.stream()
                                .map(Transaction::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Net Revenue = Money truly entering the system
                BigDecimal netRevenue = grossRevenue.subtract(totalRefunds);

                // Total Guide Payouts (80%)
                List<Transaction> guideIncomes = transactionRepository.findAllByTypeInOrderByCreatedAtDesc(List.of(TransactionType.INCOME));
                BigDecimal totalGuidePayouts = guideIncomes.stream()
                                .map(Transaction::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long uniqueBookings = revenues.stream()
                                .map(t -> t.getBooking() != null ? t.getBooking().getId() : 
                                         (t.getTourRequest() != null ? t.getTourRequest().getId() : null))
                                .filter(java.util.Objects::nonNull)
                                .distinct()
                                .count();

                long totalGuides = userRepository.findAll().stream()
                                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("GUIDE")))
                                .count();

                Map<String, Object> summary = new HashMap<>();
                summary.put("totalRevenue", netRevenue); // Use Net Revenue for dashboard cards
                summary.put("totalGuidePayouts", totalGuidePayouts);
                summary.put("totalGuides", totalGuides);
                summary.put("totalBookings", uniqueBookings);

                return summary;
        }

        public List<Map<String, Object>> getTransactionHistory() {
                // For Admin Report, we show the platform's escrow wallet movement
                // Only include transactions that represent money entering (+) or leaving (-) the platform
                List<Transaction> allEscrowTx = transactionRepository.findAllByTypeInOrderByCreatedAtDesc(
                                List.of(TransactionType.REVENUE, TransactionType.INCOME, TransactionType.REFUND, TransactionType.WITHDRAW));

                return allEscrowTx.stream().map(t -> {
                        Map<String, Object> tx = new HashMap<>();
                        tx.put("id", t.getId());
                        
                        // Decide type for Admin list: REVENUE is an income for escrow (+), others are expenses (-)
                        String description = t.getNote();
                        if (t.getType() == TransactionType.REVENUE && t.getUser() != null) {
                                description += " bởi người dùng " + t.getUser().getFullName();
                        }

                        if (t.getType() == TransactionType.REVENUE) {
                                tx.put("type", "INCOME");
                                tx.put("description", description);
                        } else {
                                tx.put("type", "EXPENSE");
                                tx.put("description", description);
                        }

                        tx.put("amount", t.getAmount());
                        tx.put("date", t.getCreatedAt());
                        tx.put("reference", t.getBooking() != null ? t.getBooking().getBookingCode() : 
                                           (t.getTourRequest() != null ? t.getTourRequest().getRequestCode() : "N/A"));
                        return tx;
                }).toList();
        }
}
