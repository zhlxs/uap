package com.aegisid.auth.identity;

import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * 基于数据库的用户认证信息加载。
 *
 * <p>登录名与口令来自 iam_account，配合 iam_user 的状态共同决定账号是否可用。
 * 令牌中的角色与权限由 {@link IdentityQueries} 在签发阶段按目标应用维度单独解析，
 * 因此此处不需要向认证对象注入权限。
 */
@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final IdentityQueries identityQueries;

    public DatabaseUserDetailsService(IdentityQueries identityQueries) {
        this.identityQueries = identityQueries;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        AccountDetails account = identityQueries.findAccountByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("账号不存在或不可用"));
        if (account.passwordHash() == null || account.passwordHash().isBlank()) {
            throw new UsernameNotFoundException("账号未设置登录口令");
        }
        return User.withUsername(account.username())
                .password(account.passwordHash())
                .disabled(!account.enabled())
                .accountLocked(!account.nonLocked())
                .authorities(AuthorityUtils.NO_AUTHORITIES)
                .build();
    }
}
