package com.aegisid.admin.app.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("uap_application")
public class ApplicationEntity {
    @TableId
    private String id;
    private String appCode;
    private String appName;
    private String appType;
    private String protocol;
    private String ownerUserId;
    private String homepageUrl;
    private String logoUrl;
    private String loginPolicyId;
    private String tokenPolicyId;
    private String permissionMode;
    private String permissionCapabilitiesJson;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAppCode() {
        return appCode;
    }

    public void setAppCode(String appCode) {
        this.appCode = appCode;
    }

    public String getAppName() {
        return appName;
    }

    public void setAppName(String appName) {
        this.appName = appName;
    }

    public String getAppType() {
        return appType;
    }

    public void setAppType(String appType) {
        this.appType = appType;
    }

    public String getProtocol() {
        return protocol;
    }

    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public String getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(String ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public String getHomepageUrl() {
        return homepageUrl;
    }

    public void setHomepageUrl(String homepageUrl) {
        this.homepageUrl = homepageUrl;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getLoginPolicyId() {
        return loginPolicyId;
    }

    public void setLoginPolicyId(String loginPolicyId) {
        this.loginPolicyId = loginPolicyId;
    }

    public String getTokenPolicyId() {
        return tokenPolicyId;
    }

    public void setTokenPolicyId(String tokenPolicyId) {
        this.tokenPolicyId = tokenPolicyId;
    }

    public String getPermissionMode() {
        return permissionMode;
    }

    public void setPermissionMode(String permissionMode) {
        this.permissionMode = permissionMode;
    }

    public String getPermissionCapabilitiesJson() {
        return permissionCapabilitiesJson;
    }

    public void setPermissionCapabilitiesJson(String permissionCapabilitiesJson) {
        this.permissionCapabilitiesJson = permissionCapabilitiesJson;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

