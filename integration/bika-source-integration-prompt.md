# Prompt for the AI agent working in `bika-source-codes/bika`

Paste everything below this line to the agent.

---

I need two integration features added to this system (a Java 17 / Spring Boot 3.2.3 / PostgreSQL document management system). They exist to connect this system to a separate, already-built system called **"Bika Archive"** (a warehouse document location tracker), which will run on the same server. Do not modify Bika Archive itself — it lives in a different repo. Everything below is scoped to *this* repo only.

## Feature 1: Company export API (for one-way sync into Bika Archive)

Bika Archive needs to mirror this system's `companies` table into its own local read-only cache, refreshed on a schedule. Extend the existing `CompanyController` (`backend/src/main/java/com/bika/company/controller/CompanyController.java`, mapped at `/v1/companies`) rather than duplicating it:

1. Add a query parameter `updatedSince` (ISO-8601 timestamp, optional) to the existing list endpoint (or add a new `GET /v1/companies/export` if you'd rather not touch the existing list endpoint's behavior) that filters by `updatedAt > updatedSince`. When omitted, return everything. This lets the sync job do incremental pulls after the first full sync.
2. The response for each company must include at minimum: `id` (note: this is a `Long`, not a UUID — Bika Archive will store it as a foreign/external ID, not its own primary key), `name` (make sure the decrypted/plaintext value is returned, since `name` is stored via `EncryptionConverter`), `code`, `active`, `updatedAt`. Reuse or extend `CompanyDTO` (`company/dto/CompanyDTO.java`) rather than inventing a new shape — just confirm exactly which fields it already serializes.
3. **This endpoint needs machine-to-machine auth, not a real user's JWT** — the sync job is a backend-to-backend call with no logged-in user. Add a small dedicated auth guard for it: a single static API key expected in a request header (e.g. `X-Integration-Api-Key`), configured via a new env var (e.g. `ARCHIVE_INTEGRATION_API_KEY`), checked in a simple filter/interceptor scoped only to this endpoint (or an `/integration/**` path prefix if you add more such endpoints later) — don't put it behind the normal `JwtAuthenticationFilter`/user-session auth. Generate a strong random value for `ARCHIVE_INTEGRATION_API_KEY` and tell me what it is (or how you generated it) so I can configure the same value on the Bika Archive side.
4. (Optional, skip if it adds real complexity) If a webhook is cheap to add — an outbound POST to a configurable `ARCHIVE_WEBHOOK_URL` whenever a company is created or updated — add it. There's no existing outbound HTTP client in this codebase (no `RestTemplate`/`WebClient` usage currently), so this would need `spring-boot-starter-webflux` or `RestTemplate` added as a new dependency. This is a nice-to-have; the polling endpoint above is sufficient on its own, so don't force it in if it's awkward.

## Feature 2: "File in Archive" handoff

Add a way for a logged-in user in this system to click a button and land directly in Bika Archive's "add document" page, already authenticated as themselves.

1. Add a new endpoint, e.g. `POST /v1/archive-integration/handoff` (normal user-session auth via the existing `JwtAuthenticationFilter` — the caller must already be a logged-in user of this system). It should:
   - Read the current authenticated user (email, company ID) from the security context — same way other authenticated endpoints already do.
   - Optionally accept a `documentId` (or similar record reference) in the request body, if the user is filing from within a specific document/case view.
   - Mint a **new, short-lived (60–120 second) signed JWT** containing claims: `type: "bika-archive-handoff"`, `email`, `sourceCompanyId` (this system's `Company.id`), and `documentRef` (optional, the passed-in reference).
   - **Sign this token with a NEW, separate secret** — do not reuse the existing `jwt.secret` / `JwtService` signing key used for this system's own login sessions. Add a new config value, e.g. `archive.handoff.secret` (env var `ARCHIVE_HANDOFF_SECRET`), and a small dedicated signer for just this token (you can still use the same `jjwt` library and a similar pattern to `JwtService.generateToken(Map<String,Object> extraClaims, UserDetails)`, just with a distinct `Keys.hmacShaKeyFor(...)` key). Reason: if this handoff secret were ever compromised, it should only let someone forge a handoff into Bika Archive — not forge a real login session in this system.
   - Return the fully-formed redirect URL, e.g. `{ "redirectUrl": "http://localhost:5180/handoff?token=<jwt>" }`, where the Bika Archive base URL is a new config value (`ARCHIVE_BASE_URL`, default `http://localhost:5180`).
2. On the frontend (React + TypeScript, `frontend/`), add a "File in Archive" button somewhere sensible (e.g. on a document/case detail view). On click, call the new endpoint and then `window.location.href = redirectUrl` from the response. Keep it minimal — a single button + fetch call, no new state management needed.
3. Follow the existing package-by-feature convention (`com.bika.<feature>.{controller,dto,entity,service}`) — e.g. `com.bika.archiveintegration.*` for the new controller/DTOs/services, and use the existing Springdoc `@Operation` annotation style already used on other controllers.

## What I need back from you when this is done

Please tell me explicitly:
1. The exact JSON field names and types your company export endpoint returns (paste a sample response).
2. The value (or generation method) of `ARCHIVE_INTEGRATION_API_KEY`.
3. The value (or generation method) of `ARCHIVE_HANDOFF_SECRET`, and confirm it is distinct from the existing `jwt.secret`.
4. The exact path of both new endpoints, and which HTTP method/auth each expects.
5. Whether you implemented the optional webhook, and if so, what payload shape it POSTs.

Don't change anything about this system's existing auth, company, or document behavior beyond adding these two new integration surfaces.
