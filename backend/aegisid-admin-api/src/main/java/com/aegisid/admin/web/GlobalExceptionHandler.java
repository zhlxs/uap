package com.aegisid.admin.web;

import com.aegisid.common.api.ApiResponse;
import com.aegisid.common.api.ErrorCode;
import com.aegisid.common.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ApiResponse<Void> handleBusinessException(BusinessException exception) {
        return ApiResponse.fail(exception.errorCode().code(), exception.getMessage(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ApiResponse<Void> handleValidationException(MethodArgumentNotValidException exception) {
        return ApiResponse.fail(ErrorCode.INVALID_REQUEST, null);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    ApiResponse<Void> handleUnknownException(Exception exception) {
        LOGGER.error("Unexpected server error", exception);
        return ApiResponse.fail(ErrorCode.INTERNAL_ERROR, null);
    }
}
