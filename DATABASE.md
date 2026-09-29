# Database Schema & Data Models

TWM uses **Prisma ORM** with **SQLite** for zero-dependency local development and CI testing, and seamlessly transitions to **PostgreSQL** in production environments.

## 1. Relational Entity-Relationship Summary

```
   [User] ──1:1── [Customer] ──1:N── [Application] ──1:N── [Document]
     │                 │                     │
     │                 └──1:N── [Task]       └──1:N── [SupportTicket]
     │                 │           │                     │
     ├──1:1── [Employee] ──────────┘                     │
     │                 │                                 │
     │                 ├──1:N── [Lead] ──1:N── [FollowUp]│
     │                 ├──1:N── [EmployeeDailyReport]   │
     │                 └──1:N── [AssignedTickets] ───────┘
     │
     ├──1:N── [Watchlist]
     ├──1:N── [Notification]
     ├──1:N── [ActivityLog] (Audit)
     └──1:N── [Subscription] ──N:1── [SubscriptionPlan]
                    │
                    └──1:N── [SubscriptionEvent]

   [Signal] ──1:N── [SignalAiReview] (Atlas, Vector, Orion, Sentinel, Aegis, Nexus)
      │
      └──1:N── [SignalVersion] (Immutable Historical Snapshots)

   [SignalSettings] (Dynamic Pricing, Billing Period, Categories, Disclaimers)
   [Product] (Financial Catalog & Required Checklists)
   [KnowledgeArticle] (Approved SOPs & Regulatory Guidelines)
   [IntegrationConfig] (AES-256-GCM Encrypted Provider Vault)
```

---

## 2. Core Entity Models

