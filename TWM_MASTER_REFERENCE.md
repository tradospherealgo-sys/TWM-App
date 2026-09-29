# TWM — TRADOSPHERE WEALTH MANAGEMENT
# MASTER PRODUCT REFERENCE
# Version 1.0 — New Product Build

---

# 1. DOCUMENT PURPOSE

This document is the single source of truth for the new TWM application.

TWM means:

TRADOSPHERE WEALTH MANAGEMENT

This is a NEW PRODUCT BUILD.

The existing Tradosphere beta application is NOT the source code for this project.

The new application must be designed and built as a professional, production-oriented financial-services platform from the ground up.

All product, UX, architecture and business decisions should follow this document unless an explicit later product decision supersedes it.

---

# 2. PRODUCT VISION

TWM is NOT simply a stock-trading application.

TWM is a unified:

- Financial Information Platform
- Financial Services Platform
- Customer Relationship Platform
- Employee Operating System
- Business Management Platform

TWM connects three experiences:

1. CLIENT
2. EMPLOYEE
3. ADMIN

The customer uses TWM for:

- Market information
- Financial education
- Trading access through the SMC Global relationship
- Mutual funds
- SIP
- IPO
- Insurance services
- Loan services
- Application tracking
- Documents
- Notifications
- Customer support

Employees use TWM for:

- CRM
- Leads
- Customers
- Follow-ups
- Daily tasks
- Product knowledge
- Internal SOPs
- AI assistance
- Daily reports
- Performance/activity management

Administrators use TWM for:

- Customer management
- Employee management
- CRM
- Products
- Applications
- Tasks
- Permissions
- Reports
- Business operations
- Platform configuration

---

# 3. CORE PRODUCT PHILOSOPHY

TWM should not attempt to replace every financial application.

The product philosophy is:

TWM = financial relationship + information + service platform

SMC Global / SMC Ace = actual trading/execution environment.

TWM should surround the trading relationship rather than unnecessarily duplicate the broker's complete trading terminal.

The customer should be able to use TWM before, during and after financial-service interactions.

The goal is to make TWM useful even when the customer is not actively trading.

---

# 4. WHY TWM EXISTS

The customer should not need separate disconnected experiences for:

- Understanding the market
- Opening a trading account
- Exploring investments
- SIP
- IPO
- Insurance
- Loans
- Applications
- Documents
- Customer support

TWM brings these journeys into one relationship.

The core customer proposition is:

> ONE FINANCIAL RELATIONSHIP.
> MULTIPLE FINANCIAL SERVICES.

---

# 5. TWM + SMC GLOBAL RELATIONSHIP

TWM is intended to operate in the context of the Tradosphere Wealth Management relationship with SMC Global as an Authorised Person.

The exact legal name, AP terminology, SMC branding, segment permissions, services, onboarding flow and customer-facing disclosures MUST be based on the actual SMC documentation and permissions available to TWM.

Do not invent regulatory permissions.

Do not invent exchange memberships.

Do not invent SMC services.

Do not claim services or segments that have not been confirmed.

Where applicable:

TWM = customer-facing relationship/platform

SMC Global = broker relationship

SMC Ace = actual trading/execution environment

---

# 6. TRADING PHILOSOPHY

TWM should NOT recreate SMC Ace.

TWM should provide:

- Trading information
- Market overview
- Stock information
- Watchlists
- Trading education
- SMC onboarding/access journey
- Appropriate links or handoff to SMC Ace
- Customer support around the TWM/SMC relationship

Actual trade execution belongs to the appropriate SMC environment/integration.

Do not build fake order execution.

Do not build simulated orders.

Do not create fake trading confirmations.

Do not create fake positions.

Do not create fake P&L.

Do not create fake brokerage data.

If a live SMC integration is not configured, clearly show that the integration requires configuration rather than fabricating functionality.

---

# 7. PAPER TRADING

PAPER TRADING IS NOT PART OF THE TWM PRODUCT.

Do NOT build:

- Paper trading
- Virtual portfolio
- Simulated orders
- Demo trading
- Paper trading competitions
- Paper trading CTAs
- "Coming soon" paper-trading pages

TWM does not need paper trading.

---

# 8. REGULATORY / BUSINESS BOUNDARY

TWM is NOT to behave as an independent SEBI-registered Investment Adviser or Research Analyst unless the required registration/permission/arrangement actually exists.

The product must not independently present TWM as providing:

- Personalized investment advice
- Personalized stock recommendations
- Buy recommendations
- Sell recommendations
- Hold recommendations
- Price targets
- Proprietary stock research
- Personalized portfolio recommendations
- AI trading signals
- Guaranteed returns
- Guaranteed profits
- Risk-free investments
- Guaranteed SIP returns
- Guaranteed IPO gains

Do not build functionality whose primary purpose is to generate such recommendations.

