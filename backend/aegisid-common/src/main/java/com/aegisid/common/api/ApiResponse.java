package com.aegisid.common.api;

public record ApiResponse<T>(
        boolean success,
        T data,
        String errorCode,
        String message,
        String traceId
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null, null);
    }

    public static <T> ApiResponse<T> fail(ErrorCode errorCode, String traceId) {
        return fail(errorCode.code(), errorCode.message(), traceId);
    }

    public static <T> ApiResponse<T> fail(String errorCode, String message, String traceId) {
        return new ApiResponse<>(false, null, errorCode, message, traceId);
    }
}
