package com.mtritran.travelplatform.configuration;

import jakarta.servlet.http.HttpServletRequest;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Configuration
@Getter
public class VNPayConfig {
    @Value("${vnpay.url}")
    private String vnp_PayUrl;

    @Value("${vnpay.return-url}")
    private String vnp_ReturnUrl;

    @Value("${vnpay.tmn-code}")
    private String vnp_TmnCode;

    @Value("${vnpay.hash-secret}")
    private String vnp_HashSecret;

    // vnp_Command is set to "pay" by default
    private final String vnp_Version = "2.1.0";
    private final String vnp_Command = "pay";
    private final String vnp_OrderType = "other"; // Default order type

    /**
     * VNPAY v2.1.0: HMAC-SHA512, hex lowercase (theo mẫu servlet Java trên cổng VNPAY).
     */
    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException();
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }

    /**
     * Tạo URL chuyển hướng VNPAY 2.1.0: chuỗi ký = các cặp sorted key, dạng
     * {@code fieldName=URLEncoder.encode(value)} (tên tham số không encode — đúng tài liệu Java VNPAY).
     */
    public String buildPaymentRedirectUrl(Map<String, String> vnpParams) {
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        boolean first = true;
        for (String fieldName : fieldNames) {
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (!first) {
                    hashData.append('&');
                    query.append('&');
                }
                first = false;
                String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.UTF_8);
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(encodedValue);
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8));
                query.append('=');
                query.append(encodedValue);
            }
        }
        String secureHash = hmacSHA512(vnp_HashSecret, hashData.toString());
        return vnp_PayUrl + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    public static String getIpAddress(HttpServletRequest request) {
        String ipAdress;
        try {
            ipAdress = request.getHeader("X-FORWARDED-FOR");
            if (ipAdress == null) {
                ipAdress = request.getRemoteAddr();
            }
        } catch (Exception e) {
            ipAdress = "Invalid IP:" + e.getMessage();
        }
        return ipAdress;
    }

    /**
     * Chữ ký phản hồi Return URL / IPN (VNPAY 2.1.0) — khác chuỗi ký lúc tạo pay:
     * sau khi bỏ {@code vnp_SecureHash}, sort key, ghép {@code urlencode(key)+"="+urlencode(value)}
     * (mẫu PHP trong tài liệu chính thức).
     */
    public static String hashVnpayReturnParams(Map<String, String> fields, String secretKey) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        boolean first = true;
        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue == null) {
                continue;
            }
            if (!first) {
                hashData.append('&');
            }
            first = false;
            hashData.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8));
            hashData.append('=');
            hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
        }
        return hmacSHA512(secretKey, hashData.toString());
    }
}