---

# 9. INFORMATION VS ADVICE

TWM should clearly separate:

## INFORMATION

Examples:

- Market prices
- Index information
- Company information
- Publicly available financial information
- Corporate actions
- IPO information
- General product information
- Market news from legitimate sources
- Mutual-fund information where permitted
- Insurance product information
- Loan product information

## EDUCATION

Examples:

- What is an equity?
- What is a Demat account?
- What is SIP?
- What is an IPO?
- What is P/E?
- What is market capitalization?
- What is F&O?
- What is insurance?
- What is a credit score?
- General financial literacy

## SERVICE FACILITATION

Examples:

- Demat/trading onboarding
- SMC relationship
- Mutual-fund/SIP service workflows where permitted
- IPO workflows where permitted
- Insurance applications
- Loan applications
- Document collection
- Application tracking

## PERSONALIZED REGULATED ADVICE

This is NOT a standard TWM feature.

If a future regulated/advisory relationship is introduced, it must be separately designed, legally reviewed and permissioned.

---

# 10. TWM AI POLICY

AI is an important part of TWM.

But AI is NOT the product's stock-tip engine.

AI should primarily function as:

- Information assistant
- Education assistant
- Product assistant
- Employee copilot
- CRM assistant
- Workflow assistant
- Internal knowledge assistant

AI may explain financial concepts.

AI may explain product processes.

AI may help employees follow approved SOPs.

AI may help navigate the TWM application.

AI may summarize information.

AI may generate administrative drafts.

AI must NOT independently turn TWM into an unregistered investment adviser/research service.

Do not create:

"Which stock should I buy?"

"Buy RELIANCE now."

"Sell HDFC Bank."

"Best stock for you."

"Your portfolio should contain..."

"Guaranteed return."

"AI signal: BUY."

---

# 11. THREE-PANEL ARCHITECTURE

TWM has three primary application experiences.

## PANEL 1 — CLIENT

For customers.

## PANEL 2 — EMPLOYEE

For TWM employees and authorized operational staff.

## PANEL 3 — ADMIN

For administrators and authorized management.

The panels must share the same core platform but have completely different navigation, permissions and workflows.

---

# 12. ROLE-BASED ACCESS CONTROL

Primary roles:

- CLIENT
- EMPLOYEE
- ADMIN

Optional future roles may be introduced if genuinely required.

The backend must determine the authenticated user's role.

The frontend must NOT be trusted to enforce security.

Role permissions must be enforced server-side.

A client cannot promote themselves.

An employee cannot promote themselves.

An employee cannot access Admin functionality merely by manipulating the frontend.

Admin role assignment must be controlled securely.

---

# 13. CLIENT PANEL

The Client Panel is the public/customer-facing TWM experience.

The Client Panel must feel:

- Premium
- Trustworthy
- Modern
- Financial
- Simple
- Fast
- Professional
- Android-first
- Easy for a normal Indian retail customer

It must not look like a generic SaaS dashboard.

---

# 14. CLIENT PRIMARY NAVIGATION

Recommended primary structure:

HOME

MARKETS

INVEST

PROTECT

BORROW

ACCOUNT

Trade should be highly visible within Home/Markets and may have a dedicated CTA rather than duplicating SMC Ace navigation.

Navigation can be refined during UX implementation if usability testing indicates a better structure.

---

# 15. CLIENT HOME

The Home screen is the most important screen.

It should answer immediately:

1. What is happening in the market?
2. What can I do with TWM?
3. What actions are pending?
4. What financial services do I have?
5. What should I do next?

Suggested sections:

- Greeting
- Financial snapshot
- Market snapshot
- Quick actions
- Pending actions
- Applications
- Notifications
- Services
- Education
- Support

Example quick actions:

TRADE

INVEST

SIP

IPO

INSURANCE

LOANS

The actual UI must be premium and uncluttered.

---

# 16. CLIENT MARKET SECTION

Market section should provide useful market information.

Possible areas:

- NIFTY 50
- SENSEX
- BANK NIFTY
- Other supported indices
- Stock search
- Watchlists
- Market movers
- Sector information
- Charts
- Volume information
- 52-week high/low
- Corporate actions
- Market news/information

Live market data MUST come from a legitimate configured provider.

Do not hardcode fake prices.

Do not generate fake prices.

Do not make the UI appear live if live data is unavailable.

---

# 17. STOCK INFORMATION SCREEN

A stock information screen may include:

- Company name
- Symbol
- Current price
- Change
- Percentage change
- Open
- High
- Low
- Previous close
- Volume
- 52-week range
- Chart
- Company information
- Corporate actions
- Relevant information/news
- Add to watchlist
- Trade through SMC

The screen must not present TWM's own stock recommendation.

---

# 18. WATCHLISTS

Users should be able to:

