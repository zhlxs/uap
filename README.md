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
mvn -f backend\pom.xml -pl aegisid-admin-api -am spring-boot:run
```

管理后台 API 默认地址：

```text
http://127.0.0.1:9100
```

健康检查：

```text
http://127.0.0.1:9100/actuator/health
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

默认开发环境使用 H2 内存库，便于快速启动和接口验证。

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

## 重要提交

```text
0428f38 chore: initialize AegisID project
672f422 chore: add backend conventions and persistence baseline
7750798 feat: add application onboarding APIs
31da8ac chore: document engineering constraints
```

