# AegisID

AegisID 是一套企业级统一身份认证、单点登录、应用接入、权限治理与安全审计平台。

项目目标不是做一个普通登录页，而是建设可被多个 Web 应用、后台系统、移动端、API 服务和第三方 SaaS 标准接入的企业身份基础设施。

## 项目结构

```text
docs/                         产品、架构、数据库、接口和工程规范文档

backend/                      Java 后端 Maven 多模块工程
  aegisid-common/             通用响应、错误码、异常、常量等公共能力
  aegisid-auth-server/        认证服务，承载 OIDC/OAuth2、登录、Token 等能力
  aegisid-admin-api/          管理后台 API、开发者门户 API、应用接入管理
  aegisid-worker/             异步任务，后续承载身份源同步、Webhook、审计扩散等

frontend/
  admin-console/              管理后台和开发者门户前端骨架

examples/                     业务系统接入示例
deploy/                       Docker、Kubernetes 等部署资源
```

## 当前技术栈

- Java 17
- Spring Boot 3
- Spring Authorization Server
- Maven 多模块工程
- MyBatis Plus
- Flyway
- PostgreSQL，生产或集成环境
- H2，本地开发默认内存库
- React + TypeScript + Vite
- Redis，后续用于会话、限流、缓存等

## 后端命令

运行后端检查：

```powershell
mvn -f backend\pom.xml test
```

启动管理后台 API：

```powershell
mvn -f backend\pom.xml -pl aegisid-admin-api spring-boot:run
```

启动认证服务：

```powershell
mvn -f backend\pom.xml -pl aegisid-auth-server spring-boot:run
```

管理后台 API 默认地址：

```text
http://127.0.0.1:9100
```

认证服务默认地址：

```text
http://127.0.0.1:9000
```

健康检查：

```text
http://127.0.0.1:9100/actuator/health
http://127.0.0.1:9000/actuator/health
```

启动顺序与说明：

- 认证服务与管理后台 API 共享同一数据库；数据库结构与引导数据由管理后台 API 通过 Flyway 迁移创建。
- 首次启动请先启动管理后台 API 完成迁移，再启动认证服务。
- 认证服务只读取用户、账号、客户端与权限数据，不执行迁移。

内置引导账号（仅用于本地开发，生产环境请通过管理后台维护）：

```text
用户名：admin
口令：admin123
```


## 前端命令

安装依赖：

```powershell
npm --prefix frontend\admin-console install
```

启动管理后台：

```powershell
npm --prefix frontend\admin-console run dev
```

构建管理后台：

```powershell
npm --prefix frontend\admin-console run build
```

## 本地数据库

默认开发环境使用 H2 文件库，认证服务与管理后台 API 共享同一数据库文件，便于统一登录与权限令牌打通。

默认位置（通过 `AUTO_SERVER` 支持多进程共享）：

```text
${user.home}/.aegisid/aegisid-dev
```

可通过环境变量覆盖数据源，用于切换到 PostgreSQL 等外部库：

```text
AEGISID_DATASOURCE_URL
AEGISID_DATASOURCE_USERNAME
AEGISID_DATASOURCE_PASSWORD
AEGISID_DATASOURCE_DRIVER
```

认证服务签名密钥与发行方可通过环境变量配置：

```text
AEGISID_AUTH_ISSUER        默认 http://localhost:9000
AEGISID_AUTH_JWK_LOCATION  默认 ${user.home}/.aegisid/auth-jwk.json
```

签名密钥在首次启动时生成并持久化到上述文件，保证重启后已签发令牌仍可校验；生产环境应改用受控密钥库。

PostgreSQL 配置位于：

```text
backend/aegisid-admin-api/src/main/resources/application-db.yml
```

使用 PostgreSQL 时启用 `db` profile。

## 数据库迁移

数据库结构通过 Flyway 管理，迁移脚本位于：

```text
backend/aegisid-admin-api/src/main/resources/db/migration/
```

当前已包含：

```text
V1__init_aegisid_core.sql
V2__add_oauth_client_secret.sql
V3__add_application_role_permissions.sql
V4__add_user_role_assignment.sql
V5__seed_bootstrap_identity.sql
```

## 编码规范

后续项目文档统一使用中文。

后端编码要求以阿里 Java 开发规范为基线，并结合本项目工程约束执行：

```text
docs/04-编码规范与工程约束.md
```

当前已启用：

- Maven Enforcer
- Checkstyle
- 统一响应模型
- 统一错误码
- 统一业务异常
- Controller / Service / Repository / Mapper 分层
- Request / Response / Command / Domain 分离
- Flyway 数据库迁移

## 当前已实现能力

- 项目 Git 初始化
- 后端 Maven 多模块骨架
- 管理后台前端骨架
- 应用接入管理基础接口
- OAuth Client 创建接口
- Client Secret 生成接口
- Secret 明文只返回一次，数据库只存 hash
- redirect_uri 基础安全校验
- 默认 H2 本地开发库
- PostgreSQL profile 配置
- 认证服务接入共享库，读取真实用户、账号与客户端
- 基于数据库的用户认证（iam_account + iam_user）
- 基于数据库的注册客户端（uap_oauth_client）
- 权限令牌声明：access token 与 id token 注入 uid、用户名、姓名、邮箱、租户、角色、权限与 scope
- 权限按目标应用维度解析（用户在指定应用下的角色 / 权限 / scope）
- 签名密钥持久化，发行方与数据源可通过环境变量配置
- 引导身份数据 seed，统一登录与权限令牌开箱可用

## 重要提交

```text
0428f38 chore: initialize AegisID project
672f422 chore: add backend conventions and persistence baseline
7750798 feat: add application onboarding APIs
31da8ac chore: document engineering constraints
```

