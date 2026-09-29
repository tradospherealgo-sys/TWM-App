# Tradosphere Wealth Management (TWM) — System Architecture

## 1. Overview & High-Level Architecture

Tradosphere Wealth Management (TWM) is built on **Next.js 14 (App Router)** with **TypeScript**, **Prisma ORM**, **Tailwind CSS**, and edge-compatible security primitives. It is designed from the ground up as a multi-tier, enterprise-grade wealth advisory and distribution platform operating strictly within the regulatory boundaries of a SEBI Authorised Person (affiliated with SMC Global Securities Ltd).

```
                                  TWM APPLICATION SUITE
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         ▼                                  ▼                                  ▼
   CLIENT PANEL                       EMPLOYEE OS                    ADMIN CONTROL CENTER
  (Android-First)                   (Workforce CRM)                  (Business Platform)
  /home, /markets,                 /employee, /leads,                /admin, /users,
  /invest, /protect,               /tasks, /copilot,                 /products, /crm,
  /documents, /support             /support, /report                 /integrations, /system-health
         │                                  │                                  │
         └──────────────────────────────────┼──────────────────────────────────┘
                                            │
                                            ▼
                           NEXT.JS 14 APP ROUTER + EDGE MIDDLEWARE
                     (Session Verification, HS256 JWT, Route-Level RBAC)
                                            │
                                            ▼
                               APPLICATION & API LAYER
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
      Client APIs                  Staff & CRM APIs              Admin & System APIs
      /api/applications            /api/crm/leads                /api/admin/users
      /api/documents               /api/crm/tasks                /api/admin/products
      /api/documents/download      /api/employee/daily-report    /api/admin/integrations
      /api/support/tickets         /api/copilot                  /api/admin/system-health
               │                            │                            │
               └────────────────────────────┼────────────────────────────┘
                                            │
                                            ▼
                                PRISMA DATA ACCESS LAYER
                           (Relational SQLite / PostgreSQL)
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
          BUSINESS DATA STORES                          CREDENTIAL VAULT
          Users, Customers, Employees,                  IntegrationConfig
          Applications, Documents, Tickets,             (AES-256-GCM Encrypted
          Leads, Tasks, Activity Logs                   Secrets & Masked State)
                                            │
                                            ▼
                            DECOUPLED INTEGRATION ADAPTERS
        ┌───────────────┬───────────────┬───────────────┬───────────────┐
        ▼               ▼               ▼               ▼               ▼
     Database        Upstox API v2   SMC Global       AI Copilot     Storage / Email /
    Postgres/SQLite  Market Data     AP Gateway &     Compliant      Notifications
    (Pool & Raw)    (Live Quotes)   Demat Handoff    SOP Engine     (Local / S3)
```

---

## 2. Client Panel (Android-First UI/UX)

The Client Panel is engineered as a progressive web application optimized for modern mobile form factors (Android-first responsive layout) while scaling gracefully to tablet and desktop screens:

- **Sticky App Header**: Displays Tradosphere branding, SEBI Authorised Person badge, real-time unread notification badge, and active customer profile badge.
- **Sticky Bottom Navigation**: 6 persistent tabs (`Home`, `Markets`, `Invest`, `Protect`, `Borrow`, `Account`) with Android display cutouts and safe-area padding (`pb-safe`).
- **Touch-First Accessibility**: 44px minimum touch targets on all interactive elements, high-contrast typography, and accessible tap surfaces.
- **Equities & Markets Directory**: Search real Indian equities (NSE/BSE), view live market prices when connected, or see honest `LIVE MARKET DATA UNAVAILABLE` with transparent instructions when unconfigured. Quick one-click handoff to SMC Global / SMC Ace for trade execution.
- **Personal Watchlists**: Persisted stock watchlists tied to the client profile.
- **Unified Application Engine**: Self-service application forms for Demat/Trading account opening, Mutual Funds, SIP setups, IPO ASBA financing, and Insurance inquiries.
- **KYC Document Vault (`/documents`)**: Secure document repository where clients upload PAN cards, Aadhaar documents, bank statements, and cancelled cheques. Files are stored securely and never exposed via public static URLs.
- **Customer Support Desk (`/support`)**: Dedicated in-app ticket creation and status tracking system with automated ticket numbers (`TWM-TKT-YYYY-XXXX`) and direct relationship manager communication.

