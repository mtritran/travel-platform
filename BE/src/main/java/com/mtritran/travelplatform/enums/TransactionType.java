package com.mtritran.travelplatform.enums;

public enum TransactionType {
    REVENUE,      // Khách thanh toán cho sàn
    COMMISSION,   // Sàn thu phí dịch vụ (20%) — ghi vào ví admin
    INCOME,       // Tiền Guide thực nhận được (80%) — ghi vào ví guide
    WITHDRAW,      // Guide rút tiền từ ví
    REFUND        // Sàn hoàn tiền cho khách
}
