package com.mtritran.travelplatform.service;

import com.mtritran.travelplatform.entity.PayoutRequest;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.PayoutStatus;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.repository.PayoutRequestRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import com.mtritran.travelplatform.repository.TransactionRepository;
import com.mtritran.travelplatform.entity.Transaction;
import com.mtritran.travelplatform.enums.TransactionType;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PayoutService {
    PayoutRequestRepository payoutRequestRepository;
    UserRepository userRepository;
    TransactionRepository transactionRepository;
    PasswordEncoder passwordEncoder;

    @Transactional
    public PayoutRequest createRequest(BigDecimal amount, String bankName, String bankAccountNumber, String bankAccountName, String pin) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
 
        // Verify PIN
        if (user.getPaymentPin() == null || !passwordEncoder.matches(pin, user.getPaymentPin())) {
            throw new AppException(ErrorCode.INVALID_PAYMENT_PIN);
        }

        if (user.getBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        // Deduct balance immediately to prevent double spending
        user.setBalance(user.getBalance().subtract(amount));
        userRepository.save(user);

        PayoutRequest request = PayoutRequest.builder()
                .user(user)
                .amount(amount)
                .bankName(bankName)
                .bankAccountNumber(bankAccountNumber)
                .bankAccountName(bankAccountName)
                .status(PayoutStatus.COMPLETED)
                .processedAt(LocalDateTime.now())
                .build();

        PayoutRequest saved = payoutRequestRepository.save(request);

        // Log Withdraw Transaction
        transactionRepository.save(Transaction.builder()
                .user(user)
                .amount(amount)
                .type(TransactionType.WITHDRAW)
                .note("Rút tiền trực tiếp về ngân hàng: " + bankName + " (" + bankAccountNumber + ")")
                .build());

        return saved;
    }

    public List<PayoutRequest> getMyRequests() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        return payoutRequestRepository.findAllByUserOrderByCreatedAtDesc(user);
    }
}