- Create watchlists
- Rename watchlists
- Add stocks
- Remove stocks
- Reorder stocks
- View current information
- Open stock details

Example:

MY WATCHLIST

- Reliance
- HDFC Bank
- TCS
- Infosys
- Tata Motors

Watchlist data must be user-specific and persisted securely.

---

# 19. TRADE / SMC EXPERIENCE

TWM should prominently communicate:

TRADE WITH SMC GLOBAL

The user can:

- Learn about trading services
- Start account-opening/onboarding where permitted
- View relevant information
- Access appropriate SMC trading environment
- Contact TWM support

Actual execution should be through SMC / supported broker environment.

Do not unnecessarily duplicate:

- Full order book
- Order entry
- Advanced broker terminal
- Positions
- Full execution engine

unless a legitimate supported integration is actually implemented.

---

# 20. INVEST SECTION

Invest contains:

- Mutual Funds
- SIP
- IPO
- Calculators
- Financial education

The design should make long-term investing understandable.

Avoid aggressive return claims.

Avoid "guaranteed growth" language.

---

# 21. MUTUAL FUNDS

Mutual Fund section should support the actual permitted business model.

Possible structure:

- Explore Mutual Funds
- Categories
- Scheme information
- Risk information
- Fund details
- SIP
- My Investments
- Application/action flow
- Education

Do not fabricate live NAV or transaction information.

If live data is unavailable, clearly identify the state.

---

# 22. SIP

SIP should have a dedicated experience.

Features may include:

- Learn about SIP
- SIP calculator
- Start SIP workflow
- Existing SIPs
- SIP details
- Upcoming instalment
- Application/status
- Education

SIP illustrations must not be represented as guaranteed returns.

---

# 23. SIP CALCULATOR

Inputs:

- Monthly investment
- Duration
- Illustrative expected return

Outputs:

- Total invested
- Illustrative estimated value
- Illustrative growth

The calculator must clearly state that illustrations are not guarantees and market-linked investments carry risk.

---

# 24. IPO CENTER

IPO should be a major information/service area.

Sections:

- Open IPOs
- Upcoming IPOs
- Closed IPOs
- Listed IPOs
- IPO details
- Important dates
- Price band
- Lot size
- Issue information
- Publicly available information
- Application workflow where supported
- My IPO applications

Do not make allotment claims unless sourced from legitimate data.

Do not promise IPO gains.

---

# 25. PROTECT — INSURANCE

Insurance is a major TWM service.

Categories may include:

- Life Insurance
- Health Insurance
- Motor Insurance
- Other permitted insurance services

Customer capabilities:

- Explore
- Request assistance
- Application
- Document collection
- Status
- Policy information
- Renewal reminders
- Support

TWM must not falsely represent itself as the insurer.

Exact insurance product/provider relationships must be configured according to the actual business arrangement.

---

# 26. BORROW — LOANS

Loan services may include:

- Personal Loan
- Business Loan
- Other permitted loan categories

Customer workflow:

1. Select requirement
2. Provide basic information
3. Eligibility/application
4. Document collection
5. Submission
6. Status tracking
7. Employee follow-up
8. Lender decision

Do not fabricate approvals.

Do not show "Approved" unless the actual lender has confirmed approval.

Exact lender relationships must be configured.

---

# 27. MY APPLICATIONS

This is a core TWM feature.

One unified place for all customer applications.

Possible categories:

- Demat
- Trading
- Mutual Fund
- SIP
- IPO
- Insurance
- Loan

Each application should have:

- Application ID
- Product
- Date
- Status
- Assigned employee if applicable
- Required documents
- Timeline
- Next action
- Support/contact option

Example statuses:

NEW

IN PROGRESS

DOCUMENTS REQUIRED

SUBMITTED

UNDER REVIEW

COMPLETED

REJECTED

CANCELLED

Actual statuses should be adapted to each service.

---

# 28. MY DOCUMENTS

Secure customer document area.

Possible document types:

- KYC documents
- Application documents
- Statements
- Insurance documents
- Loan documents
- Other service documents

Documents must have:

- Secure access
- Access control
- Upload state
- Verification state where applicable
- Download/view where permitted
- Audit trail where appropriate

Do not expose sensitive documents through insecure public URLs.

---

# 29. NOTIFICATIONS

Notifications should be useful, not spam.

Examples:

- KYC required
- Document required
- Application status
- IPO deadline
- SIP reminder
- Insurance renewal
- Employee follow-up
- Service update
- Important account information

Users should have notification preferences.

---

# 30. CUSTOMER SUPPORT

Support should include:

- Help center
- FAQs
- Search
- Contact TWM
- Support request
- Request history
- Application-related support

Possible channels:

- Phone
- Email
- Appropriate supported messaging/channel
- In-app support

WhatsApp is NOT a required launch feature.

Do not build WhatsApp functionality unless explicitly added later.

