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

## 2. 🎯 Test Suites & Coverage (31 Tests across 7 Suites)

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

---

## 3. 📱 End-to-End Operational Verification

### Client Journey
1. Navigate to `/login` → Sign in with Client credentials (`client@tradosphere.in` / `Client@123456`).
2. Land on `/home` → Observe KYC status banner, SMC Authorised Person credentials, and recent service requests.
3. Open `/markets` → Search for real Indian equities (e.g. `TCS`, `INFY`). Notice honest status indicator.
4. Open `/documents` → Upload a test KYC document (PAN/Aadhaar); observe immediate status tracking (`PENDING`).
5. Open `/support` → Submit a customer support ticket (`TWM-TKT-...`); check open ticket tracking.
6. Open `/invest` → Submit a Mutual Fund or IPO ASBA application (`TWM-APP-...`).
7. Open `/account` → Verify profile and click "Sign Out".

### Employee Journey
1. Navigate to `/login` → Sign in with Employee credentials (`employee@tradosphere.in` / `Employee@123456`).
2. Land on `/employee` → Review assigned leads, today's pending tasks, and follow-ups.
3. Open `/employee/leads` → Create a new prospect lead and advance pipeline stage.
4. Open `/employee/applications` → Inspect incoming client application, click to view attached KYC documents, verify document status.
5. Open `/employee/support` → Open customer support ticket, assign to employee, update status to `RESOLVED` with resolution notes.
6. Open `/employee/copilot` → Test compliance filter with "Which stock will double?" (blocked), then ask "How to complete Demat KYC?" (returns approved SOP).
7. Open `/employee/report` → Complete daily operational numbers and submit report.

### Admin Journey
1. Navigate to `/login` → Sign in with Admin credentials (`admin@tradosphere.in` / `Admin@123456`).
2. Land on `/admin` → Inspect platform KPI summary cards and service distribution.
3. Open `/admin/users` → View user directory; attempt to demote own account (blocked by self-lockout safeguard).
4. Open `/admin/products` → Toggle service active/disabled flags and inspect required document checklists.
5. Open `/admin/audit-logs` → Inspect real-time audit trail recording all user events, logins, and status transitions.
6. Open `/admin/integrations` → View 9 integration cards with masked credentials (`••••••••••••abcd`), run on-demand connection tests, enter credentials, or rotate keys.
7. Open `/admin/system-health` → Inspect 15 subsystem health cards, manual actions required list, and verify the Production Launch Gate.
