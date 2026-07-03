package com.aegisid.admin.app.application.service;

import com.aegisid.admin.app.application.command.CreateApplicationCommand;
import com.aegisid.admin.app.application.command.CreateOAuthClientCommand;
import com.aegisid.admin.app.application.query.CreatedClientSecret;
import com.aegisid.admin.app.domain.model.Application;
import com.aegisid.admin.app.domain.model.ClientSecret;
import com.aegisid.admin.app.domain.model.OAuthClient;
import com.aegisid.admin.app.domain.model.PermissionMode;
import com.aegisid.admin.app.domain.repository.ApplicationRepository;
import com.aegisid.admin.app.domain.repository.ClientSecretRepository;
import com.aegisid.admin.app.domain.repository.OAuthClientRepository;
import com.aegisid.common.api.ErrorCode;
import com.aegisid.common.domain.RecordStatus;
import com.aegisid.common.exception.BusinessException;
import com.aegisid.common.security.SecurityConstants;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DefaultApplicationManagementService implements ApplicationManagementService {
    private static final int SECRET_BYTES = 32;
    private static final int SECRET_HINT_LENGTH = 8;

    private final ApplicationRepository applicationRepository;
    private final OAuthClientRepository oauthClientRepository;
    private final ClientSecretRepository clientSecretRepository;
    private final SecureRandom secureRandom;
    private final PasswordEncoder passwordEncoder;

    public DefaultApplicationManagementService(
            ApplicationRepository applicationRepository,
            OAuthClientRepository oauthClientRepository,
            ClientSecretRepository clientSecretRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.oauthClientRepository = oauthClientRepository;
        this.clientSecretRepository = clientSecretRepository;
        this.secureRandom = new SecureRandom();
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    @Transactional
    public Application create(CreateApplicationCommand command) {
        validatePermissionMode(command.permissionMode());
        applicationRepository.findByAppCode(command.appCode()).ifPresent(application -> {
            throw new BusinessException(ErrorCode.RESOURCE_CONFLICT, "Application code already exists");
        });
        LocalDateTime now = LocalDateTime.now();
        Application application = new Application(
                newId(),
                command.appCode(),
                command.appName(),
                command.appType(),
                command.protocol(),
                command.homepageUrl(),
                command.permissionMode(),
                command.permissionCapabilitiesJson(),
                RecordStatus.DRAFT,
                now,
                now
        );
        return applicationRepository.save(application);
    }

    @Override
    public Application get(String id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Application not found"));
    }

    @Override
    public List<Application> list() {
        return applicationRepository.findAll();
    }

    @Override
    @Transactional
    public Application enable(String id) {
        Application application = get(id);
        Application updated = application.withStatus(RecordStatus.ACTIVE, LocalDateTime.now());
        return applicationRepository.update(updated);
    }

    @Override
    @Transactional
    public Application disable(String id) {
        Application application = get(id);
        Application updated = application.withStatus(RecordStatus.DISABLED, LocalDateTime.now());
        return applicationRepository.update(updated);
    }

    @Override
    public List<OAuthClient> listOAuthClients(String applicationId) {
        get(applicationId);
        return oauthClientRepository.findByApplicationId(applicationId);
    }

    @Override
    @Transactional
    public OAuthClient createOAuthClient(CreateOAuthClientCommand command) {
        get(command.applicationId());
        command.redirectUris().forEach(this::validateRedirectUri);
        if (command.postLogoutRedirectUris() != null) {
            command.postLogoutRedirectUris().forEach(this::validateRedirectUri);
        }
        LocalDateTime now = LocalDateTime.now();
        OAuthClient client = new OAuthClient(
                newId(),
                command.applicationId(),
                generateClientId(),
                command.clientName(),
                command.clientType(),
                command.tokenEndpointAuthMethod(),
                command.grantTypes(),
                command.responseTypes(),
                command.redirectUris(),
                command.postLogoutRedirectUris() == null ? List.of() : command.postLogoutRedirectUris(),
                command.scopes(),
                command.accessTokenTtlSeconds(),
                command.refreshTokenTtlSeconds(),
                command.requirePkce(),
                RecordStatus.ACTIVE,
                now,
                now
        );
        return oauthClientRepository.save(client);
    }

    @Override
    @Transactional
    public CreatedClientSecret createClientSecret(String clientId) {
        oauthClientRepository.findByClientId(clientId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "OAuth client not found"));
        LocalDateTime now = LocalDateTime.now();
        String secret = generateSecret();
        String secretHint = secret.substring(secret.length() - SECRET_HINT_LENGTH);
        ClientSecret clientSecret = new ClientSecret(
                newId(),
                clientId,
                passwordEncoder.encode(secret),
                secretHint,
                now,
                null,
                RecordStatus.ACTIVE,
                now
        );
        ClientSecret saved = clientSecretRepository.save(clientSecret);
        return new CreatedClientSecret(saved.id(), saved.clientId(), secret, saved.secretHint(), saved.createdAt());
    }

    private void validatePermissionMode(String permissionMode) {
        if (!PermissionMode.isSupported(permissionMode)) {
            throw new BusinessException(ErrorCode.INVALID_PERMISSION_MODE);
        }
    }

    private void validateRedirectUri(String redirectUri) {
        if (redirectUri.contains("*")) {
            throw new BusinessException(ErrorCode.INVALID_REDIRECT_URI);
        }
        try {
            URI uri = new URI(redirectUri);
            boolean isLocalHttp = SecurityConstants.HTTP_SCHEME.equalsIgnoreCase(uri.getScheme())
                    && SecurityConstants.LOCALHOST.equalsIgnoreCase(uri.getHost());
            boolean isLoopbackHttp = SecurityConstants.HTTP_SCHEME.equalsIgnoreCase(uri.getScheme())
                    && SecurityConstants.LOOPBACK_IPV4.equals(uri.getHost());
            boolean isHttps = SecurityConstants.HTTPS_SCHEME.equalsIgnoreCase(uri.getScheme());
            if (!isHttps && !isLocalHttp && !isLoopbackHttp) {
                throw new BusinessException(ErrorCode.INVALID_REDIRECT_URI);
            }
        } catch (URISyntaxException exception) {
            throw new BusinessException(ErrorCode.INVALID_REDIRECT_URI, "Redirect uri syntax is invalid");
        }
    }

    private String generateClientId() {
        return SecurityConstants.CLIENT_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
    }

    private String generateSecret() {
        byte[] bytes = new byte[SECRET_BYTES];
        secureRandom.nextBytes(bytes);
        return SecurityConstants.CLIENT_SECRET_PREFIX + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String newId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
