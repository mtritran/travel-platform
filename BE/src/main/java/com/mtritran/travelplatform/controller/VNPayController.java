package com.mtritran.travelplatform.controller;

import com.mtritran.travelplatform.configuration.VNPayConfig;
import com.mtritran.travelplatform.dto.response.ApiResponse;
import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.entity.TourRequest;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.repository.BookingRepository;
import com.mtritran.travelplatform.repository.TourRequestRepository;
import com.mtritran.travelplatform.service.BookingService;
import com.mtritran.travelplatform.service.TourRequestService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class VNPayController {
    VNPayConfig vnPayConfig;
    BookingRepository bookingRepository;
    BookingService bookingService;
    TourRequestRepository tourRequestRepository;
    TourRequestService tourRequestService;

    @GetMapping("/create-vnpay-payment")
    public ApiResponse<String> createPayment(HttpServletRequest request,
                                          @RequestParam String bookingId,
                                          @RequestParam String type,
                                          @RequestParam(required = false) String bankCode) {
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        BigDecimal amount;
        String desc;
        if (type.equals("DEPOSIT")) {
            amount = booking.getDepositAmount();
            desc = "Thanh toan coc cho tour: " + booking.getTour().getTitle();
        } else {
            amount = booking.getTotalPrice().subtract(booking.getPaidAmount());
            desc = "Thanh toan con lai cho tour: " + booking.getTour().getTitle();
        }

        long vnpAmount = amount.multiply(new BigDecimal(100)).longValue();
        String vnp_TxnRef = "BOOKING_" + bookingId + "_" + type + "_" + System.currentTimeMillis();
        return buildVnPayUrl(request, vnpAmount, vnp_TxnRef, desc, bankCode);
    }

    @GetMapping("/create-tour-request-vnpay")
    public ApiResponse<String> createRequestPayment(HttpServletRequest request,
                                          @RequestParam String requestId,
                                          @RequestParam String type,
                                          @RequestParam(required = false) String bankCode) {
        
        TourRequest tourReq = tourRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_REQUEST_NOT_FOUND));

        BigDecimal amount;
        String desc;
        if (type.equals("DEPOSIT")) {
            amount = tourReq.getDepositAmount();
            desc = "Thanh toan coc cho yeu cau: " + tourReq.getTitle();
        } else {
            amount = tourReq.getBudget().subtract(tourReq.getPaidAmount());
            desc = "Thanh toan con lai cho yeu cau: " + tourReq.getTitle();
        }

        long vnpAmount = amount.multiply(new BigDecimal(100)).longValue();
        String vnp_TxnRef = "REQUEST_" + requestId + "_" + type + "_" + System.currentTimeMillis();
        return buildVnPayUrl(request, vnpAmount, vnp_TxnRef, desc, bankCode);
    }

    private ApiResponse<String> buildVnPayUrl(HttpServletRequest request, long vnpAmount, String vnp_TxnRef, String desc, String bankCode) {
        String vnp_IpAddr = VNPayConfig.getIpAddress(request);
        if (vnp_IpAddr.equals("0:0:0:0:0:0:0:1")) {
            vnp_IpAddr = "127.0.0.1";
        }
        String vnp_TmnCode = vnPayConfig.getVnp_TmnCode();
        
        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnPayConfig.getVnp_Version());
        vnp_Params.put("vnp_Command", vnPayConfig.getVnp_Command());
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(vnpAmount));
        vnp_Params.put("vnp_CurrCode", "VND");
        if (bankCode != null && !bankCode.isBlank()) {
            String bc = bankCode.trim();
            if ("QR".equalsIgnoreCase(bc)) bc = "VNPAYQR";
            vnp_Params.put("vnp_BankCode", bc);
        }
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", desc);
        vnp_Params.put("vnp_OrderType", vnPayConfig.getVnp_OrderType());
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl());
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
        
        cld.add(Calendar.MINUTE, 20);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        String paymentUrl = vnPayConfig.buildPaymentRedirectUrl(vnp_Params);
        return ApiResponse.<String>builder().result(paymentUrl).build();
    }

    @GetMapping("/vnpay-callback")
    public ApiResponse<String> handleCallback(HttpServletRequest request) {
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
            String fieldName = params.nextElement();
            if (!fieldName.startsWith("vnp_")) continue;
            String fieldValue = request.getParameter(fieldName);
            if (fieldValue == null) continue;
            fields.put(fieldName, fieldValue);
        }

        String vnp_SecureHash = request.getParameter("vnp_SecureHash");
        fields.remove("vnp_SecureHash");

        if (vnp_SecureHash == null || vnp_SecureHash.isEmpty()) {
            return ApiResponse.<String>builder().result("INVALID_SIGNATURE").build();
        }

        String secret = vnPayConfig.getVnp_HashSecret();
        boolean signatureOk = VNPayConfig.hashVnpayReturnParams(fields, secret).equalsIgnoreCase(vnp_SecureHash);
        if (!signatureOk && fields.containsKey("vnp_SecureHashType")) {
            Map<String, String> withoutType = new HashMap<>(fields);
            withoutType.remove("vnp_SecureHashType");
            signatureOk = VNPayConfig.hashVnpayReturnParams(withoutType, secret).equalsIgnoreCase(vnp_SecureHash);
        }
        if (signatureOk) {
            if ("00".equals(request.getParameter("vnp_ResponseCode"))) {
                String txnRef = request.getParameter("vnp_TxnRef");
                String[] parts = txnRef.split("_");
                
                if (parts[0].equals("BOOKING")) {
                    String bookingId = parts[1];
                    String paymentType = parts[2];
                    if ("DEPOSIT".equals(paymentType)) {
                        bookingService.applyVnpayDepositSuccess(bookingId);
                    } else {
                        bookingService.applyVnpayRemainingSuccess(bookingId);
                    }
                } else if (parts[0].equals("REQUEST")) {
                    String requestId = parts[1];
                    String paymentType = parts[2];
                    if ("DEPOSIT".equals(paymentType)) {
                        tourRequestService.applyVnpayDepositSuccess(requestId);
                    } else {
                        tourRequestService.applyVnpayRemainingSuccess(requestId);
                    }
                }

                return ApiResponse.<String>builder().result("SUCCESS").build();
            } else {
                return ApiResponse.<String>builder().result("FAILED").build();
            }
        } else {
            return ApiResponse.<String>builder().result("INVALID_SIGNATURE").build();
        }
    }
}
