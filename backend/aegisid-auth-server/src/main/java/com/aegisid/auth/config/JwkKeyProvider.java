package com.aegisid.auth.config;

import com.nimbusds.jose.jwk.RSAKey;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * RSA 签名密钥的加载与持久化。
 *
 * <p>优先从配置位置读取已有 JWK；不存在时生成 2048 位 RSA 密钥并写回该文件，
 * 保证重启后 kid 与密钥稳定，避免已签发令牌因密钥轮换而失效。
 *
 * <p>生产环境应改用密钥管理服务或受控密钥库，并对密钥文件做好访问控制，
 * 此处的文件持久化面向本地开发与单机部署。
 */
@Component
public class JwkKeyProvider {
    private static final Logger LOG = LoggerFactory.getLogger(JwkKeyProvider.class);

    private final Path location;

    public JwkKeyProvider(@Value("${aegisid.auth.jwk-location}") String jwkLocation) {
        this.location = Path.of(jwkLocation);
    }

    /**
     * 返回可用的 RSA 签名密钥，必要时生成并持久化。
     */
    public RSAKey loadOrCreate() {
        RSAKey existing = tryLoad();
        if (existing != null) {
            return existing;
        }
        RSAKey generated = generate();
        persist(generated);
        return generated;
    }

    private RSAKey tryLoad() {
        if (!Files.exists(location)) {
            return null;
        }
        try {
            String json = Files.readString(location);
            RSAKey key = RSAKey.parse(json);
            if (key.toPrivateKey() == null) {
                LOG.warn("JWK 文件缺少私钥，将重新生成: {}", location);
                return null;
            }
            return key;
        } catch (Exception ex) {
            LOG.warn("读取 JWK 文件失败，将重新生成: {}", location, ex);
            return null;
        }
    }

    private void persist(RSAKey key) {
        try {
            if (location.getParent() != null) {
                Files.createDirectories(location.getParent());
            }
            Files.writeString(location, key.toJSONString());
            LOG.info("已生成并持久化认证签名密钥: {}", location);
        } catch (Exception ex) {
            LOG.warn("持久化 JWK 文件失败，密钥仅在本次进程内有效: {}", location, ex);
        }
    }

    private static RSAKey generate() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair keyPair = generator.generateKeyPair();
            return new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
                    .privateKey((RSAPrivateKey) keyPair.getPrivate())
                    .keyID(UUID.randomUUID().toString())
                    .build();
        } catch (Exception ex) {
            throw new IllegalStateException("无法生成 RSA 签名密钥", ex);
        }
    }
}
