# Tradosphere Wealth Management (TWM)
## Production-Grade Android-First Financial Services Platform

TWM is a unified financial services and business operating platform connecting customers, employees, and management into one compliant ecosystem. Tradosphere Wealth Management operates in relationship with SMC Global Securities Ltd as an Authorised Person (AP).

---

## 🏛️ Core Principles & Boundaries (Master Reference)

1. **Three Operating Environments (One Platform)**:
   - **Client Panel** (`/home`, `/markets`, `/invest`, `/protect`, `/borrow`, `/applications`, `/account`): Android-first mobile financial experience for exploring markets, watchlists, mutual funds, SIP calculator, IPO desk, insurance, loans, and application tracking.
   - **Employee Panel** (`/employee`, `/employee/leads`, `/employee/tasks`, `/employee/followups`, `/employee/applications`, `/employee/knowledge`, `/employee/copilot`, `/employee/report`): Complete daily operating system for relationship managers and operations staff.
   - **Admin Panel** (`/admin`, `/admin/users`, `/admin/employees`, `/admin/crm`, `/admin/products`, `/admin/applications`, `/admin/audit-logs`, `/admin/integrations`): Executive control center for role assignments, CRM oversight, and compliance auditing.

2. **Strict Regulatory Boundaries (SEBI Compliance)**:
   - TWM is **not** an independent SEBI Registered Investment Adviser (RIA) or Research Analyst (RA).
   - TWM does **not** provide stock tips, buy/sell/hold calls, price targets, guaranteed returns, or proprietary portfolio advice.
   - The AI Copilot is strictly bounded by regex and heuristic compliance filters that reject advisory requests.

3. **No Paper Trading / No Fake Data**:
   - Zero paper trading or simulated execution.
   - Genuine Indian market reference directory (NSE/BSE equities, ISIN, sectors).
   - When live market feed or broker APIs are unconfigured, TWM presents honest states (`Data Unavailable`, `Configuration Required`).

4. **SMC Global Handoff**:
   - Trade execution, order books, and depository accounts reside directly within SMC Global / SMC Ace.
   - TWM provides transparent account opening links and handoff CTAs.

---

## 🚀 Quick Start

### 1. Requirements
- Node.js >= 18 (Tested on v20.20.2)
- npm >= 9

### 2. Installation & Setup
```bash
# Install dependencies
npm install

# Initialize database schema (SQLite locally, PostgreSQL in prod)
npx prisma generate
npx prisma db push

# Seed foundation data (Approved products, SOPs, and test accounts)
npm run db:seed
```

### 3. Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Test Accounts (Configured in Seed Data)

| Role | Email | Password | Access Path |
| :--- | :--- | :--- | :--- |
| **Principal Admin** | `admin@tradosphere.in` | `Admin@123456` | `/admin` |
| **Wealth Executive** | `employee@tradosphere.in` | `Employee@123456` | `/employee` |
| **Retail Client** | `client@tradosphere.in` | `Client@123456` | `/home` |

*Note: Use the "Quick Role Test Fill" buttons on the `/login` page to auto-fill these credentials.*

---

## 🧪 Testing & Verification

```bash
# Run unit & integration test suite (Vitest)
npm run test

# Run TypeScript typecheck
npm run typecheck

# Build for production
npm run build
```

---

## 📚 Technical Documentation

- [Architecture & Design System](ARCHITECTURE.md)
- [Role-Based Access Control (RBAC)](RBAC.md)
- [Database Schema & Models](DATABASE.md)
- [Integrations & Adapters](INTEGRATIONS.md)
- [Environment Configuration](ENVIRONMENT.md)
- [Testing & Quality Assurance](TESTING.md)