---

# 31. TWM ASSISTANT — CLIENT

The client assistant can help with:

- Product explanations
- Financial terminology
- General education
- TWM navigation
- Application instructions
- Service explanations
- FAQ
- Support routing

It should clearly avoid acting as a personalized investment adviser.

If a user asks for a personalized stock recommendation, the assistant should redirect toward general educational information and the appropriate authorized service/person where applicable.

---

# 32. EMPLOYEE PANEL

The Employee Panel is the employee's daily operating system.

It should not look like the Client Panel.

It should optimize for:

- Speed
- Tasks
- CRM
- Follow-ups
- Customer management
- Product knowledge
- Applications
- Reporting
- Productivity

---

# 33. EMPLOYEE DASHBOARD

Employee Home should show:

- Today's tasks
- Overdue tasks
- Upcoming follow-ups
- Assigned leads
- Assigned customers
- Applications requiring action
- Daily progress
- Targets where configured
- Notifications
- AI assistance
- Product knowledge shortcut

Example:

TODAY

12 Tasks

8 Calls

4 Follow-ups

3 Applications

2 Documents Pending

---

# 34. EMPLOYEE CRM

CRM is a core employee feature.

Lead/customer record should support:

- Name
- Phone
- Email
- Source
- Product interest
- Assigned employee
- Status
- Lead score only if based on a legitimate defined system
- Notes
- Follow-up
- Tasks
- Applications
- Documents
- Interaction history
- Timeline

Do not expose data to employees beyond their permissions.

---

# 35. CRM PIPELINE

Standard pipeline:

NEW LEAD

CONTACTED

INTERESTED

FOLLOW-UP

DOCUMENTS REQUIRED

APPLICATION

SUBMITTED

COMPLETED

LOST / CLOSED

The exact stages can vary by product.

---

# 36. EMPLOYEE TASK MANAGEMENT

Employees can receive:

- Daily tasks
- Follow-up tasks
- Customer calls
- Document tasks
- Application tasks
- CRM update tasks
- Internal tasks

Each task should have:

- Title
- Customer/lead
- Product
- Priority
- Due date
- Assigned employee
- Status
- Notes
- Completion time

---

# 37. EMPLOYEE FOLLOW-UPS

Employee should be able to:

- Schedule follow-up
- Record outcome
- Add notes
- Create next task
- Update lead status

Follow-up history should be preserved.

---

# 38. EMPLOYEE PRODUCT KNOWLEDGE

TWM should have an internal knowledge system.

Categories:

- SMC / Trading
- Mutual Funds
- SIP
- IPO
- Insurance
- Loans
- TWM services
- Product FAQs
- SOPs
- Customer handling
- Compliance-sensitive instructions

Knowledge must be searchable.

Employees should quickly find approved information.

---

# 39. EMPLOYEE AI COPILOT

AI Employee Copilot can:

- Search internal knowledge
- Explain approved SOPs
- Draft customer follow-ups
- Summarize customer interactions
- Summarize lead history
- Prepare daily reports
- Suggest operational next steps based on approved SOPs
- Help prepare customer communication drafts
- Help locate relevant product information

AI must not override:

- Admin permissions
- Regulatory boundaries
- Product rules
- Employee authority
- Required human approval

AI output should be treated as assistance, not an automatic authorization.

---

# 40. EMPLOYEE DAILY REPORT

Employee should submit a daily report.

Fields may include:

- Calls made
- Customers contacted
- New leads
- Follow-ups completed
- Applications handled
- Documents collected
- Conversions
- Pending work
- Problems
- Customer issues
- Tomorrow's priorities

The system should record submission date/time.

Admin/management should be able to review reports.

---

# 41. EMPLOYEE PERFORMANCE

Possible metrics:

- Assigned leads
- Contacted leads
- Follow-ups
- Applications
- Completed applications
- Conversion metrics
- Tasks completed
- Overdue tasks
- Daily report completion

Do not create misleading performance metrics.

Metrics should be configurable.

---

# 42. ADMIN PANEL

Admin is the business control center.

It must have its own navigation and UX.

Admin should NOT simply see the employee panel with extra buttons.

Admin dashboard may include:

- Customers
- Employees
- Leads
- Applications
- Tasks
- Product activity
- Operational status
- Reports
- Configuration
- Permissions
- Audit logs

---

# 43. ADMIN USER MANAGEMENT

Admin can manage:

- Clients
- Employees
- Admins where authorized

Actions may include:

- View
- Activate
- Deactivate
- Assign role
- Assign employee
- Manage permissions
- View activity

Role changes must be protected.

---

# 44. ADMIN EMPLOYEE MANAGEMENT

Admin can:

- Create employee
- Assign role
- Assign permissions
- Assign leads
- Assign tasks
- View daily reports
- View performance
- Manage employee status

---

# 45. ADMIN CRM

