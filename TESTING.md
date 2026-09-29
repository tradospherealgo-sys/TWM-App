# Testing & Verification Guide

TWM includes automated unit and integration tests covering security, RBAC, financial formulas, regulatory guardrails, and integration adapters.

## 🧪 Running Tests

```bash
# Run test suite once with Vitest
npm run test

# Run tests in watch mode
npx vitest

# Run TypeScript typechecker
npm run typecheck

# Verify Next.js production build
npm run build
```

---

## 🎯 Test Suites Summary

1. **Authentication & RBAC (`src/__tests__/auth-rbac.test.ts`)**:
   - Bcrypt password hashing and salt verification.
   - JWT session signing, verification, and tamper detection with `jose`.
   - Distinct role dashboard routing for `ADMIN`, `EMPLOYEE`, and `CLIENT`.
2. **Financial Calculators (`src/__tests__/calculators.test.ts`)**:
   - Validates compounding formula for SIP returns ($FV = P \times \frac{(1+i)^n - 1}{i} \times (1+i)$).
   - Confirms precision and absence of guaranteed return claims.
3. **Compliance & AI Regulatory Guardrails (`src/__tests__/compliance-copilot.test.ts`)**:
   - Verifies blocking of stock tips, buy/sell calls, target prices, and guaranteed profit queries.
   - Confirms retrieval of approved operational SOPs.
4. **Market Data & SMC Integration (`src/__tests__/market-data.test.ts`)**:
   - Searches real Indian equities (Reliance, TCS, HDFC Bank).
   - Confirms honest `DATA_UNAVAILABLE` status when market feed is unconfigured.
   - Verifies valid SMC Global onboarding links and parameter generation.

---

## 📱 Manual Critical E2E Test Journeys

### Client Journey
1. Open `/login` → click "Client" quick-fill → Sign In.
2. Arrive at `/home` → Observe KYC status, SMC Authorised Person card, and pending applications.
3. Click "Stocks" or bottom nav "Markets" → Search "Reliance" → View company details, NSDL/CDSL eligibility, and "Trade on SMC Global" CTA.
4. Add to Watchlist → Observe persistence under "Watchlists" tab.
5. Navigate to `/invest` → Explore Mutual Funds, use SIP Calculator, or submit an IPO ASBA application.
6. Navigate to `/applications` → Track newly created application number and assigned wealth officer.
7. Navigate to `/account` → Verify profile and click "Sign Out".

### Employee Journey
1. Open `/login` → click "Employee" quick-fill → Sign In.
2. Arrive at `/employee` → Review today's pending tasks, active leads, and scheduled follow-ups.
3. Go to `/employee/leads` → Create a new lead or transition a lead stage.
4. Go to `/employee/tasks` → Mark a task completed with the checkbox.
5. Go to `/employee/copilot` → Ask for "SOP: Demat Onboarding" or test the compliance guardrails with "Which stock should I buy?".
6. Go to `/employee/report` → Enter daily numbers and submit operational report.

### Admin Journey
1. Open `/login` → click "Admin" quick-fill → Sign In.
2. Arrive at `/admin` → Review organization-wide operational KPIs and applications by service.
3. Go to `/admin/users` → View user list, modify a role or status (self-demotion is prevented).
4. Go to `/admin/products` → Toggle an approved financial product active/disabled.
5. Go to `/admin/audit-logs` → Inspect real-time audit logs of all user actions.
6. Go to `/admin/integrations` → Inspect connectivity status for SMC Global, Market Data, and AI.
