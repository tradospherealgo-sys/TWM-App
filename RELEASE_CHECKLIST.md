# TRADOSPHERE WEALTH MANAGEMENT — RELEASE CHECKLIST & DEPLOYMENT RUNBOOK
**Target Release:** Production Hardening & Regulatory Integrity Milestone  
**Repository Working Directory:** `D:\Tradosphere-Final`  
**Git Branch:** `production-client-readiness`  
**Target Deployment:** Vercel (`twm-app-kappa.vercel.app`) & Marketing Domain (`tradospherewealthmanagement.co.in`)  
**Date:** October 12, 2026  

---

## 1. PRE-RELEASE ENVIRONMENT REQUIREMENTS

Before promoting the release branch to production, ensure the following environment variables are properly set in the Vercel Production Environment Settings:

| Environment Variable | Status | Purpose / Requirement |
| :--- | :--- | :--- |
| `DATABASE_URL` | Mandatory | Production PostgreSQL database connection pool string (Supabase/AWS RDS) |
| `DIRECT_URL` | Mandatory | Direct database connection string for Prisma migrations |
| `NEXTAUTH_SECRET` / `JWT_SECRET` | Mandatory | Minimum 256-bit cryptographically secure random string |
| `INTEGRATION_ENCRYPTION_KEY` | Mandatory | 32-byte hex key for AES-256-GCM secret vault encryption |
| `SMC_GLOBAL_AP_CODE` | Optional | Authorised Person code for SMC Global partnership |
| `UPSTOX_ACCESS_TOKEN` | Optional | Upstox v2 API live market data token (when available) |
| `STORAGE_DRIVER` | Mandatory | Set to `supabase` or `local` depending on vault configuration |

---

## 2. PRE-DEPLOYMENT VERIFICATION GATE

Execute and verify all gates locally prior to merging or triggering deployment:

- [x] **Vitest Automated Test Suite:**
  ```bash
  npm run test
  ```
  *Required Result:* 15/15 test files pass, 205/205 tests pass.
- [x] **TypeScript Type Check:**
  ```bash
  npm run typecheck
  ```
  *Required Result:* Exit code 0, 0 errors.
- [x] **ESLint Linting Pass:**
  ```bash
  npm run lint
  ```
  *Required Result:* Exit code 0, 0 warnings/errors.
- [x] **Next.js Production Build:**
  ```bash
  npm run build
  ```
  *Required Result:* Exit code 0, 76 routes successfully compiled.
- [x] **Prisma Schema Consistency:**
  ```bash
  npx prisma generate
  ```
  *Required Result:* Prisma client matches current schema.

---

## 3. DEPLOYMENT EXECUTION RUNBOOK

### Step 1: Git Branch Commit & Review
1. Inspect the working directory status:
   ```bash
   git status
   git diff
   ```
2. Ensure no secrets, keys, or unintended scratch files are staged.
3. Commit the verified hardening changes:
   ```bash
   git add src/ public/_redirects FINAL_DELIVERY_REPORT.md SECURITY_AND_AUTHORIZATION_RESULTS.md RELEASE_CHECKLIST.md
   git commit -m "fix(security): fail-secure auth, rbac horizontal isolation, financial truthfulness, and calculator math"
   ```

### Step 2: Push to GitHub & Pull Request
1. Push branch to remote repository:
   ```bash
   git push origin production-client-readiness
   ```
2. Open Pull Request into `main` branch.
3. Verify Vercel preview deployment builds successfully.

### Step 3: Production Promotion on Vercel
1. Merge PR to `main` or trigger production deployment via Vercel CLI / Dashboard.
2. Monitor build logs in Vercel console for successful compilation of all 76 routes.

### Step 4: Marketing Website SPA Fallback Deployment
If `https://www.tradospherewealthmanagement.co.in/` is hosted on Cloudflare Pages or Netlify:
- Ensure `public/_redirects` is deployed to the root of the marketing deployment.
If hosted on Apache/Nginx:
- **Apache (`.htaccess`):**
  ```apache
  <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
  </IfModule>
  ```
- **Nginx:**
  ```nginx
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```

---

## 4. POST-DEPLOYMENT VERIFICATION (SANITY CHECKS)

Immediately following production deployment, perform the following verification steps on `https://twm-app-kappa.vercel.app/`:

1. **Public Marketing & Login:**
   - [ ] Navigate to `/login` — verify form renders without errors.
   - [ ] Verify password recovery copy displays: *"Contact operations at admin@tradosphere.in"*.
   - [ ] Verify session expired alert is displayed if `?reason=session_expired` is passed.
2. **Consultation / Lead Generation:**
   - [ ] Navigate to Consultation tab on `/login`.
   - [ ] Submit a test enquiry — verify response is `{ success: true, lead: { id, name } }`.
   - [ ] Submit 6 consecutive requests in under 1 minute — verify HTTP 429 Rate Limited.
3. **Client Dashboard Truthfulness:**
   - [ ] Log in with an authorized client account without linked Demat.
   - [ ] Verify portfolio shows `₹ 0` and `Not Linked` (no fabricated ₹12,48,320 balance).
   - [ ] Verify KYC badge shows `PENDING` if unverified (never defaults to `VERIFIED`).
4. **Markets Feed Status:**
   - [ ] Navigate to `/markets`.
   - [ ] Verify index cards display `Awaiting Live Feed` and `--` (no static fake quotes).
5. **SIP Calculator Accuracy:**
   - [ ] Navigate to `/invest?tab=sip`.
   - [ ] Set expected rate to 0% — verify future value equals total invested with ₹0 gain (no `NaN`).
   - [ ] Set standard parameters (₹5,000 / 10 years / 12%) — verify calculations match standard compound formula.
6. **Security Headers Verification:**
   - [ ] Execute `curl -I https://twm-app-kappa.vercel.app/`
   - [ ] Confirm presence of `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.

---

## 5. ROLLBACK STRATEGY & DISASTER RECOVERY

If any critical operational anomaly is detected post-deployment:

1. **Instant Vercel Rollback:**
   - Navigate to **Vercel Dashboard → Deployments**.
   - Select the previous stable production deployment.
   - Click **Instant Rollback**. Vercel will restore previous routing within 5 seconds without redeploying.
2. **Database Backward Compatibility:**
   - No destructive database migrations or breaking schema modifications were introduced in this hardening sprint. The existing schema remains 100% backward-compatible.
3. **Client Communication:**
   - In case of unexpected downtime, notify operations desk at `admin@tradosphere.in`.

---

*Prepared by Release Engineering Team.*
