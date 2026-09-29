# Role-Based Access Control (RBAC) Specification

## 1. Core Principles

1. **Server-Side Enforcement**: All permissions and authorization barriers are evaluated on the server. Modifying client state, local storage, browser cookies, or query parameters cannot grant unauthorized access.
2. **Edge Middleware Guard**: Incoming requests are validated in Next.js `middleware.ts` before reaching any route handler, server component, or API endpoint.
3. **Principle of Least Privilege**: Users only access the data models and operations appropriate for their verified role.
4. **Self-Lockout Prevention**: System administrators cannot demote or suspend their own accounts, ensuring the platform always maintains active administrative governance.
5. **Secure Document Streaming**: Direct filesystem/object access to customer KYC documents is prohibited; all files are streamed through role-authorized endpoints.

---

## 2. Roles & Permissions Matrix

| Functional Capability | Client | Employee | Admin | Route / Endpoint |
| :--- | :---: | :---: | :---: | :--- |
| **Equities & Directory Browsing** | ✅ | ✅ | ✅ | `/markets`, `/api/equities` |
| **Personal Watchlists** | ✅ | ✅ | ✅ | `/account`, `/api/watchlists` |
| **Submit Service Applications** | ✅ | ❌ | ❌ | `/invest`, `/api/applications` |
| **View Own Applications** | ✅ | ❌ | ❌ | `/applications`, `/api/applications` |
| **Upload KYC Documents** | ✅ | ❌ | ❌ | `/documents`, `/api/documents` |
| **Download Own Documents** | ✅ | ❌ | ❌ | `/api/documents/download?id=...` |
| **Create Support Tickets** | ✅ | ❌ | ❌ | `/support`, `/api/support/tickets` |
| **View Own Support Tickets** | ✅ | ❌ | ❌ | `/support`, `/api/support/tickets` |
| **Manage CRM Leads & Pipeline** | ❌ | ✅ | ✅ | `/employee/leads`, `/api/crm/leads` |
| **Manage Daily Tasks & Follow-ups** | ❌ | ✅ | ✅ | `/employee/tasks`, `/api/crm/tasks` |
| **Review & Verify Applications** | ❌ | ✅ | ✅ | `/employee/applications`, `/api/applications/[id]` |
| **Verify KYC Documents** | ❌ | ✅ | ✅ | `/api/documents/[id]/verify` |
| **Download Client Documents (Assigned)** | ❌ | ✅ | ✅ | `/api/documents/download?id=...` |
| **Triage & Resolve Support Tickets** | ❌ | ✅ | ✅ | `/employee/support`, `/api/support/tickets/[id]` |
| **Access Internal SOP Knowledge Base**| ❌ | ✅ | ✅ | `/employee/knowledge`, `/api/knowledge` |
| **Use AI Employee Copilot** | ❌ | ✅ | ✅ | `/employee/copilot`, `/api/copilot` |
| **Submit Daily Operational Report** | ❌ | ✅ | ❌ | `/employee/report`, `/api/employee/daily-report` |
| **View Organization Staff & Workload**| ❌ | ❌ | ✅ | `/admin/users`, `/api/admin/users` |
| **Modify User Roles & Statuses** | ❌ | ❌ | ✅ | `/admin/users`, `/api/admin/users/[id]` |
| **Manage Product Catalog & Checklists**| ❌ | ❌ | ✅ | `/admin/products`, `/api/admin/products` |
| **Inspect Tamper-Evident Audit Logs** | ❌ | ❌ | ✅ | `/admin/audit-logs`, `/api/admin/audit-logs` |
| **Manage Integrations Vault (AES-256)**| ❌ | ❌ | ✅ | `/admin/integrations`, `/api/admin/integrations` |
| **Execute Provider Connection Tests** | ❌ | ❌ | ✅ | `/api/admin/integrations/[key]/test` |
| **Rotate Integration Credentials** | ❌ | ❌ | ✅ | `/api/admin/integrations/[key]/rotate` |
| **Inspect System Health & Launch Gate**| ❌ | ❌ | ✅ | `/admin/system-health`, `/api/admin/system-health` |
| **Browse Signals Teasers & Directory** | ✅ | ✅ | ✅ | `/signals`, `/api/signals` |
| **Read Full Signal & 6-Agent AI Reviews**| ✅ (Subscribed)| ✅ (Staff View)| ✅ | `/signals/[id]`, `/api/signals/[id]` |
| **Manage Signals Subscription** | ✅ | ❌ | ❌ | `/signals`, `/api/signals/subscription` |
| **Create Signals Drafts** | ❌ | ❌ | ✅ | `/admin/signals/create`, `/api/signals` |
| **Run 6-Agent AI Review Pipeline** | ❌ | ❌ | ✅ | `/admin/signals/[id]`, `/api/signals/[id]/ai-review` |
| **Human Review / Decision (Approve/Reject)**| ❌ | ❌ | ✅ | `/admin/signals/[id]`, `/api/signals/[id]/decision` |
| **Publish Signals (Broadcast to Clients)**| ❌ | ❌ | ✅ | `/admin/signals/[id]`, `/api/signals/[id]/publish` |
| **Close / Expire Active Signals** | ❌ | ❌ | ✅ | `/admin/signals/[id]`, `/api/signals/[id]/close` |
| **Configure Signals Pricing & Settings**| ❌ | ❌ | ✅ | `/admin/signals/settings`, `/api/admin/signals/settings` |
| **Staff Research Desk (Read-Only)** | ❌ | ✅ | ✅ | `/employee/signals`, `/api/signals` |

