# Bika Archive

Warehouse document location management system. Bika Archive tracks **where physical documents are stored**: which company owns them, which warehouse they sit in, and the exact shelf/box/position inside it. Staff can find any paper record in seconds, log check-outs, and keep an audit trail of every change.

It also integrates with the **Bika DMS** (the document management / filing system). Users there can click *"File in Archive"* and land directly on a prefilled form here.

## Features

- **Document registry**: create, search, update and move documents; track status (`AVAILABLE`, `CHECKED_OUT`, `MISSING`).
- **Flexible location hierarchy**: warehouses contain nested locations of any depth (room → rack → shelf → box …), with full path lookup.
- **Multi-company**: each company sees only its own data; warehouses can be shared.
- **Document types (categories)** per company.
- **Search & reports**: full search with search-history reporting.
- **Dashboard**: stats and recent activity.
- **Audit log** of user actions.
- **Auth**: JWT access tokens + HttpOnly refresh-token cookie, password change, email-based password reset, login rate limiting.
- **Bika DMS integration**: signed handoff tokens, one-way company sync, and a filing callback (see [Integration](#integration-with-the-bika-dms)).
- **API docs** via Swagger UI.

## Roles

| Role | Access |
|---|---|
| `SUPER_ADMIN` | Everything, across all companies; manages companies and company sync. |
| `COMPANY_ADMIN` | Manages their company's users, warehouses, categories and reports. |
| `USER` | Searches and views documents in their company. |
| `EXTERNAL_FILER` | Auto-provisioned on first DMS handoff. Can only view their company's warehouses/locations/categories and create documents. |

## Tech stack

| Layer | Stack |
|---|---|
| Backend | Java 21, Spring Boot 3.3 (Web, Data JPA, Security, Validation, Mail), JJWT, MapStruct, Lombok, springdoc-openapi |
| Database | PostgreSQL 16, Flyway migrations |
| Frontend | React 19, Vite, React Router 7, Tailwind CSS 4, Axios, lucide-react |
| Packaging | Docker (multi-stage build), docker-compose |

## Repository layout

```
backend/       Spring Boot API (com.bika.archive)
  src/main/java/.../controller     REST endpoints under /api/*
  src/main/java/.../service        Business logic
  src/main/java/.../integration    Bika DMS company sync + filing callback
  src/main/java/.../security       JWT, handoff tokens, rate limiting
  src/main/resources/db/migration  Flyway SQL migrations (V1–V11)
  docker-compose.yml               PostgreSQL (+ optional packaged app)
frontend/      React + Vite single-page app
integration/   Specs and contracts shared with the Bika DMS team
```

## Getting started

### Prerequisites

- Java 21 and Maven 3.9+
- Node.js 20+ and npm
- Docker (for PostgreSQL)

### 1. Start the database

```bash
cd backend
docker compose up -d postgres
```

This starts PostgreSQL 16 on **localhost:5442** (database `bika_archive`, user `bika`, password `bika_dev_password`).

### 2. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API runs on **http://localhost:8090**. Flyway applies all migrations automatically on startup.

On first run, when the users table is empty, a super admin is created:

- Email: `admin@bika.local`
- Password: `ChangeMe123!`

**Change this password after your first login.**

Swagger UI: http://localhost:8090/swagger-ui.html

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). The dev server proxies `/api` to `http://localhost:8090`. To point it elsewhere, set `VITE_API_PROXY_TARGET`.

## Configuration

All settings are environment variables with dev-friendly defaults (see `backend/src/main/resources/application.yml`). `backend/.env.example` documents every variable. Copy it to `backend/.env` for docker-compose. Spring Boot itself reads only real environment variables, not the `.env` file.

> **Ports:** DB `5442` and API `8090` everywhere (defaults and `.env.example`). If you change `DB_PORT`/`SERVER_PORT` in `.env`, export the same values for the backend too, since it doesn't read `.env`.

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection |
| `SERVER_PORT` | API port (default `8090`) |
| `JWT_SECRET` | HS256 signing key, **≥ 32 bytes**; set a real one outside dev |
| `JWT_ACCESS_EXPIRATION_MINUTES`, `JWT_REFRESH_EXPIRATION_DAYS` | Token lifetimes (15 min / 7 days) |
| `COOKIE_SECURE`, `COOKIE_SAME_SITE` | Refresh-cookie flags (`true` behind HTTPS) |
| `CORS_ALLOWED_ORIGINS` | Allowed origin pattern (default `http://localhost:*`) |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_NAME` | First-run super admin |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | SMTP for password-reset emails |
| `FRONTEND_URL` | Base URL used in email links |
| `ARCHIVE_HANDOFF_SECRET` | Shared secret for DMS handoff tokens (separate from `JWT_SECRET`) |
| `BIKA_SOURCE_BASE_URL`, `BIKA_SOURCE_API_KEY`, `BIKA_SOURCE_SYNC_ENABLED` | Bika DMS company sync and filing callback |

Generate secrets with `openssl rand -hex 32`. Never commit a real `.env`.

## Integration with the Bika DMS

1. **Company sync**: Bika Archive mirrors companies from the DMS via `GET {BIKA_SOURCE_BASE_URL}/v1/companies/export`. A super admin can trigger it with `POST /api/companies/sync`.
2. **"File in Archive" handoff**: the DMS mints a short-lived HS256 JWT signed with `ARCHIVE_HANDOFF_SECRET` and redirects the user to `/handoff?token=…` (or `/embed/handoff` for the embedded view). Bika Archive verifies it, finds or creates the user as an `EXTERNAL_FILER`, and opens the Add Document form prefilled with the record's title, custodian and reference.
3. **Filing callback**: once the document is saved, Bika Archive notifies the DMS at `POST /v1/archive-integration/filing-callback`.

Full contracts are in [`integration/`](integration/), starting with [`bika-source-handoff-contract.md`](integration/bika-source-handoff-contract.md).

## API overview

All endpoints live under `/api` and require a Bearer access token, except login/refresh/password-reset/handoff, Swagger and `/actuator/health`.

| Resource | Base path |
|---|---|
| Auth | `/api/auth` (login, refresh, logout, me, profile, change/forgot/reset password, handoff) |
| Companies | `/api/companies` |
| Warehouses | `/api/warehouses` |
| Locations | `/api/locations` |
| Document types | `/api/document-types` |
| Documents | `/api/documents` (search, status, location moves) |
| Users | `/api/users` |
| Dashboard | `/api/dashboard` |
| Search history | `/api/search-history` |
| Audit logs | `/api/audit-logs` |

Swagger UI has the full, up-to-date reference.

## Building for production

**Backend (Docker):**

```bash
cd backend
docker compose up -d --build    # postgres + app on port 8090
```

Set at least `JWT_SECRET`, `BOOTSTRAP_ADMIN_PASSWORD`, `COOKIE_SECURE=true`, the SMTP settings and the integration secrets. A `prod` Spring profile is provided in `application-prod.yml`.

**Frontend:**

```bash
cd frontend
npm run build    # static files in frontend/dist
```

Serve `dist/` from any static host, and route `/api` to the backend.
