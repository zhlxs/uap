package com.aegisid.common.api;

public enum ErrorCode {
    SUCCESS("SUCCESS", "Success"),
    INVALID_REQUEST("INVALID_REQUEST", "Invalid request"),
    UNAUTHORIZED("UNAUTHORIZED", "Unauthorized"),
    FORBIDDEN("FORBIDDEN", "Forbidden"),
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", "Resource not found"),
    RESOURCE_CONFLICT("RESOURCE_CONFLICT", "Resource conflict"),
    INTERNAL_ERROR("INTERNAL_ERROR", "Internal server error");

    private final String code;
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String code() {
        return code;
    }

    public String message() {
        return message;
    }
}