---

## 3. Session & Token Specifications

- **Token Type**: Signed JSON Web Token (JWT) using `HS256` algorithm.
- **Signing Key**: Sourced from `JWT_SECRET` (minimum 32-character high-entropy secret).
- **Transport**: Stored in a secure `HttpOnly`, `SameSite=Lax`, `Path=/` cookie named `twm_session`.
- **Expiration**: 7 days (604,800 seconds).
- **Session Payload**:
  ```typescript
  interface SessionPayload {
    userId: string;
    email: string;
    role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN';
    name: string;
    employeeId?: string;
    customerId?: string;
  }
  ```

---

## 4. Edge Middleware Enforcement (`src/middleware.ts`)

The Next.js Edge Middleware executes on every incoming HTTP request:

1. **Public Routes**: Bypassed for `/login`, `/register`, `/api/auth/*`, and static assets (`/_next/*`, `/favicon.ico`).
2. **Unauthenticated Access**: Requests to protected routes without a valid `twm_session` cookie are redirected to `/login?from=<path>` (or return `401 Unauthorized` for API routes).
3. **Route Guard Rules**:
   - `/admin/*` and `/api/admin/*`: Requires `role === 'ADMIN'`. Non-admins receive `403 Forbidden` (or redirect).
   - `/employee/*` and `/api/crm/*`: Requires `role === 'EMPLOYEE' || role === 'ADMIN'`. Clients receive `403 Forbidden`.
   - Client routes (`/home`, `/markets`, `/invest`, `/protect`, `/borrow`, `/account`, `/documents`, `/support`): Open to authenticated users.

---

## 5. KYC Document Stream Security (`/api/documents/download`)

Direct web server file hosting of uploaded KYC assets is strictly disabled. All file access requests are routed through `/api/documents/download?id=<cuid>`:

1. Validates authenticated user session.
2. Fetches the document record from the database.
3. Enforces authorization check:
   - `ADMIN`: Authorized to view all documents.
   - `EMPLOYEE`: Authorized if assigned to the client or the client's application.
   - `CLIENT`: Authorized strictly if `document.customerId === user.customerId`.
4. Streams the binary buffer with proper `Content-Type` and `Content-Disposition: inline` headers.