---

## 3. Employee Operating System (Workforce CRM)

A high-velocity operating console for Relationship Managers, Financial Advisors, and Wealth Executives:

- **Employee Dashboard (`/employee`)**: Summary of assigned active leads, pending daily tasks, upcoming follow-ups, and urgent service requests.
- **CRM Lead Pipeline (`/employee/leads`)**: 8-stage visual pipeline (`NEW_LEAD`, `CONTACTED`, `INTERESTED`, `FOLLOW_UP`, `DOCUMENTS_REQUIRED`, `APPLICATION`, `COMPLETED`, `LOST_CLOSED`) with one-click stage progression and notes logging.
- **Task Management (`/employee/tasks`)**: Priority-ranked tasks (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) with due-date alarms and completion toggles.
- **Customer Application Queue (`/employee/applications`)**: Review incoming client applications, inspect attached KYC documents, verify identity credentials, and transition workflow statuses (`NEW`, `IN_PROGRESS`, `DOCUMENTS_REQUIRED`, `SUBMITTED`, `UNDER_REVIEW`, `COMPLETED`, `REJECTED`).
- **Staff Support Desk (`/employee/support`)**: Triage and resolve client tickets, update ticket priorities, assign officers, and document resolution notes.
- **Approved SOPs & Knowledge Desk (`/employee/knowledge`)**: Instant compliance-verified standard operating procedures for account opening, KYC guidelines, IPO cutoff times, and loan-against-securities margins.
- **AI Employee Copilot (`/employee/copilot`)**: Operational intelligence assistant backed by strict regulatory guardrails preventing non-compliant financial advice.
- **Daily Operations Report (`/employee/report`)**: Mandatory end-of-day operational report recording calls completed, meetings conducted, leads contacted, and accounts converted.

---

## 4. Admin Business Control Center

The executive command center for system administrators and compliance heads:

- **Business Overview (`/admin`)**: Organization-wide metrics on users, lead conversions, active applications, and system status.
- **User & Access Management (`/admin/users`)**: Search, filter, inspect, and update user roles (`CLIENT`, `EMPLOYEE`, `ADMIN`) and account states (`ACTIVE`, `INACTIVE`, `SUSPENDED`). Includes strict self-lockout prevention to protect administrator accounts.
- **Financial Product Catalog (`/admin/products`)**: Enable/disable financial services, modify display names, and configure mandatory document checklists per service.
- **Tamper-Evident Audit Trail (`/admin/audit-logs`)**: Complete audit log recording actor identity, role, timestamp, action type, affected entity, detailed JSON payload, and client IP address.
- **Integrations Control Center (`/admin/integrations`)**: Centralized credential management dashboard for all external service providers. Implements AES-256-GCM encryption, secret masking (`••••••••••••abcd`), live server-side connection testing (5-second timeout), and credential rotation.
- **System Health & Pre-flight Diagnostics (`/admin/system-health`)**: Evaluates 15 core subsystems in real time and computes the authoritative Production Launch Gate.

---

## 5. Security Architecture

1. **Authentication**:
   - High-cost password hashing using `bcryptjs` with salt rounds = 12.
   - Cryptographically signed JSON Web Tokens (`HS256`) via `jose`.
   - Stored in secure `HttpOnly`, `SameSite=Lax`, `Path=/` session cookie (`twm_session`).
   - In-memory sliding-window rate limiting on login routes to prevent brute-force attacks.
2. **Authorization & RBAC**:
   - Edge Middleware (`src/middleware.ts`) inspects session cookies and validates roles against route prefixes (`/admin/*`, `/employee/*`, `/(client)/*`).
   - Server-side role checks in all API route handlers (`getCurrentUser()`).
3. **Integration Credential Vault**:
   - Master encryption key derived from `INTEGRATION_ENCRYPTION_KEY` or `JWT_SECRET` via SHA-256.
   - Authenticated AES-256-GCM encryption with 96-bit random IV and 128-bit authentication tag.
   - Credential masking ensures plaintext secrets are never returned to frontend JavaScript or exposed in page source.
