package com.aegisid.auth.identity;

import java.time.Instant;

/**
 * 账号与所属用户的认证视图。
 *
 * @param userId        用户主键
 * @param username      登录名
 * @param passwordHash  带算法前缀的口令哈希，如 {bcrypt}$2b$...
 * @param accountStatus 账号状态
 * @param userStatus    用户状态
 * @param lockedUntil   锁定截止时间，null 表示未锁定
 * @param displayName   展示名
 * @param email         邮箱
 * @param tenantId      租户标识
 */
public record AccountDetails(
        String userId,
        String username,
        String passwordHash,
        String accountStatus,
        String userStatus,
        Instant lockedUntil,
        String displayName,
        String email,
        String tenantId
) {
    private static final String STATUS_ACTIVE = "active";

    /**
     * 账号与用户均为启用状态。
     */
    public boolean enabled() {
        return STATUS_ACTIVE.equalsIgnoreCase(accountStatus) && STATUS_ACTIVE.equalsIgnoreCase(userStatus);
    }

    /**
     * 未处于锁定期。
     */
    public boolean nonLocked() {
        return lockedUntil == null || lockedUntil.isBefore(Instant.now());
    }
}
