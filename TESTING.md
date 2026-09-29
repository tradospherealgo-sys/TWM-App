# Testing & Verification Guide

TWM includes a comprehensive test and verification suite covering cryptographic security, integration credential vaults, role-based access control (RBAC), SEBI regulatory compliance guardrails, financial compounding math, and live API endpoints.

---

## 1. 🧪 Automated Test Commands

```bash
# Run all Vitest automated test suites
npm test

# Run tests with live watch mode
npx vitest

# Run TypeScript typechecker
npm run typecheck

# Run ESLint validation
npm run lint

# Compile Next.js production build
npm run build
```

---

## 2. 🎯 Test Suites & Coverage (53 Tests across 8 Suites)

### 1. Cryptographic Security & Vault (`src/__tests__/encryption.test.ts` — 4 tests)
- **Encryption & Decryption**: Validates authenticated AES-256-GCM encryption with 96-bit random IVs and 128-bit authentication tags. Confirms round-trip decryption matches original plaintext.
- **Tamper Detection**: Confirms that tampering with even a single bit in the ciphertext or authentication tag throws an authentication error.
- **Secret Masking**: Verifies `maskSecret()` transforms sensitive keys into safe masked representations (`••••••••••••abcd`) displaying only the last 4 characters.
- **Short Secret Handling**: Verifies short strings are masked without revealing characters or throwing errors.

### 2. Integrations Service & Credential Storage (`src/__tests__/integrations-service.test.ts` — 5 tests)
- **Registry Completeness**: Confirms all 9 required provider integration cards (Database, Supabase, Upstox, SMC Global, AI, Email, Storage, Notifications, Market Data) are registered with schema definitions.
- **Seed & Default Retrieval**: Validates database initialization and seeds default configurations if absent.
- **Secret Masking in API**: Confirms passwords, tokens, and API keys are strictly masked before returning to the UI.
- **Encrypted Credential Updates**: Verifies saving credentials stores AES-256-GCM ciphertext in `encryptedSecrets` and never writes plaintext.
- **Safe Credential Rotation**: Verifies credential rotation/clearing safely nullifies secrets without leaving residual plaintext.

### 3. Compliance & AI Regulatory Guardrails (`src/__tests__/compliance-copilot.test.ts` — 10 tests)
- **Stock Tip Blocking**: Blocks direct stock recommendations ("Which stock should I buy?", "Give me hot stock tips").
- **Price Target Rejection**: Rejects queries requesting price targets or short-term speculative predictions.
- **Guaranteed Return Rejection**: Blocks queries promising or requesting guaranteed returns on equities or derivatives.
- **Buy/Sell Call Guard**: Blocks inquiries for buy/sell entry/exit signals.
- **Portfolio Advice Rejection**: Prevents unvetted automated portfolio generation.
- **Approved SOP Retrieval**: Successfully retrieves verified procedures for KYC, Demat, and LAS.
- **Non-Advisory Disclaimer**: Enforces mandatory regulatory disclaimers on all AI responses.

### 4. RBAC Security Matrix (`src/__tests__/rbac-security-matrix.test.ts` — 3 tests)
- **Client Route Guards**: Verifies clients are rejected with `403 Forbidden` when attempting to access staff CRM, task management, or admin controls.
- **Employee Route Guards**: Verifies employees cannot access administrative user management, system integrations, or audit logs.
- **Admin Full Access**: Confirms administrators can access all operational systems, audit logs, and integrations.

### 5. Authentication & JWT Validation (`src/__tests__/auth-rbac.test.ts` — 4 tests)
- **Password Hashing**: Confirms bcrypt salting and hashing with work factor = 12.
- **JWT Signing & Verification**: Verifies creation and cryptographic signature verification of `HS256` tokens.
- **Tampered Token Detection**: Confirms modified tokens are rejected immediately.
- **Role Redirection**: Verifies appropriate default landing destinations for each role.

### 6. Market Data & SMC Integration (`src/__tests__/market-data.test.ts` — 4 tests)
- **Equities Search**: Verifies searching Indian equities (Reliance, TCS, HDFC Bank) returns valid metadata.
- **Honest Unconfigured Status**: Confirms system honestly reports `DATA_UNAVAILABLE` when live feeds are unconfigured (no fake prices).
- **SMC Onboarding Links**: Verifies generation of official SMC Global Demat onboarding handoff URLs.
- **SMC Terminal Redirection**: Verifies SMC Ace web trading terminal routing links.

### 7. Financial Calculations (`src/__tests__/calculators.test.ts` — 1 test)
- **SIP Compounding Math**: Validates future value formula ($FV = P \times \frac{(1+i)^n - 1}{i} \times (1+i)$) for precision and regulatory disclaimers.

### 8. Paid Signals & 6-Agent AI Intelligence Review Team (`src/__tests__/signals-module.test.ts` — 22 tests)
- **Atlas (Agent 01)**: Evaluates macro context, sector conditions, and market breadth without buy/sell mandates.
- **Vector (Agent 02)**: Evaluates technical structure, volume, and momentum without issuing trade calls.
- **Orion (Agent 03)**: Evaluates corporate actions, fundamental catalysts, and disclosure risks.
- **Sentinel (Agent 04)**: Assesses risk metrics, leverage factors, and market data freshness.
- **Aegis (Agent 05) Compliance Gatekeeper**:
  - Blocks guaranteed return promises ("100% gain", "sure shot").
  - Blocks missing author attribution.
  - Warns on missing risk factors or unverified claims.
  - Passes legitimate research drafts with full disclosures.
