package com.mtritran.travelplatform.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Lỗi không xác định", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "Người dùng đã tồn tại", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1002, "Email đã tồn tại", HttpStatus.BAD_REQUEST),
    PHONE_EXISTED(1002, "Số điện thoại đã tồn tại", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Tên người dùng phải có ít nhất 3 ký tự", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Mật khẩu phải có ít nhất 8 ký tự", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1001, "Định dạng email không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_PHONE(1001, "Số điện thoại không hợp lệ", HttpStatus.BAD_REQUEST),
    EMPTY_FULLNAME(1001, "Họ và tên không được để trống", HttpStatus.BAD_REQUEST),
    INVALID_FULLNAME(1001, "Họ và tên phải có ít nhất 3 ký tự", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Chưa xác thực", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),
    ROLE_NOT_FOUND(1009, "Không tìm thấy vai trò", HttpStatus.NOT_FOUND),
    INVALID_DOB(1008, "Bạn phải ít nhất {min} tuổi", HttpStatus.BAD_REQUEST),
    FILE_REQUIRED(1010, "Yêu cầu tệp tin", HttpStatus.BAD_REQUEST),
    UPLOAD_FAILED(1011, "Tải tệp lên thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_NOT_FOUND(1012, "Không tìm thấy tệp", HttpStatus.NOT_FOUND),
    APPLICATION_EXISTED(1013, "Đơn đăng ký đã tồn tại", HttpStatus.BAD_REQUEST),
    APPLICATION_NOT_FOUND(1014, "Không tìm thấy đơn đăng ký", HttpStatus.NOT_FOUND),
    LOCATION_NOT_FOUND(1015, "Không tìm thấy địa điểm", HttpStatus.NOT_FOUND),
    TOUR_NOT_FOUND(1016, "Không tìm thấy tour", HttpStatus.NOT_FOUND),
    TOUR_REQUEST_NOT_FOUND(1017, "Không tìm thấy yêu cầu tour", HttpStatus.NOT_FOUND),
    BOOKING_NOT_FOUND(1018, "Không tìm thấy thông tin đặt chỗ", HttpStatus.NOT_FOUND),
    CANNOT_BOOK_OWN_TOUR(1019, "Bạn không thể tự đặt tour của chính mình", HttpStatus.BAD_REQUEST),
    CANNOT_ACCEPT_OWN_REQUEST(1020, "Bạn không thể tự nhận yêu cầu tìm HDV của chính mình", HttpStatus.BAD_REQUEST),
    DATE_REQUIRED(1021, "Ngày dự kiến là bắt buộc", HttpStatus.BAD_REQUEST),
    TOUR_HAS_BOOKINGS(1022, "Không thể xóa tour vì đang có lịch đặt", HttpStatus.BAD_REQUEST),
    EXCEED_MAX_GUESTS(1023, "Số lượng khách vượt quá giới hạn của tour", HttpStatus.BAD_REQUEST),
    INVALID_TOUR_DATE(1024, "Thời gian bắt đầu quá gần (phải chừa ít nhất thời gian chuẩn bị)", HttpStatus.BAD_REQUEST),
    INVALID_BOOKING_STATUS(1025, "Trạng thái không hợp lệ để thực hiện thao tác này", HttpStatus.BAD_REQUEST),
    ALREADY_REVIEWED(1026, "Bạn đã đánh giá booking này rồi", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_BALANCE(1027, "Số dư không đủ", HttpStatus.BAD_REQUEST),
    PAYOUT_NOT_FOUND(1028, "Không tìm thấy yêu cầu rút tiền", HttpStatus.NOT_FOUND),
    TITLE_REQUIRED(1029, "Tiêu đề tour là bắt buộc", HttpStatus.BAD_REQUEST),
    PRICE_REQUIRED(1030, "Giá tour là bắt buộc và phải hợp lệ", HttpStatus.BAD_REQUEST),
    START_DATE_REQUIRED(1031, "Ngày bắt đầu là bắt buộc", HttpStatus.BAD_REQUEST),
    START_TIME_REQUIRED(1032, "Giờ bắt đầu là bắt buộc", HttpStatus.BAD_REQUEST),
    TOUR_NOT_STARTED_YET(1033, "Chưa thể hoàn thành vì thời gian Tour chưa bắt đầu/kết thúc", HttpStatus.BAD_REQUEST),
    ALREADY_HAS_ACTIVE_BOOKING(1034, "Bạn đã có một lịch đặt tour đang hoạt động cho tour này", HttpStatus.CONFLICT),
    ALREADY_EXPRESSED_INTEREST(1035, "Bạn đã gửi yêu cầu nhận chuyến đi này rồi", HttpStatus.BAD_REQUEST),
    TOUR_CANNOT_UPDATE_DATE_TIME(1036,
            "Không thể thay đổi thời gian/giá khi đang có khách đặt. Vui lòng chờ tour hoàn thành hoặc liên hệ hỗ trợ.",
            HttpStatus.BAD_REQUEST),
    INVALID_OTP(1037, "Mã xác thực không chính xác", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED(1038, "Mã xác thực đã hết hạn", HttpStatus.BAD_REQUEST),
    IDENTITY_NOT_UPGRADED(1039, "Bạn cần bổ sung Số điện thoại và Mã PIN để thực hiện hành động này",
            HttpStatus.FORBIDDEN),
    INVALID_PAYMENT_PIN(1040, "Mã PIN thanh toán không chính xác", HttpStatus.BAD_REQUEST),
    PASSWORD_INCORRECT(1041, "Mật khẩu cũ không chính xác", HttpStatus.BAD_REQUEST),
    ALREADY_DISPUTED(1042, "Đơn hàng này đang trong quá trình khiếu nại", HttpStatus.BAD_REQUEST),
    DISPUTE_WINDOW_EXPIRED(1043, "Thời hạn khiếu nại (24h) đã kết thúc", HttpStatus.BAD_REQUEST),
    CONFIRM_PASSWORD_INVALID(1044, "Mật khẩu xác nhận không khớp", HttpStatus.BAD_REQUEST),
    USER_BANNED(1045,
            "Tài khoản của bạn đang bị tạm khóa chức năng này do vi phạm chính sách (Hủy tour quá nhiều lần hoặc vi phạm khác).",
            HttpStatus.FORBIDDEN),
    OVERLAPPING_SCHEDULE(1046, "Bạn đã có một lịch trình khác trùng vào khung giờ này. Vui lòng kiểm tra lại.",
            HttpStatus.BAD_REQUEST),
    APPLICATION_COOLDOWN(1047, "Hồ sơ của bạn đang trong thời gian chờ sau khi bị từ chối. Vui lòng thử lại sau.",
            HttpStatus.BAD_REQUEST),
    ALREADY_A_GUIDE(1049, "Người dùng đã là hướng dẫn viên.", HttpStatus.BAD_REQUEST),
    INVALID_APPLICATION_STATUS(1050, "Trạng thái phê duyệt không hợp lệ.", HttpStatus.BAD_REQUEST),
    REJECTION_REASON_REQUIRED(1051, "Vui lòng cung cấp lý do từ chối.", HttpStatus.BAD_REQUEST),
    APPLICATION_ALREADY_APPROVED(1052, "Hồ sơ này đã được phê duyệt trước đó.", HttpStatus.BAD_REQUEST),
    CANNOT_MODIFY_APPROVED_APPLICATION(1053, "Không thể chỉnh sửa hồ sơ đã được phê duyệt.", HttpStatus.BAD_REQUEST),
            ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