Admin can see the overall CRM.

Possible views:

- All leads
- Leads by employee
- Leads by product
- Pipeline
- Follow-ups
- Applications
- Conversion
- Customer activity

---

# 46. ADMIN PRODUCT MANAGEMENT

Admin should be able to manage configurable product/service content where technically and legally appropriate.

Possible controls:

- Product active/inactive
- Product title
- Description
- FAQ
- Employee knowledge
- Customer information
- Application availability
- CTA
- Required documents
- Workflow configuration

Do not allow Admin content changes to bypass required compliance controls.

---

# 47. ADMIN APPLICATION MANAGEMENT

Admin can monitor:

- Demat applications
- Trading applications
- MF applications
- SIP applications
- IPO applications
- Insurance applications
- Loan applications

Admin should be able to filter by:

- Customer
- Employee
- Product
- Status
- Date
- Priority

---

# 48. ADMIN TASK MANAGEMENT

Admin can:

- Create tasks
- Assign tasks
- Reassign tasks
- Set priority
- Set deadlines
- Review completion
- Review overdue tasks

---

# 49. ADMIN REPORTING

Reports may include:

- Lead volume
- Product-wise leads
- Application volume
- Employee activity
- Task completion
- Follow-ups
- Customer activity
- Service pipeline

Reports should use real database information.

No fake statistics.

---

# 50. ADMIN AUDIT LOGS

Important actions should be auditable.

Examples:

- Role change
- Permission change
- Customer data modification
- Application status modification
- Employee assignment
- Admin configuration
- Document access where appropriate

Audit logs should be protected from ordinary users.

---

# 51. USER ROLE SWITCHING

The platform should support role assignment by authorized Admin functionality.

A user can have a role such as:

CLIENT

EMPLOYEE

ADMIN

If the business later requires multiple roles or permissions, the architecture should support role/permission expansion.

The UI may show the correct panel based on role.

The user must NOT be able to self-select a privileged role.

---

# 52. DESIGN SYSTEM

TWM must have a unified design system.

The three panels may look related but should optimize for their respective users.

CLIENT:

Premium financial app.

EMPLOYEE:

Fast productivity/CRM workspace.

ADMIN:

Professional business control center.

Shared:

- Typography
- Brand language
- Icons
- Spacing principles
- Components
- Accessibility
- Interaction patterns

---

# 53. VISUAL DIRECTION

The visual design should feel:

- Premium
- Modern
- Trustworthy
- Financial
- Professional
- Sophisticated
- Clean
- High-quality
- Android-first

Use modern glass/soft surfaces only where they improve usability.

Do not overuse:

- Glassmorphism
- Gradients
- Glow effects
- Huge cards
- Excessive animation

Do not make the application look like a gaming app.

Do not make it look like a generic AI dashboard.

Do not make it look like a Bootstrap template.

---

# 54. UI QUALITY BAR

Every important screen should have:

- Clear hierarchy
- Useful content
- Loading state
- Empty state
- Error state
- Success state where appropriate
- Responsive layout
- Touch-friendly controls
- Accessible labels
- Proper validation

No dead buttons.

No meaningless cards.

No fake charts.

No fake counters.

No placeholder lorem ipsum in production-oriented screens.

---

# 55. MOBILE-FIRST

The Client Panel is Android-first.

The experience should work especially well on:

- Android phones
- Small screens
- Medium screens
- Modern high-resolution screens

Employee/Admin may support larger displays while remaining responsive.

---

# 56. DATA PRINCIPLES

Use real database architecture.

Core entities:

- Users
- Roles
- Permissions
- Employees
- Customers
- Leads
- Products
- Applications
- Tasks
- Follow-ups
- Documents
- Notifications
- Knowledge Articles
- Employee Reports
- Activity Logs
- Support Requests

Additional entities can be introduced where required.

---

# 57. CUSTOMER DATA MODEL

Customer should have a unified profile.

Possible relationships:

CUSTOMER

→ Trading relationship

→ Investments

→ SIPs

→ IPO applications

→ Insurance

→ Loans

→ Applications

→ Documents

→ Support

→ Notifications

→ Activity history

This is the central TWM customer relationship.

---

# 58. EMPLOYEE DATA MODEL

Employee should have:

- Profile
- Role
- Permissions
- Assigned leads
- Assigned customers
- Assigned tasks
- Follow-ups
- Daily reports
- Activity
- Knowledge access
- AI usage where appropriate

---

# 59. APPLICATION DATA MODEL

Every service application should have a unified application structure.

Possible fields:

- ID
- Customer
- Product
- Assigned employee
- Status
- Created date
- Updated date
- Required documents
- Submitted documents
- Notes
- Timeline
- Next action

Service-specific fields may be added separately.

---

# 60. SECURITY

Security is mandatory.

Implement:

