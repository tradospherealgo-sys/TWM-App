# Role-Based Access Control (RBAC) Specification

## 1. Principles

1. **Server-Side Enforcement**: All permissions and route guards are evaluated server-side. Modifying `localStorage`, cookies, URL parameters, or frontend state cannot grant unauthorized access.
2. **Edge Middleware Guard**: Incoming requests are validated in Next.js `middleware.ts` before reaching any route handler or page component.
3. **Least Privilege**: Users only access the data models and operations appropriate for their role.
4. **Self-Lockout Prevention**: Administrators cannot demote themselves to avoid accidental system lockout.

---

## 2. Roles & Permissions Matrix

| Resource / Capability | CLIENT | EMPLOYEE | ADMIN |
| :--- | :---: | :---: | :---: |
| View Markets & Equities Directory | ✅ | ✅ | ✅ |
| Manage Personal Watchlists | ✅ | ✅ | ✅ |
| Submit Financial Applications | ✅ | ❌ | ❌ |
| View Personal Applications | ✅ | ❌ | ❌ |
| View Assigned Leads & CRM Pipeline | ❌ | ✅ | ✅ |
| Create / Update Leads | ❌ | ✅ | ✅ |
| Manage Daily Tasks & Follow-ups | ❌ | ✅ | ✅ |
| Review / Transition Applications | ❌ | ✅ | ✅ |
| Access Internal SOPs | ❌ | ✅ | ✅ |
| Use AI Employee Copilot | ❌ | ✅ | ✅ |
| Submit Daily Operational Report | ❌ | ✅ | ❌ |
| View All Employees & Workload | ❌ | ❌ | ✅ |
| Modify User Roles & Status | ❌ | ❌ | ✅ |
| Modify Product Catalog & Requirements | ❌ | ❌ | ✅ |
| View Security & Activity Audit Logs | ❌ | ❌ | ✅ |
| View Integration Connectivity Status | ❌ | ❌ | ✅ |

---

## 3. Session Implementation

- **Token Type**: Signed JSON Web Token (JWT) using `HS256` with 256-bit secret.
- **Storage**: Stored in a secure `HttpOnly`, `SameSite=Lax` cookie named `twm_session`.
- **Expiration**: 7 days.
- **Payload**:
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