### 1. `User`
Primary identity and authentication table:
- `id`: Unique CUID identifier.
- `email`: Normalized unique login email.
- `passwordHash`: Bcrypt salted hash (rounds = 12).
- `name`: Full legal name.
- `phone`: Contact telephone number.
- `role`: Enum (`CLIENT`, `EMPLOYEE`, `ADMIN`).
- `status`: Enum (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
- `createdAt`, `updatedAt`: Timestamps.

### 2. `Customer`
Customer profile linked 1:1 with `User`:
- `id`, `userId`: Identity relation.
- `customerCode`: System-generated unique identifier (`TWM-CUST-YYYY-XXXX`).
- `pan`: Tax identification number.
- `kycStatus`: Enum (`PENDING`, `IN_REVIEW`, `VERIFIED`, `REJECTED`).
- `assignedEmployeeId`: Foreign key to assigned relationship officer.

### 3. `Employee`
Staff profile linked 1:1 with `User`:
- `id`, `userId`: Identity relation.
- `employeeCode`: Unique staff identifier (`TWM-EMP-YYYY-XXXX`).
- `department`: Department string (`WEALTH_ADVISORY`, `OPERATIONS`, `COMPLIANCE`).
- `designation`: Corporate title (`Relationship Manager`, `Principal Officer`).

### 4. `Application`
Customer service requests and financial onboarding:
- `id`: CUID.
- `applicationNumber`: Display code (`TWM-APP-YYYY-XXXX`).
- `customerId`: Foreign key to `Customer`.
- `productId`: Foreign key to `Product`.
- `status`: Workflow enum (`NEW`, `IN_PROGRESS`, `DOCUMENTS_REQUIRED`, `SUBMITTED`, `UNDER_REVIEW`, `COMPLETED`, `REJECTED`).
- `formDataJson`: Dynamic submission fields stored as structured JSON.
- `reviewNotes`: Internal remarks entered by processing staff.
- `assignedEmployeeId`: Staff reviewer.

### 5. `Document`
KYC files and verification records:
- `id`: CUID.
- `customerId`: File owner.
- `applicationId`: Associated service request (optional).
- `type`: Enum (`PAN`, `AADHAAR_FRONT`, `AADHAAR_BACK`, `BANK_STATEMENT`, `CANCELLED_CHEQUE`, `INCOME_PROOF`, `PASSPORT_PHOTO`).
- `fileName`: Original uploaded file name.
- `filePath`: Safe local or cloud storage object key.
- `fileSize`: File size in bytes.
- `mimeType`: Media type (`application/pdf`, `image/png`, `image/jpeg`).
- `verificationStatus`: Enum (`PENDING`, `VERIFIED`, `REJECTED`).
- `rejectionReason`: Explanatory message provided to client upon rejection.

### 6. `SupportTicket`
In-app customer support requests and resolutions:
- `id`: CUID.
- `ticketNumber`: Display identifier (`TWM-TKT-YYYY-XXXX`).
- `customerId`: Submitting client.
- `assignedEmployeeId`: Staff member assigned to resolve the ticket.
- `category`: Enum (`KYC_VERIFICATION`, `DEMAT_ACCOUNT`, `MUTUAL_FUNDS`, `SIP_INQUIRY`, `IPO_APPLICATION`, `DOCUMENT_UPLOAD`, `TECHNICAL_SUPPORT`, `OTHER`).
- `subject`: Ticket title.
- `description`: Client's detailed explanation.
- `priority`: Enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- `status`: Enum (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
- `resolutionNotes`: Staff closing remarks and customer-facing solution notes.
- `resolvedAt`: Resolution timestamp.

### 7. `Lead`
CRM business development record:
- `id`: CUID.
- `employeeId`: Assigned sales/wealth manager.
- `name`, `email`, `phone`: Prospective client contact details.
- `source`: Acquisition channel (`WEBSITE_INQUIRY`, `REFERRAL`, `DIRECT_OUTREACH`, `SMC_CAMPAIGN`).
- `status`: 8-stage pipeline (`NEW_LEAD`, `CONTACTED`, `INTERESTED`, `FOLLOW_UP`, `DOCUMENTS_REQUIRED`, `APPLICATION`, `COMPLETED`, `LOST_CLOSED`).
- `productInterest`: Preferred investment vehicle.
- `estimatedValue`: Estimated investable assets.
- `notes`: Relationship officer notes.

### 8. `Task`
Operational tasks for wealth managers:
- `id`: CUID.
- `employeeId`: Assigned staff member.
- `customerId`, `leadId`: Optional context links.
- `title`, `description`: Action item details.
- `priority`: Enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- `dueDate`: Task deadline.
- `completed`: Boolean flag.
- `completedAt`: Timestamp.

### 9. `FollowUp`
Structured client interaction logs:
- `id`: CUID.
- `leadId`: Parent prospect.
- `employeeId`: Staff participant.
- `scheduledAt`: Follow-up date and time.
- `outcomeNotes`: Summary of discussion and next steps.
- `completed`: Status flag.

### 10. `Product`
Master catalog of financial offerings:
- `id`: Unique slug (`smc-demat-trading`, `mutual-funds-direct`, `sip-investments`, `ipo-asba-financing`, `health-insurance-comprehensive`).
- `name`: Display title.
- `category`: Classification (`BROKERAGE`, `INVESTMENTS`, `INSURANCE`, `LENDING`).
- `description`: Product overview.
- `requiredDocumentsJson`: JSON array of mandatory verification documents.
- `active`: Boolean flag controlling public visibility.

### 11. `KnowledgeArticle`
Authorized SOPs and compliance guidelines:
- `id`: Slug.
- `title`: Procedure title.
- `category`: Domain (`ONBOARDING`, `COMPLIANCE`, `OPERATIONS`, `PRODUCTS`).
- `content`: Markdown text of the approved standard operating procedure.
- `tagsJson`: Keyword index for heuristic retrieval and AI Copilot grounding.

### 12. `EmployeeDailyReport`
End-of-day staff operational audit:
- `id`: CUID.
- `employeeId`: Reporting staff member.
- `reportDate`: Calendar date.
- `callsCount`, `meetingsCount`, `leadsContactedCount`, `applicationsProcessedCount`: Metrics.
- `summaryNotes`: Qualitative narrative of the workday.

### 13. `ActivityLog`
Tamper-evident system audit log:
- `id`: CUID.
- `actorId`: User ID of the initiator.
- `actorRole`: Initiator's role at time of action.
- `action`: Standardized event string (`AUTH_LOGIN`, `USER_ROLE_CHANGED`, `INTEGRATION_SAVED`, etc.).
- `entityType`, `entityId`: Target entity.
- `detailsJson`: JSON record of parameter changes and state transitions.
- `ipAddress`: Request IP address.
- `createdAt`: Immutable audit timestamp.

### 14. `IntegrationConfig`
Encrypted credential vault and connection management store:
- `id`: CUID.
- `key`: Unique provider identifier (`database`, `supabase`, `upstox`, `smc_global`, `ai_provider`, `email`, `storage`, `notifications`, `market_data`).
- `category`: Category string (`DATABASE`, `MARKET_DATA`, `BROKERAGE`, `AI`, `EMAIL`, `STORAGE`, `NOTIFICATIONS`).
- `status`: Configuration state (`NOT_CONFIGURED`, `CONFIGURED`, `CONNECTED`, `CONNECTION_FAILED`, `DISABLED`, `OPTIONAL`, `REQUIRES_MANUAL_SETUP`).
- `encryptedSecrets`: Authenticated ciphertext (`iv:authTag:encryptedData`) encrypted with AES-256-GCM.
- `publicConfigJson`: Non-sensitive settings (URLs, environment flags, model names) stored as plaintext JSON.
- `maskedSecretsJson`: Safe masked strings (`••••••••••••abcd`) displayed in Admin UI.
- `lastTestedAt`: Timestamp of the most recent connection test.
- `lastTestResult`: Status string (`PASSED`, `FAILED`, `PENDING`).
- `lastErrorMessage`: Sanitized error description if test failed.
- `lastLatencyMs`: Round-trip connection latency in milliseconds.

### 15. `Signal`
Market intelligence and analysis publication entity:
- `id`: CUID.
- `title`: Professional headline (e.g. "NIFTY 50 Range Breakout Analysis").
- `slug`: URL-friendly identifier.
- `category`: Classification enum (`FO`, `EQUITY`, `INDEX`, `COMMODITY`, `IPO`, `MUTUAL_FUNDS`, `SIP`, `MARKET_OUTLOOK`, `CORPORATE_ACTIONS`, `MACRO_EVENTS`, `RISK_ALERTS`, `EDUCATIONAL`).
- `status`: Lifecycle enum (`DRAFT`, `AI_REVIEW`, `HUMAN_REVIEW`, `APPROVED`, `PUBLISHED`, `ACTIVE`, `CLOSED`, `EXPIRED`, `REJECTED`, `SENT_BACK`).
- `summary`: Short teaser visible to all clients.
- `content`: Full markdown research body (redacted on server for non-subscribers).
- `riskLevel`: Risk classification (`LOW`, `MODERATE`, `HIGH`, `VERY_HIGH`).
- `horizon`: Time horizon (`INTRADAY`, `SWING`, `POSITIONAL`, `SHORT_TERM`, `MEDIUM_TERM`, `LONG_TERM`).
- `sourceType`: Attribution type (`INTERNAL_RESEARCH`, `SMC_RESEARCH`, `APPROVED_PARTNER`, `EXTERNAL_AUTHORIZED`).
- `sourceName`: Attributed research author or firm.
- `sourceUrl`: Optional reference URL.
- `disclaimer`: Regulatory non-advisory disclaimer.
- `createdById`, `approvedById`, `publishedById`: Audit foreign keys to `User`.
- `reviewedAt`, `approvedAt`, `publishedAt`, `expiresAt`, `closedAt`: Lifecycle timestamps.

### 16. `SignalAiReview`
Individual intelligence outputs from the 6-agent AI review pipeline:
- `id`: CUID.
- `signalId`: Parent signal relation.
- `agentName`: Agent identifier (`ATLAS`, `VECTOR`, `ORION`, `SENTINEL`, `AEGIS`, `NEXUS`).
- `agentRole`: Display title (e.g. "Compliance Gatekeeper").
- `verdict`: Agent assessment (`PASS`, `WARNING`, `BLOCK`, `REVIEW`, `DATA_UNAVAILABLE`).
- `summary`: Narrative synthesis of the review.
- `findingsJson`: Structured JSON array of specific observations, warnings, or evidence.
- `confidence`: Confidence score (0.0 to 1.0).
- `dataQuality`: Data freshness/coverage indicator (`GOOD`, `WARNING`, `DATA_UNAVAILABLE`).
- `executionMs`: Round-trip evaluation latency.

### 17. `SignalVersion`
Immutable historical snapshot tracking edits to signals:
- `id`: CUID.
- `signalId`: Target signal.
- `versionNumber`: Incremental version integer.
- `title`, `summary`, `content`, `category`, `riskLevel`: Snapshot state.
- `changeSummary`: Description of edits.
- `changedById`: Editor foreign key.

### 18. `SubscriptionPlan`
Tiered offerings for paid intelligence access:
- `id`: Unique identifier (`SIGNALS_MONTHLY`, `SIGNALS_ANNUAL`).
- `name`: Display name (e.g. "TWM Signals & Market Intelligence").
- `description`: Plan benefits and coverage.
- `price`: Plan price in INR (e.g. ₹499).
- `currency`: Currency code (`INR`).
- `billingPeriod`: Cycle (`MONTHLY`, `QUARTERLY`, `ANNUAL`).
- `active`: Availability flag.
- `featuresJson`: Structured JSON list of included entitlements.

### 19. `Subscription`
Client subscription contract linked to `User` and `SubscriptionPlan`:
- `id`: CUID.
- `userId`: Subscribed client.
- `planId`: Subscribed plan.
- `status`: Lifecycle state (`ACTIVE`, `TRIAL`, `EXPIRED`, `CANCELLED`, `PAYMENT_PENDING`).
- `startDate`, `endDate`, `cancelledAt`: Validity windows.
- `paymentProvider`: Gateway identifier (e.g. `RAZORPAY`, `STRIPE`, `MANUAL`).
- `paymentReference`: External gateway transaction ID.
- `autoRenew`: Renewal flag.

### 20. `SubscriptionEvent`
Audit trail of subscription status transitions:
- `id`: CUID.
- `subscriptionId`: Target subscription.
- `eventType`: Event string (`CREATED`, `ACTIVATED`, `RENEWED`, `CANCELLED`, `EXPIRED`, `PAYMENT_FAILED`).
- `detailsJson`: Event metadata payload.

### 21. `SignalSettings`
Singleton configuration table for the Signals module:
- `id`: Unique key (`default`).
- `signalsModuleEnabled`: Global feature toggle.
- `monthlyPrice`: Active monthly subscription price in INR (dynamic, not hard-coded).
- `billingPeriod`: Active period string (`MONTHLY`).
- `enabledCategoriesJson`: JSON array of enabled category slugs.
- `globalDisclaimer`: Master compliance disclaimer rendered across all signals.
- `updatedById`: Admin editor foreign key.

---

## 3. Database Management Commands

```bash
# Push schema changes to development database (dev.db)
npx prisma db push

# Re-generate the Prisma Client TypeScript types
npx prisma generate

# Execute database foundation seeds (default users, products, SOPs, integration cards)
npm run db:seed
```