- Secure authentication
- Server-side authorization
- RBAC
- Input validation
- Secure API routes
- Session security
- Environment variables
- Secure secrets management
- Audit logging
- Safe error handling
- Rate limiting where appropriate
- Secure document access
- No sensitive secrets in frontend
- No credentials committed to Git

Never rely only on frontend security.

---

# 61. SENSITIVE DATA

TWM may eventually handle sensitive financial/customer information.

Design accordingly.

Do not unnecessarily store sensitive data.

Do not expose documents publicly.

Do not log:

- Passwords
- Tokens
- API secrets
- Sensitive personal information
- Financial credentials

Use least-privilege access.

---

# 62. EXTERNAL INTEGRATIONS

Architecture must use adapters/service layers.

Potential integrations may include:

- SMC Global / SMC Ace
- Market-data provider
- Mutual-fund data/service provider
- IPO information/provider
- Insurance providers/intermediaries
- Loan providers/lenders
- Authentication provider
- Notifications
- Storage

Do not hardwire the application to a provider where an abstraction is practical.

---

# 63. LIVE DATA RULE

If an API is not configured:

DO NOT fabricate live data.

Show:

- Integration unavailable
- Configuration required
- Data unavailable
- Demo environment only

Never make demo data appear to be real financial data.

---

# 64. CREDENTIALS

Credentials must NEVER be committed.

Use environment variables.

Example categories:

- Database
- Authentication
- Market data
- SMC integration
- Notification
- Storage
- AI

The application should document required environment variables.

Never print secret values into logs.

---

# 65. AI ARCHITECTURE

AI should use appropriate boundaries.

Client AI:

- General information
- Education
- Navigation
- Product information
- Support

Employee AI:

- Internal knowledge
- SOP assistance
- CRM assistance
- Drafting
- Summaries
- Reports

Admin AI:

- Business summaries
- Internal analytics assistance
- Knowledge assistance
- Operational summaries

AI must respect user role.

An AI request from a Client must not expose Employee or Admin information.

---

# 66. INTERNAL KNOWLEDGE SYSTEM

Knowledge should be structured.

Each article may contain:

- Title
- Category
- Product
- Content
- Version
- Status
- Author
- Last updated
- Applicable role
- Approval status

Employees should primarily use approved knowledge.

---

# 67. CUSTOMER EDUCATION

Education may include:

- Market basics
- Stock basics
- Demat
- Trading
- Mutual Funds
- SIP
- IPO
- Insurance
- Loans
- Risk concepts
- Financial terminology

Education should be factual and appropriately risk-aware.

---

# 68. MARKETING CONTENT

Marketing content should not accidentally become personalized investment advice.

Avoid:

- "Buy this stock"
- "Guaranteed return"
- "Sure-shot stock"
- "Risk-free investment"
- "Guaranteed IPO listing gain"

Marketing should focus on:

- Services
- Education
- Convenience
- Market information
- Customer support
- Product access
- Financial-service workflows

---

# 69. CUSTOMER EXPERIENCE PRINCIPLE

The customer should always know:

WHERE AM I?

WHAT CAN I DO?

WHAT IS MY NEXT STEP?

WHAT IS PENDING?

WHO IS HELPING ME?

WHAT HAPPENS NEXT?

The application should reduce confusion.

---

# 70. EMPLOYEE EXPERIENCE PRINCIPLE

Employees should always know:

WHO DO I CONTACT?

WHAT DO I NEED TO DO TODAY?

WHAT IS OVERDUE?

WHAT PRODUCT IS INVOLVED?

WHAT DOCUMENT IS REQUIRED?

WHAT IS THE NEXT STEP?

WHAT DOES THE SOP SAY?

WHAT SHOULD I REPORT?

---

# 71. ADMIN EXPERIENCE PRINCIPLE

Admin should always know:

WHAT IS HAPPENING?

WHO IS RESPONSIBLE?

WHAT IS PENDING?

WHAT IS COMPLETED?

WHERE ARE THE LEADS?

WHERE ARE THE APPLICATIONS?

WHAT ARE EMPLOYEES DOING?

WHAT NEEDS ATTENTION?

---

# 72. CUSTOMER RETENTION PRINCIPLE

TWM must provide reasons to return without relying on spam.

Useful recurring reasons:

- Market overview
- Watchlists
- IPO updates
- SIP reminders
- Application status
- Insurance renewal
- Loan application status
- New education
- Important account notifications

---

# 73. MONETIZATION PHILOSOPHY

TWM should not assume that customers will pay simply for access to stock prices or basic market information.

The business value comes primarily from the financial-service ecosystem and legitimate revenue arrangements associated with the services TWM is permitted to facilitate.

Potential business areas:

- Trading/broker relationship
- Mutual fund services
- SIP
- IPO services
- Insurance
- Loans
- Other permitted financial services
- Education/courses where applicable

