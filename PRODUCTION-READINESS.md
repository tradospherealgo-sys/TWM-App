# TWM — PRODUCTION READINESS & LAUNCH GUIDE
## TRADOSPHERE WEALTH MANAGEMENT

This document is the master engineering guide for deploying, configuring, and operating the Tradosphere Wealth Management (TWM) platform in production.

---

## 1. ARCHITECTURE OVERVIEW

TWM operates as a unified financial relationship platform connecting three role-based portals:

```
                          ┌───────────────────────────┐
                          │    Next.js 14 App Router  │
                          │   (TypeScript / Tailwind) │
                          └─────────────┬─────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
            ┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
            │  CLIENT PORTAL │   │ EMPLOYEE OS   │   │  ADMIN PANEL  │
            │  - Markets     │   │ - Leads CRM   │   │ - Users & RBAC│
            │  - Watchlists  │   │ - Tasks       │   │ - Integrations│
            │  - Invest (SIP)│   │ - Follow-ups  │   │ - Pre-Flight  │
            │  - Protect/Loan│   │ - Applications│   │ - Audit Trail │
            │  - KYC Vault   │   │ - AI Copilot  │   │ - Products    │
            │  - Support Desk│   │ - Daily Report│   │ - Operations  │
            └───────────────┘   └───────────────┘   └───────────────┘
                                        │
                          ┌─────────────▼─────────────┐
                          │     Edge RBAC Middleware  │
                          │   (JWT Jose Verification) │
                          └─────────────┬─────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
    ┌───────▼───────┐           ┌───────▼───────┐           ┌───────▼───────┐
    │  Prisma ORM   │           │ AES-256-GCM   │           │ Third-Party   │
    │  PostgreSQL / │           │ Credential    │           │ Gateway Adapters:
    │  SQLite       │           │ Vault         │           │ Upstox, SMC,  │
    │               │           │               │           │ AI, Email     │
    └───────────────┘           └───────────────┘           └───────────────┘
```

---

## 2. BOOTSTRAP / DEPLOYMENT SECRETS

### Critical Security Rule
Only secrets required **BEFORE** the application and database boot remain deployment-level environment variables. All normal third-party credentials are managed directly from **Admin → Integrations**.

| Variable | Required | Purpose | Where to Enter |
|---|---|---|---|
| `DATABASE_URL` | **YES** | Transactional database connection string (PostgreSQL in production) | Deployment platform (AWS / Render / Supabase / Vercel) |
| `JWT_SECRET` | **YES** | Edge JWT session token signing key (min. 32 chars) | Deployment platform |
| `INTEGRATION_ENCRYPTION_KEY` | Recommended | 256-bit AES-GCM master encryption key for database credential vault (falls back to `JWT_SECRET` if unset) | Deployment platform |
| `NEXT_PUBLIC_APP_URL` | **YES** | Canonical production application URL (e.g. `https://app.tradosphere.in`) | Deployment platform |
| `NODE_ENV` | **YES** | Set to `production` | Deployment platform |

---

## 3. ADMIN → INTEGRATIONS USAGE

The **Admin → Integrations** control center (`/admin/integrations`) is the single source of truth for all runtime provider credentials.

### Supported Providers:
1. **Database**: Read-only bootstrap status with query latency monitoring.
2. **Supabase**: Project URL, Anon Key, and Service Role Key (server-side only).
3. **Upstox API v2**: Client ID, Client Secret, daily session Access Token, Base URL. Live connection test against `/v2/user/profile`.
4. **SMC Global**: Authorised Person AP Code, portal handoffs, and direct API credentials.
5. **AI Provider**: Google Gemini / OpenAI API key, model selection, SEBI compliance guardrails.
6. **Transactional Email**: SMTP server host/port or cloud email API key (Resend / SendGrid / Postmark).
7. **Document Storage**: Local role-gated filesystem vault or S3-compatible cloud bucket (AWS S3 / Cloudflare R2 / Supabase Storage).
8. **Notifications Subsystem**: In-app real-time notification engine with external SMS/Email delivery modes.
9. **Market Data Feed**: Primary provider selector (Upstox Feed vs Verified NSE Reference Directory safe fallback).

### Key Features:
- **Masked Credentials**: Plaintext keys are never returned over APIs or rendered in client-side HTML (`••••••••••••abcd`).
- **Live Connection Testing**: Backend verifies connectivity with 5-second timeouts and latency metrics. Never fakes success.
- **Credential Rotation**: Allows clearing or rotating sensitive secrets with audit log recording without exposing past secrets.
- **Completeness Score**: Progress indicator showing exact missing fields for every integration card.

