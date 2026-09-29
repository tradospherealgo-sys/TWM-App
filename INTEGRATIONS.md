# External System Integrations & Adapters

TWM implements a decoupled adapter architecture. The frontend communicates exclusively through server-side application boundaries, ensuring third-party credentials and APIs are never exposed directly to client code.

```
       UI Component (React Client)
                   ↓
      Next.js Route Handler / API
                   ↓
           Adapter Boundary
                   ↓
   Third-Party System / Integration
```

---

## 1. SMC Global Securities (Authorised Person)

- **Adapter**: `src/lib/adapters/smc.ts`
- **Purpose**: Facilitate Demat/Trading account opening and provide official deep-link handoffs to SMC Ace.
- **Rule**: Never simulate trades or fabricate virtual portfolios. All actual trade routing resides in SMC Global regulated infrastructure.
- **Statuses**:
  - `CONNECTED`: Active credentials present in `.env`.
  - `CONFIGURATION_REQUIRED`: Credentials not set; TWM displays transparent handoff links and honest configuration notice.

---

## 2. Market Data Feed (NSE / BSE)

- **Adapter**: `src/lib/adapters/market-data.ts`
- **Purpose**: Stock directory search, sector lookup, and index information.
- **Reference Directory**: 25+ real Indian blue-chip equities (`RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, etc.) with authentic ISINs and sector tags.
- **Honest Data Rule**: When live tick provider API key is not configured, price and volume metrics display `null` with explicit `DATA_UNAVAILABLE` status. Never show fake prices!

---

## 3. AI Employee Copilot

- **Adapter**: `src/lib/adapters/ai-copilot.ts`
- **Purpose**: Assist employees in retrieving approved SOPs, drafting customer messages, and formatting daily reports.
- **Regulatory Guardrails**: Regex and semantic checks immediately block queries soliciting stock tips, buy/sell calls, target prices, or guaranteed returns with an official SEBI compliance disclosure.
- **Operational Mode**: When `AI_PROVIDER_API_KEY` is unset, the adapter runs in compliant built-in heuristic retrieval mode over database SOPs.

---

## 4. Secure Document Vault

- **Driver**: Local filesystem (`dev.db` storage root) or cloud S3/GCS.
- **Rule**: Public URLs are strictly disabled. Files are delivered only through authenticated, role-verified API routes.