Any fees, commissions or revenue claims must reflect actual agreements.

Do not fabricate revenue numbers.

---

# 74. NO UNNECESSARY FEATURES

Do not build a feature simply because another financial app has it.

Every feature must answer:

1. Does it help the customer?
2. Does it help the employee?
3. Does it help Admin?
4. Does it support TWM's business?
5. Is it actually permitted?
6. Can it be implemented with real data?

If not, defer it.

---

# 75. FEATURES TO EXCLUDE FROM INITIAL PRODUCT

Unless explicitly reintroduced later:

- Paper trading
- Fake trading
- Fake AI signals
- Stock tips
- Personalized stock recommendations
- Guaranteed returns
- Fake portfolio data
- Fake approvals
- Fake market prices
- Fake broker execution
- Unnecessary social feed
- WhatsApp integration
- Crypto features
- Gambling-style trading features
- Unnecessary gamification

---

# 76. PRODUCT PRIORITY

Priority 1:

CORE PLATFORM

- Authentication
- Role system
- Client
- Employee
- Admin
- Database
- Security
- Navigation
- Design system

Priority 2:

CLIENT FINANCIAL EXPERIENCE

- Home
- Market
- Watchlist
- Trade/SMC
- Investment
- SIP
- IPO
- Insurance
- Loans
- Applications
- Documents
- Notifications

Priority 3:

EMPLOYEE OPERATING SYSTEM

- Dashboard
- CRM
- Leads
- Customers
- Tasks
- Follow-ups
- Product Knowledge
- AI Copilot
- Daily Reports

Priority 4:

ADMIN OPERATING SYSTEM

- Dashboard
- Users
- Employees
- CRM
- Products
- Applications
- Tasks
- Reports
- Permissions
- Audit

Priority 5:

INTEGRATIONS

Only when actual provider access/credentials are available.

---

# 77. PRODUCT STATES

Every integration/product should support states such as:

ACTIVE

AVAILABLE

CONFIGURATION REQUIRED

COMING LATER

UNAVAILABLE

But do not use "Coming Soon" everywhere.

If a feature is not part of the current product, remove it rather than displaying empty promises.

---

# 78. ERROR HANDLING

Errors should be understandable.

Bad:

"500 Internal Server Error"

Better:

"Market data is temporarily unavailable. Please try again."

Employee errors should explain the action needed.

Admin errors should include useful diagnostic information without exposing secrets.

---

# 79. EMPTY STATES

Empty states should be useful.

Example:

No watchlist:

"Your watchlist is empty."

CTA:

"Add a stock"

No applications:

"You don't have any active applications."

CTA:

"Explore services"

No tasks:

"You're all caught up."

Do not fill empty states with fake data.

---

# 80. PERFORMANCE

The application should feel fast.

Optimize:

- Initial load
- Navigation
- API calls
- Database queries
- Images
- Charts
- Lists
- Caching
- Lazy loading where appropriate

Avoid unnecessary re-renders.

Avoid loading large datasets when only a small subset is needed.

---

# 81. OFFLINE / POOR NETWORK EXPERIENCE

Where practical:

- Cache non-sensitive static content
- Show connection state
- Preserve safe form state
- Retry appropriate requests
- Do not duplicate financial transactions due to retry behavior

Never automatically repeat sensitive financial operations without idempotency safeguards.

---

# 82. ACCESSIBILITY

Support:

- Readable text
- Sufficient contrast
- Touch targets
- Screen-reader labels where applicable
- Keyboard navigation for web/admin
- Meaningful error messages

---

# 83. TESTING

Testing is required.

Test:

- Authentication
- Role routing
- Role permissions
- Client access
- Employee access
- Admin access
- CRM
- Tasks
- Applications
- Documents
- Notifications
- Forms
- API errors
- Empty states
- Integration-required states
- Responsive UI

Do not claim a feature works unless tested.

---

# 84. E2E TESTING

Critical E2E journeys:

CLIENT:

Login
→ Home
→ Markets
→ Search stock
→ Watchlist
→ Trade/SMC CTA
→ Investment
→ SIP
→ IPO
→ Insurance
→ Loan
→ Applications
→ Documents
→ Support

EMPLOYEE:

Login
→ Dashboard
→ Lead
→ Customer
→ Follow-up
→ Task
→ Product Knowledge
→ AI Copilot
→ Daily Report

ADMIN:

Login
→ Dashboard
→ User
→ Employee
→ CRM
→ Product
→ Application
→ Task
→ Reports
→ Permissions
→ Audit

---

# 85. BUILD QUALITY

The application must not be a visual prototype disguised as a product.

Avoid:

- Dead buttons
- Fake data
- Fake APIs
- Fake integrations
- Placeholder pages
- Duplicate screens
- Unused components
- Broken navigation
- Inconsistent terminology
- Inconsistent design