---

## 4. SYSTEM HEALTH & PRE-FLIGHT AUDIT

Located at **Admin → System Health** (`/admin/system-health`):

Automated audit evaluating **15 core subsystems**:
1. `Application`: Server uptime, Node version, memory usage.
2. `Database`: Latency, connectivity, and model verification.
3. `Migrations`: Prisma schema consistency.
4. `Authentication`: Bcrypt salt rounds, JWT security, and secure cookie parameters.
5. `RBAC`: Permission boundaries between CLIENT, EMPLOYEE, and ADMIN.
6. `Security`: AES-256-GCM vault master key verification.
7. `Market Data`: Upstox vs Directory fallback status.
8. `SMC Gateway`: Authorised Person AP Code and portal handoff verification.
9. `AI Copilot`: Operational SOP retrieval and SEBI compliance filter status.
10. `Email`: Transactional gateway readiness.
11. `Storage`: Document storage directory permissions.
12. `Notifications`: In-app alert queue readiness.
13. `Documents`: Role-gated server-side proxy access.
14. `Background Jobs`: Activity logging and audit trail immutability.
15. `Environment`: Bootstrap environment secrets completeness.

### Production Launch Gate
- If technical failures exist: Displays **NOT PRODUCTION READY — [Blockers]**.
- If technical checks pass but third-party keys are pending: Displays **PRODUCTION READY — Waiting for manual integration configuration**.
- If all services connected: Displays **PRODUCTION READY — ALL SYSTEMS GO**.

---

## 5. SEBI REGULATORY BOUNDARIES & COMPLIANCE

In strict adherence to the **TWM Master Product Reference**:
1. **Authorised Person Disclosure**: Tradosphere Wealth Management acts as an Authorised Person of SMC Global Securities Ltd. All actual equity trade execution resides exclusively on SMC Ace.
2. **No Unregistered Advisory**: TWM does NOT provide personalized stock recommendations, buy/sell/hold calls, price targets, or guaranteed return promises.
3. **AI Copilot Guardrails**: Automated unit tests block requests such as *"What stock should I buy?"*, *"Buy RELIANCE"*, *"Which stock will give me 20%?"*, *"What should my customer invest in?"*, and *"Guarantee me a return"*.
4. **No Fake Data**: When market feeds are unconfigured, TWM honestly displays **"LIVE MARKET DATA UNAVAILABLE"**. No simulated orders, fake P&L, or paper trading are permitted.

---

## 6. PRODUCTION DATABASE SETUP (POSTGRESQL)

To switch from local development SQLite to production PostgreSQL:
1. In your deployment environment, set:
   ```bash
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB_NAME]?pgbouncer=true"
   ```
2. In `prisma/schema.prisma`, update the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Push schema to production:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
4. Seed approved product catalog and SOP articles:
   ```bash
   npm run db:seed
   ```

---

## 7. BACKUP & RECOVERY STRATEGY

1. **Transactional Database**:
   - Automated daily snapshots via PostgreSQL provider (e.g. Supabase, AWS RDS).
   - Point-in-Time Recovery (PITR) enabled with 7-day retention.
2. **KYC Document Vault**:
   - Local vault (`uploads/`) should be mounted on a persistent EBS/EFS volume.
   - S3-compatible cloud storage should enable versioning and multi-region replication.
3. **Audit Trail**:
   - The `ActivityLog` table is append-only. Export monthly CSV archives for compliance records.

---

## 8. LAUNCH VERIFICATION CHECKLIST

- [x] All 53 Next.js routes compile with 0 errors (`npm run build`).
- [x] 100% TypeScript type check passes (`npm run typecheck`).
- [x] ESLint passes with 0 warnings (`npm run lint`).
- [x] All 31 automated tests pass across 7 test suites (`npm test`).
- [x] Authentication & RBAC tested: Client denied Employee/Admin, Employee denied Admin.
- [x] Customer Support ticket system active with status updates and staff notes.
- [x] Document Vault role-gated with server-side download streaming.
- [x] Admin Integrations operational with AES-256-GCM encryption and connection testing.
- [x] System Health pre-flight dashboard operational.
- [x] Rate limiting active on authentication endpoints.
- [x] Prohibited advisory AI queries strictly blocked with SEBI compliance warnings.