4. **Document Stream Privacy**:
   - Direct static file serving of customer documents is prohibited.
   - All KYC documents are streamed through `/api/documents/download`, which enforces strict session verification and role-based ownership checks before streaming binary buffers.

---

## 6. Paid Signals & Market Intelligence Architecture

The Signals module delivers professional, compliance-verified market intelligence via an internal 6-agent AI review pipeline and subscription-gated distribution.

```
                           SIGNAL LIFECYCLE & AI GATEWAY
                                         │
                                         ▼
                                   [ADMIN / DESK]
                       Author / Import Research Draft
                       (Attribution, Validity, Risk)
                                         │
                                         ▼
                                 [SIGNAL: DRAFT]
                                         │
                                         ▼
                           6-AGENT AI REVIEW PIPELINE
          ┌─────────────┬─────────────┬─────────────┬─────────────┐
          ▼             ▼             ▼             ▼             ▼
       ATLAS         VECTOR        ORION        SENTINEL        AEGIS
       Market      Technical     Fundamental      Risk &      Compliance
      Context      Structure     & Catalysts    Integrity     Gatekeeper
          │             │             │             │             │
          └─────────────┴──────┬──────┴─────────────┴─────────────┘
                               │
                               ▼
                             NEXUS
                     Synthesis Coordinator
             (Review / Warning / Compliance Block)
                               │
                               ▼
                     [SIGNAL: HUMAN_REVIEW]
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [Aegis = BLOCK]                 [Aegis != BLOCK]
       Hard-Locked                     Admin Human Approval
       (Approval Blocked)                      │
                                               ▼
                                      [SIGNAL: APPROVED]
                                               │
                                               ▼
                                     [SIGNAL: PUBLISHED]
                                               │
                               ┌───────────────┴───────────────┐
                               ▼                               ▼
                     UNSUBSCRIBED CLIENTS             SUBSCRIBED CLIENTS
                     • Public Title & Teaser          • Full Research Content
                     • Category & Risk Level          • Complete 6-Agent Reviews
                     • Server-Side Redacted           • SMC Trade Execution Handoff
                     • Upgrade Paywall CTA            • Active Validity Monitoring
```

### Core Architecture Pillars:
1. **Human Authorship & SEBI AP Boundaries**: Signals must originate from authorized human analysts or SMC research feeds. The AI team strictly functions as an analytical and compliance review layer—AI never autonomously creates, approves, or publishes trading calls or target prices.
2. **6-Agent Review Specialization**:
   - **Atlas (Agent 01)**: Market Context & Macro Intelligence (NIFTY/SENSEX, breadth, volatility).
   - **Vector (Agent 02)**: Technical & Quantitative Intelligence (structure, volume, momentum without directional buy/sell mandates).
   - **Orion (Agent 03)**: Fundamental & Event Intelligence (corporate actions, earnings, disclosures).
   - **Sentinel (Agent 04)**: Risk & Data Integrity Intelligence (data freshness, leverage risks, stop-loss hygiene).
   - **Aegis (Agent 05)**: Compliance Gatekeeper (evaluates prohibited guarantees, missing attribution, directive claims; holds hard-blocking authority).
   - **Nexus (Agent 06)**: Synthesis Coordinator (consolidates reviews, reconciles conflicts, sets composite verdict).
3. **Fail-Closed Compliance Gate**: If Aegis evaluates a signal with `BLOCK` (e.g. promissory language, guaranteed returns), backend service barriers strictly prevent administrator approval or publication.
4. **Server-Side Paywall & Redaction**: Non-subscribers never receive full research content or agent reviews over the API. Data redaction occurs at the database query/service layer.
5. **Immutable Version History**: Every revision to a signal creates an immutable `SignalVersion` record before publication.
6. **Dynamic Admin Configuration**: Pricing (default ₹499/mo), billing periods, disclaimers, and enabled categories are fully configurable via `/admin/signals/settings` without code redeployments.

