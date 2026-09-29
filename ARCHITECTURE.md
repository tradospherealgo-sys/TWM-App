# TWM System Architecture

## Overview

Tradosphere Wealth Management (TWM) is built on Next.js 14 (App Router) with TypeScript, Prisma ORM, Tailwind CSS, and edge-compatible security primitives.

```
                          TWM SYSTEM
                              |
       +----------------------+----------------------+
       |                      |                      |
  CLIENT PANEL          EMPLOYEE OS            ADMIN CONTROL
  (Android-First)     (CRM & Tasks)          (Platform Admin)
  /home, /markets,    /employee, /leads,     /admin, /users,
  /invest, /protect   /tasks, /copilot       /crm, /audit-logs
       |                      |                      |
       +----------------------+----------------------+
                              |
                     NEXT.JS APP ROUTER
                     + EDGE MIDDLEWARE
                     (RBAC & Protected Routes)
                              |
                     APPLICATION / API LAYER
                     (/api/auth, /api/applications,
                      /api/crm, /api/copilot, /api/admin)
                              |
                     PRISMA DATA LAYER
                     (Relational SQLite / PostgreSQL)
                              |
                     INTEGRATION ADAPTERS
       +----------------------+----------------------+
       |                      |                      |
  SMC Global AP         Market Data Feed       AI Copilot
  Adapter (SMC Ace)     Feed Adapter (NSE)     (Approved SOPs)
```

---

## 📱 Client Panel (Android-First UI/UX)

The Client Panel is designed specifically for modern mobile screens with touch-first controls:
- **Sticky App Bar**: Brand mark, SMC Authorised Person badge, notification icon with live unread indicator, user badge.
- **Sticky Bottom Navigation**: 6 key tabs (`Home`, `Markets`, `Invest`, `Protect`, `Borrow`, `Account`) with Android safe area padding (`pb-safe`).
- **Touch Targets**: Minimum 44px hit areas on all buttons and inputs.
- **Design Tokens**: Slate (`#0B111E`, `#131C2E`), Royal Blue (`#2563EB`), Emerald Gain (`#10B981`), Amber (`#D97706`).

---

## 💼 Employee Operating System

A dedicated workplace dashboard for Relationship Managers and Wealth Executives:
- **Lead Pipeline**: 8-stage funnel (`NEW_LEAD`, `CONTACTED`, `INTERESTED`, `FOLLOW_UP`, `DOCUMENTS_REQUIRED`, `APPLICATION`, `COMPLETED`, `LOST_CLOSED`).
- **Daily Tasks**: Priority-sorted (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) with due date warnings and single-click completion.
- **Follow-up Logger**: Logs call outcomes and auto-schedules next-step tasks.
- **Approved SOPs & Knowledge**: Instant access to verified procedures for KYC, Demat, and LAS.
- **AI Employee Copilot**: Role-scoped AI assistant with strict compliance filters.
- **Daily Report**: Persisted operational reporting on calls, contacts, and conversions.

---

## 🛡️ Admin Business Control Center

The executive operating console:
- **User Management**: Modify roles (`CLIENT`, `EMPLOYEE`, `ADMIN`) with self-lockout safeguards.
- **Staff Workload**: Monitor assigned leads and tasks per employee.
- **CRM Enterprise Pipeline**: Aggregate lead pipeline distribution.
- **Catalog Management**: Toggle financial services and document checklists.
- **Tamper-Evident Audit Logs**: Comprehensive tracking of all authentication, role changes, and application transitions.
