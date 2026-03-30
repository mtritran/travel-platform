package com.mtritran.travelplatform.enums;

public enum TransactionType {
    REVENUE,      // Khách thanh toán cho sàn
    COMMISSION,   // Sàn thu phí dịch vụ (10%)
    INCOME,       // Tiền Guide thực nhận được (90%)
    WITHDRAW,      // Guide rút tiền từ ví
    REFUND        // Sàn hoàn tiền cho khách
}
