package com.mtritran.travelplatform.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1002, "Email already exists", HttpStatus.BAD_REQUEST),
    PHONE_EXISTED(1002, "Phone already exists", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least 3 characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least 8 characters", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1001, "Invalid email format", HttpStatus.BAD_REQUEST),
    INVALID_PHONE(1001, "Invalid phone number", HttpStatus.BAD_REQUEST),
    EMPTY_FULLNAME(1001, "Full name is required", HttpStatus.BAD_REQUEST),
    INVALID_FULLNAME(1001, "Full name must be at least 3 characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    ROLE_NOT_FOUND(1009, "Role not found", HttpStatus.NOT_FOUND),
    INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.BAD_REQUEST),
    FILE_REQUIRED(1010, "File is required", HttpStatus.BAD_REQUEST),
    UPLOAD_FAILED(1011, "File upload failed", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_NOT_FOUND(1012, "File not found", HttpStatus.NOT_FOUND),
    APPLICATION_EXISTED(1013, "Application already existed", HttpStatus.BAD_REQUEST),
    APPLICATION_NOT_FOUND(1014, "Application not found", HttpStatus.NOT_FOUND),
    LOCATION_NOT_FOUND(1015, "Location not found", HttpStatus.NOT_FOUND),
    TOUR_NOT_FOUND(1016, "Tour not found", HttpStatus.NOT_FOUND),
    TOUR_REQUEST_NOT_FOUND(1017, "Tour request not found", HttpStatus.NOT_FOUND),
    BOOKING_NOT_FOUND(1018, "Booking not found", HttpStatus.NOT_FOUND),
    CANNOT_BOOK_OWN_TOUR(1019, "You cannot book your own tour", HttpStatus.BAD_REQUEST),
    CANNOT_ACCEPT_OWN_REQUEST(1020, "You cannot accept your own tour request", HttpStatus.BAD_REQUEST),
    DATE_REQUIRED(1021, "Planned date is required", HttpStatus.BAD_REQUEST),
    TOUR_HAS_BOOKINGS(1022, "Cannot delete tour as it has bookings", HttpStatus.BAD_REQUEST),
    EXCEED_MAX_GUESTS(1023, "Number of guests exceeds tour limit", HttpStatus.BAD_REQUEST),
    INVALID_TOUR_DATE(1024, "Tour start date and time cannot be in the past", HttpStatus.BAD_REQUEST),
    INVALID_BOOKING_STATUS(1025, "Invalid booking status for this action", HttpStatus.BAD_REQUEST),
    ALREADY_REVIEWED(1026, "You have already reviewed this booking", HttpStatus.BAD_REQUEST),
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
