# Database Schema & Data Models

TWM uses Prisma ORM with SQLite for zero-credential local development and test execution. It seamlessly switches to PostgreSQL in production environments.

## 🗄️ Relational Entity-Relationship Summary

```
   [User] ──1:1── [Customer] ──1:N── [Application] ──1:N── [Document]
     │                 │                     │
     │                 └──1:N── [Task]       └──1:N── [SupportTicket]
     │                 │           │
     ├──1:1── [Employee] ──────────┘
     │                 │
     │                 ├──1:N── [Lead] ──1:N── [FollowUp]
     │                 └──1:N── [EmployeeDailyReport]
     │
     ├──1:N── [Watchlist]
     ├──1:N── [Notification]
     └──1:N── [ActivityLog] (Audit)

   [Product] (Catalog & Requirements)
   [KnowledgeArticle] (Approved SOPs)
```

---

## 📋 Entity Descriptions

1. **User**: Authentication credentials (`passwordHash` with bcrypt), contact info, system role (`CLIENT`, `EMPLOYEE`, `ADMIN`), and account lifecycle status (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
2. **Customer**: Linked to User. Stores `customerCode`, PAN, KYC verification status, and assigned employee.
3. **Employee**: Linked to User. Stores `employeeCode`, department, designation, and relations to assigned leads, tasks, applications, and daily reports.
4. **Lead**: CRM entity tracking lead contact details, acquisition source, product interest, notes, and pipeline stage (`NEW_LEAD` through `COMPLETED` or `LOST_CLOSED`).
5. **Product**: Catalog of financial services (`SMC_DEMAT`, `MUTUAL_FUNDS`, `SIP`, `IPO`, `HEALTH_INSURANCE`, `PERSONAL_LOAN`, etc.), active flags, and JSON array of required verification documents.
6. **Application**: Central tracking entity for customer service requests. Stores `applicationNumber` (`TWM-APP-YYYY-XXXX`), product category, status (`NEW`, `IN_PROGRESS`, `DOCUMENTS_REQUIRED`, `SUBMITTED`, `UNDER_REVIEW`, `COMPLETED`, `REJECTED`), and review notes.
7. **Task**: Daily operational task items with priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), due dates, customer/lead links, and completion timestamps.
8. **FollowUp**: Scheduled client interaction logs with outcome notes and automatic task generation.
9. **Document**: Encrypted/secured file references with document types (`PAN`, `AADHAAR`, `BANK_STATEMENT`, etc.) and verification statuses.
10. **Watchlist**: Persisted user stock lists storing JSON arrays of verified NSE/BSE symbols.
11. **KnowledgeArticle**: Authorized SOPs and compliance guidelines authored by the compliance desk.
12. **EmployeeDailyReport**: Quantified end-of-day operational summary filed by staff members.
13. **ActivityLog**: Tamper-evident audit log storing actor ID, role, action name, entity ID, JSON details, and client IP address.

---

## 🛠️ Management Commands

```bash
# Push schema to SQLite database (dev.db)
npx prisma db push

# Re-generate Prisma Client
npx prisma generate

# Re-run foundation seed
npm run db:seed
```
