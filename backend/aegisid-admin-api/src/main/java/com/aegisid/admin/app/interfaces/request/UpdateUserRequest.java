package com.aegisid.admin.app.interfaces.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @NotBlank @Size(max = 128) String displayName,
        @Size(max = 64) String employeeNo,
        @Size(max = 255) String email,
        @Size(max = 32) String mobile,
        @Size(max = 64) String departmentId
) {
}
