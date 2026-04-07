package com.mtritran.travelplatform.service;
 
import com.mtritran.travelplatform.entity.Otp;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.repository.OtpRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
 
import java.security.SecureRandom;
import java.time.LocalDateTime;
 
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OtpService {
    OtpRepository otpRepository;
    SecureRandom random = new SecureRandom();
 
    @Transactional
    public void generateAndSendOtp(String email) {
        // Clear previous OTPs for this email to avoid clutter
        otpRepository.deleteAllByEmail(email);
 
        String code = String.format("%06d", random.nextInt(1000000));
        Otp otp = Otp.builder()
                .email(email)
                .code(code)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .build();
 
        otpRepository.save(otp);
 
        // Mock sending: Print to console for Demo/Development
        System.out.println("========================================");
        System.out.println("MÃ OTP XÁC THỰC EMAIL: " + email);
        System.out.println("MÃ CODE: " + code);
        System.out.println("HẾT HẠN SAU: 5 PHÚT");
        System.out.println("========================================");
    }
 
    public boolean verifyOtp(String email, String code) {
        Otp otp = otpRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OTP));
 
        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }
 
        return otp.getCode().equals(code);
    }
}