---

# 86. TERMINOLOGY

Use:

Tradosphere Wealth Management

TWM

SMC Global

SMC Ace

Authorised Person

Client

Employee

Admin

Customer

Lead

Application

Product

Service

Market Information

Investment

Insurance

Loan

Do not casually use terminology that creates a different legal/business meaning.

Exact regulatory/legal wording must be confirmed against the actual business documentation before production launch.

---

# 87. BRAND EXPERIENCE

The TWM brand should communicate:

TRUST

CLARITY

PROFESSIONALISM

ACCESSIBILITY

FINANCIAL SERVICES

MODERN TECHNOLOGY

The app should feel premium without looking extravagant.

---

# 88. THE CORE CUSTOMER STORY

A customer discovers TWM.

They can:

1. Understand the market
2. Learn financial concepts
3. Open/access trading through SMC
4. Explore investments
5. Explore SIP
6. Explore IPO
7. Get insurance assistance
8. Get loan assistance
9. Track applications
10. Store/access documents
11. Receive useful notifications
12. Contact TWM

The customer should feel that TWM is their central financial-services relationship.

---

# 89. THE CORE EMPLOYEE STORY

An employee logs in.

They immediately know:

1. What tasks are due
2. Which leads need attention
3. Which customers need follow-up
4. Which applications are pending
5. What product information they need
6. What SOP applies
7. What they accomplished today
8. What needs to be reported

TWM becomes the employee's daily operating system.

---

# 90. THE CORE ADMIN STORY

Admin logs in.

Admin immediately knows:

1. What is happening
2. How many leads exist
3. Where applications are
4. Which employees are active
5. What tasks are overdue
6. What products are generating activity
7. Which customers require attention
8. What needs operational action

TWM becomes the business operating system.

---

# 91. FINAL PRODUCT ARCHITECTURE

The high-level system is:

                         TWM
                          |
          +---------------+---------------+
          |               |               |
       CLIENT          EMPLOYEE         ADMIN
          |               |               |
     Financial        CRM + Tasks     Business
     Services        + Knowledge      Control
          |               |               |
          +---------------+---------------+
                          |
                    CORE PLATFORM
                          |
        +-----------------+-----------------+
        |                 |                 |
     DATABASE         AUTH/RBAC         SERVICES
        |                 |                 |
        +-----------------+-----------------+
                          |
                    INTEGRATIONS
                          |
       +------------------+------------------+
       |                  |                  |
    SMC Global        Market Data        Other
    / SMC Ace         Providers         Providers

---

# 92. NON-NEGOTIABLE RULES

1. Do not build paper trading.

2. Do not build fake trading.

3. Do not fabricate market data.

4. Do not fabricate broker integration.

5. Do not fabricate loan approvals.

6. Do not fabricate insurance policies.

7. Do not fabricate investment holdings.

8. Do not build TWM stock tips.

9. Do not build personalized investment advice.

10. Do not build AI trading signals.

11. Do not allow frontend-only authorization.

12. Do not hardcode credentials.

13. Do not expose sensitive customer data.

14. Do not create dead buttons.

15. Do not create meaningless pages.

16. Do not create unnecessary duplicate functionality already handled by SMC Ace.

17. Do not treat the Employee Panel as a simple admin page.

18. Do not treat the Admin Panel as an extended Employee Panel.

19. Do not sacrifice functionality for visual appearance.

20. Do not sacrifice UX for feature count.

21. Do not sacrifice security for convenience.

22. Do not claim functionality that has not been tested.

---

# 93. DEFINITION OF A SUCCESSFUL TWM PRODUCT

TWM is successful when:

CLIENT:

"I can understand the market, access financial services, manage my applications and stay connected with TWM."

EMPLOYEE:

"I know exactly what I need to do today, how to manage my customers and where to find the correct product information."

ADMIN:

"I can see and control the business operations from one place."

BUSINESS:

"TWM creates one connected ecosystem around customers, employees, products and services."

---

# 94. FINAL PRODUCT STATEMENT

TWM is not:

"another trading app."

TWM is not:

"an AI stock-tip app."

TWM is not:

"a paper-trading app."

TWM is not:

"a generic CRM."

TWM is:

> A unified financial-services and business-management platform connecting customers, employees and management, with market information, investment services, SMC trading access, insurance, loans, CRM, employee operations and business administration in one ecosystem.

---

# 95. BUILD PRINCIPLE

BUILD THE PRODUCT, NOT A DEMO.

Every screen must have a purpose.

Every action must have a workflow.

Every workflow must have a real state.

Every role must have correct permissions.

Every integration must have a real integration boundary.

Every financial data point must have a legitimate source.

Every AI capability must respect its role and business boundaries.

Every important user journey must be testable.

The final product must feel like a real TWM platform.

END OF MASTER REFERENCE.
