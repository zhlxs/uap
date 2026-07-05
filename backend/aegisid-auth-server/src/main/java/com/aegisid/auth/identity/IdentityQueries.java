package com.aegisid.auth.identity;

import java.util.List;
import java.util.Optional;
import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * 面向认证与令牌签发的只读身份查询。
 *
 * <p>认证服务作为身份数据的消费方，仅通过 JdbcTemplate 读取管理后台维护的用户、账号、
 * 角色与权限，不持有 MyBatis 实体，也不负责库表迁移。
 */
@Repository
public class IdentityQueries {
    private final JdbcTemplate jdbcTemplate;

    public IdentityQueries(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    /**
     * 按登录名加载账号与所属用户信息，用于认证与资料 claims。
     */
    public Optional<AccountDetails> findAccountByUsername(String username) {
        String sql = "SELECT a.username, a.password_hash, a.status AS account_status, a.locked_until,"
                + " u.id AS user_id, u.display_name, u.email, u.tenant_id, u.status AS user_status"
                + " FROM iam_account a JOIN iam_user u ON u.id = a.user_id"
                + " WHERE a.username = ?";
        List<AccountDetails> rows = jdbcTemplate.query(sql, (rs, rowNum) -> new AccountDetails(
                rs.getString("user_id"),
                rs.getString("username"),
                rs.getString("password_hash"),
                rs.getString("account_status"),
                rs.getString("user_status"),
                rs.getTimestamp("locked_until") == null ? null : rs.getTimestamp("locked_until").toInstant(),
                rs.getString("display_name"),
                rs.getString("email"),
                rs.getString("tenant_id")
        ), username);
        return rows.stream().findFirst();
    }

    /**
     * 通过 client_id 定位其所属应用，用于按应用维度解析授权。
     */
    public Optional<String> findApplicationIdByClientId(String clientId) {
        String sql = "SELECT application_id FROM uap_oauth_client WHERE client_id = ?";
        List<String> rows = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("application_id"), clientId);
        return rows.stream().findFirst();
    }

    /**
     * 加载用户在指定应用下的有效角色编码。
     */
    public List<String> findRoleCodes(String username, String applicationId) {
        String sql = "SELECT DISTINCT r.role_code"
                + " FROM iam_account a"
                + " JOIN iam_user_role ur ON ur.user_id = a.user_id"
                + " JOIN iam_role r ON r.id = ur.role_id"
                + " WHERE a.username = ? AND ur.application_id = ? AND r.status = 'active'"
                + " ORDER BY r.role_code";
        return jdbcTemplate.queryForList(sql, String.class, username, applicationId);
    }

    /**
     * 加载用户在指定应用下经角色授予的有效权限码。
     */
    public List<String> findPermissionCodes(String username, String applicationId) {
        String sql = "SELECT DISTINCT pc.permission_code"
                + " FROM iam_account a"
                + " JOIN iam_user_role ur ON ur.user_id = a.user_id"
                + " JOIN iam_role r ON r.id = ur.role_id"
                + " JOIN iam_role_permission rp ON rp.role_id = r.id"
                + " JOIN uap_permission_code pc ON pc.id = rp.permission_code_id"
                + " WHERE a.username = ? AND ur.application_id = ? AND r.status = 'active' AND pc.status = 'active'"
                + " ORDER BY pc.permission_code";
        return jdbcTemplate.queryForList(sql, String.class, username, applicationId);
    }

    /**
     * 加载用户在指定应用下经角色授予的有效 scope 编码。
     */
    public List<String> findScopeCodes(String username, String applicationId) {
        String sql = "SELECT DISTINCT sc.scope_code"
                + " FROM iam_account a"
                + " JOIN iam_user_role ur ON ur.user_id = a.user_id"
                + " JOIN iam_role r ON r.id = ur.role_id"
                + " JOIN iam_role_scope rsc ON rsc.role_id = r.id"
                + " JOIN uap_scope sc ON sc.id = rsc.scope_id"
                + " WHERE a.username = ? AND ur.application_id = ? AND r.status = 'active' AND sc.status = 'active'"
                + " ORDER BY sc.scope_code";
        return jdbcTemplate.queryForList(sql, String.class, username, applicationId);
    }
}
