package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.dto.response.TransactionResponse;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.repository.TransactionRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TransactionService {
    TransactionRepository transactionRepository;
    UserRepository userRepository;

    public List<TransactionResponse> getMyTransactions() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        return transactionRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
                .map(t -> TransactionResponse.builder()
                        .id(t.getId())
                        .amount(t.getAmount())
                        .type(t.getType())
                        .note(t.getNote())
                        .createdAt(t.getCreatedAt())
                        .bookingId(t.getBooking() != null ? t.getBooking().getId() : null)
                        .build())
                .toList();
    }
}
