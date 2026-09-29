# External System Integrations & Credential Vault

TWM implements a decoupled, server-side adapter architecture managed centrally through **Admin → Integrations** (`/admin/integrations`).

Third-party credentials are encrypted at rest with **AES-256-GCM** using an application-level master encryption key (`INTEGRATION_ENCRYPTION_KEY` or `JWT_SECRET`). Credentials and service-role keys are **never** rendered in page source, returned in normal client APIs, or included in client JavaScript bundles.

```
       UI Component (React Client)
                   ↓
      Next.js Route Handler / API
                   ↓
      Role & Security Barrier (Admin only)
                   ↓
   AES-256-GCM Encryption Vault (Decrypted Server-Side)
                   ↓
           Adapter Boundary
                   ↓
   Third-Party Provider API (with 5s Timeout)
```

---

## 1. Supported Integration Adapters

| Provider | Purpose | Environment | Status Options | Test Endpoint |
|---|---|---|---|---|
| **Database** | Core transaction store | Production | `CONNECTED`, `REQUIRES_BOOTSTRAP` | `SELECT 1` raw query |
| **Supabase** | Managed PG & real-time | Production | `CONNECTED`, `NOT_CONFIGURED`, `FAILED` | `/auth/v1/health` ping |
| **Upstox API v2** | Real-time NSE/BSE tick feeds & quotes | Production | `CONNECTED`, `NOT_CONFIGURED`, `FAILED` | `/v2/user/profile` |
| **SMC Global** | AP Gateway & SMC Ace portal handoffs | Production | `CONNECTED`, `CONFIGURED`, `NOT_CONFIGURED` | Endpoint reachability & AP validation |
| **AI Provider** | SOP knowledge retrieval & copilot | Production | `CONNECTED`, `CONFIGURED` (Local heuristic) | Provider model ping |
| **Email Service** | Transactional alerts & notifications | Production | `CONNECTED`, `NOT_CONFIGURED`, `FAILED` | Gateway verification |
| **Storage Vault** | KYC documents (PAN, Aadhaar, Cheques) | Production | `CONNECTED`, `INCOMPLETE` | Filesystem / S3 bucket test |
| **Notifications** | Real-time in-app & external push | Production | `CONNECTED` (`IN_APP_ONLY` fallback) | Database queue check |
| **Market Data Feed** | Primary quote resolver | Production | `CONFIGURED` | Provider resolution |

---

## 2. Admin → Integrations UX & Capabilities

Located at `/admin/integrations`:
- **Masked Credential Representation**: Shows `••••••••••••abcd` for sensitive fields.
- **On-Demand Connection Testing**: Executes live backend requests with timeouts (5000ms max) and latency reporting.
- **Credential Rotation**: Safe rotation and clearing without logging secrets.
- **Completeness Meter**: Progress percentage and list of exact missing fields.
- **Bootstrap Separation**: Distinctly isolates deployment-level bootstrap variables (`DATABASE_URL`, `JWT_SECRET`) from runtime integrations.

---

## 3. Strict Compliance & Honesty Rules

1. **No Simulated Data**: When market feeds or broker APIs are not connected, TWM displays `LIVE MARKET DATA UNAVAILABLE`. Never fabricate fake prices, fake charts, or simulated orders.
2. **SMC Execution Boundary**: Trade execution belongs exclusively to SMC Global / SMC Ace. TWM provides transparent onboarding and referral handoff links.
3. **AI Non-Advisory Policy**: Built-in compliance filters reject all stock-tip, price target, or guaranteed-return prompts.
