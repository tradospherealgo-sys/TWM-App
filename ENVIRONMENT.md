# Environment Configuration Reference

TWM cleanly separates **Deployment-Level Bootstrap Secrets** (which the application requires before it can boot) from **Runtime Third-Party Integrations** (which are managed securely inside the application via **Admin → Integrations** without editing source code or `.env` files).

---

## 1. 🚀 Bootstrap / Deployment Secrets (Mandatory at Boot)

These variables must be set in the deployment environment (e.g., Docker, Vercel, Railway, AWS ECS, VPS `.env` file) **before** the application process starts. Because the database and decryption engine depend on them to boot, they **cannot** be managed from inside the web application:

| Variable | Required | Default in Local Dev | Description & Rationale |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `file:./dev.db` | Connection string to SQLite (local) or PostgreSQL (production). Required for Prisma data access. |
| `JWT_SECRET` | **Yes** | Dev fallback string | 32+ character high-entropy key used to cryptographically sign session JWT tokens (`HS256`). |
| `INTEGRATION_ENCRYPTION_KEY` | Recommended | Uses `JWT_SECRET` fallback | 32+ character key used to derive the AES-256-GCM encryption key for the credentials vault. |
| `PORT` | No | `3000` | HTTP port on which Next.js listens. |
| `NODE_ENV` | No | `development` | Node environment (`development`, `production`, `test`). |

### Generating Cryptographic Secrets
Generate strong 256-bit random keys for production:
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate INTEGRATION_ENCRYPTION_KEY
openssl rand -base64 32
```

---

## 2. 🎛️ Runtime Third-Party Integrations (Admin Panel Managed)

**You do NOT need to edit source code or `.env` files for normal third-party integrations.**

All external provider credentials, API keys, URLs, and secrets are entered, updated, rotated, and tested directly inside:

👉 **Admin Panel → Integrations** (`/admin/integrations`)

These credentials are encrypted using **AES-256-GCM** before being written to the database vault, and are decrypted only in secure server-side execution contexts with a 5000ms timeout.

### Providers Managed via Admin Panel:
1. **Upstox API v2**:
   - `apiKey`, `apiSecret`, `accessToken`, `redirectUri`
   - Real-time tick feeds, quotes, and market depth for NSE/BSE equities.
2. **SMC Global**:
   - `apCode`, `partnerId`, `apiKey`, `apiSecret`, `onboardingUrl`, `tradingPortalUrl`
   - Authorised Person gateway, client onboarding handoff, and SMC Ace web terminal routing.
3. **AI Provider**:
   - `provider` (`heuristic`, `openai`, `anthropic`, `gemini`), `apiKey`, `model`, `baseUrl`
   - SOP knowledge retrieval and non-advisory employee copilot.
4. **Transactional Email**:
   - `provider`, `apiKey`, `smtpHost`, `smtpPort`, `smtpUser`, `smtpPassword`, `senderName`, `senderEmail`
   - Application status updates, ticket alerts, and compliance notifications.
5. **Document Storage**:
   - `driver` (`local`, `s3`, `gcs`), `bucket`, `region`, `accessKeyId`, `secretAccessKey`, `endpoint`
   - Secure encrypted vault for customer KYC documents (PAN, Aadhaar, Cheques).
6. **Supabase**:
   - `projectUrl`, `anonKey`, `serviceRoleKey`
   - Managed PostgreSQL database access and real-time event broadcasting.

---

## 3. 🌐 Public Branding Variables (Optional in `.env`)

These non-sensitive display strings can optionally be overridden in `.env`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | `Tradosphere Wealth Management` | Full organization name displayed across headers and footers. |
| `NEXT_PUBLIC_APP_SHORT_NAME` | `TWM` | Short branding badge for mobile headers. |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Canonical origin URL for links and callbacks. |

---

## 4. 🔒 Production Security Rules

1. **Never commit `.env` or `.env.local` to version control** (enforced by `.gitignore`).
2. **Service role keys and API secrets must never be exposed** to client-side bundles or `NEXT_PUBLIC_*` variables.
3. **Admin Credential Vault uses AES-256-GCM authenticated encryption**; all secrets in the Admin UI are masked as `••••••••••••abcd`.