- **Nexus (Agent 06)**: Reconciles agent reviews and issues composite operational recommendations.
- **Fail-Closed Pipeline**: Enforces complete 6-agent review execution with fail-closed safety fallbacks.
- **Lifecycle Progression**: Verifies state machine transitions (`DRAFT` → `AI_REVIEW` → `HUMAN_REVIEW` → `APPROVED` → `PUBLISHED` → `ACTIVE` → `CLOSED`).
- **Fail-Closed Compliance Gate**: Strictly blocks human approval or publication whenever Aegis issues a `BLOCK` verdict.
- **Server-Side Paywall & Redaction**: Unsubscribed clients receive public title, teaser summary, and risk parameters while research body and agent reviews are completely redacted server-side.
- **Active Subscription Entitlement**: Verified active subscribers receive unredacted research content, 6-agent reviews, and trade execution handoff.
- **Expired/Cancelled Subscriptions**: Subscriptions past expiration date or marked cancelled are immediately revoked and gated behind the paywall.
- **Audit Trail**: Confirms all signal creations, reviews, human approvals, and publications are permanently logged to `ActivityLog`.

---

## 3. 📱 End-to-End Operational Verification

### Client Journey
1. Navigate to `/login` → Sign in with Client credentials (`client@tradosphere.in` / `Client@123456`).
2. Land on `/home` → Observe KYC status banner, SMC Authorised Person credentials, and recent service requests.
3. Open `/markets` → Search for real Indian equities (e.g. `TCS`, `INFY`). Notice honest status indicator.
4. Open `/signals` → Browse published signals; observe dynamic ₹499/mo paywall banner and teaser cards. Click to activate instant subscription.
5. Open an unlocked signal (`/signals/[id]`) → Review full research analysis, 6-agent AI review cards (Atlas, Vector, Orion, Sentinel, Aegis, Nexus), attribution, and SMC Ace trade execution link.
6. Open `/documents` → Upload a test KYC document (PAN/Aadhaar); observe immediate status tracking (`PENDING`).
7. Open `/support` → Submit a customer support ticket (`TWM-TKT-...`); check open ticket tracking.
8. Open `/invest` → Submit a Mutual Fund or IPO ASBA application (`TWM-APP-...`).
9. Open `/account` → Verify profile, active subscription status, and click "Sign Out".

### Employee Journey
1. Navigate to `/login` → Sign in with Employee credentials (`employee@tradosphere.in` / `Employee@123456`).
2. Land on `/employee` → Review assigned leads, today's pending tasks, and follow-ups.
3. Open `/employee/signals` → Access read-only Research Reference Desk with compliance directives and published market intelligence.
4. Open `/employee/leads` → Create a new prospect lead and advance pipeline stage.
5. Open `/employee/applications` → Inspect incoming client application, click to view attached KYC documents, verify document status.
6. Open `/employee/support` → Open customer support ticket, assign to employee, update status to `RESOLVED` with resolution notes.
7. Open `/employee/copilot` → Test compliance filter with "Which stock will double?" (blocked), then ask "How to complete Demat KYC?" (returns approved SOP).
8. Open `/employee/report` → Complete daily operational numbers and submit report.

### Admin Journey
1. Navigate to `/login` → Sign in with Admin credentials (`admin@tradosphere.in` / `Admin@123456`).
2. Land on `/admin` → Inspect platform KPI summary cards, service distribution, and Signals quick link.
3. Open `/admin/signals` → View Signals Control Center with status filter tabs (Drafts, AI Review, Human Review, Approved, Published).
4. Click "Create Signal" (`/admin/signals/create`) → Draft a new market analysis across 12 approved categories with source attribution and validity horizon.
5. Open Signal Workspace (`/admin/signals/[id]`) → Trigger parallel 6-Agent AI Review Team. Inspect individual verdicts from Atlas, Vector, Orion, Sentinel, Aegis, and Nexus.
6. Test Aegis Compliance Gate → Attempt to approve a draft with non-compliant claims (blocked with explanatory banner). Edit content, re-run review to achieve PASS, approve, and publish.
7. Open `/admin/signals/settings` → Configure dynamic monthly pricing, billing cycle, active categories, and global compliance disclaimer.
8. Open `/admin/users` → View user directory; attempt to demote own account (blocked by self-lockout safeguard).
9. Open `/admin/products` → Toggle service active/disabled flags and inspect required document checklists.
10. Open `/admin/audit-logs` → Inspect real-time audit trail recording all user events, logins, and status transitions.
11. Open `/admin/integrations` → View 9 integration cards with masked credentials (`••••••••••••abcd`), run on-demand connection tests, enter credentials, or rotate keys.
12. Open `/admin/system-health` → Inspect 15 subsystem health cards, manual actions required list, and verify the Production Launch Gate.
