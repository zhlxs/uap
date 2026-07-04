package com.aegisid.admin.app.interfaces.response;

import com.aegisid.admin.app.infrastructure.persistence.entity.UserEntity;
import java.time.LocalDateTime;

public record UserResponse(
        String id,
        String displayName,
        String employeeNo,
        String email,
        String mobile,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserResponse from(UserEntity user) {
        return new UserResponse(
                user.getId(),
                user.getDisplayName(),
                user.getEmployeeNo(),
                user.getEmail(),
                user.getMobile(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
