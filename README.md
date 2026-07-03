# AegisID

AegisID is an enterprise identity, single sign-on, authorization, and access governance platform.

## Repository Layout

```text
docs/                         Product and architecture documents
backend/                      Java backend services
  aegisid-common/             Shared Java types and utilities
  aegisid-auth-server/        OIDC/OAuth2 authentication server
  aegisid-admin-api/          Admin and developer APIs
  aegisid-worker/             Async jobs and integration workers
frontend/
  admin-console/              Admin console and developer portal shell
examples/                     Integration examples
deploy/                       Local and production deployment assets
```

## Baseline Stack

- Java 17
- Spring Boot 3
- Spring Authorization Server
- Maven multi-module build
- React + TypeScript + Vite
- PostgreSQL and Redis, via deployment profile

## First Commands

```powershell
mvn -f backend/pom.xml test
cd frontend/admin-console
npm install
npm run dev
```

The frontend is scaffolded as a functional admin shell. Backend modules are intentionally thin and ready for domain implementation.

