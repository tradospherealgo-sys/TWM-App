# Approved Execution Protocol

## Before
Record git status, branch, commit and baseline tests.

## Order
1. Security/data
2. Broken core functionality
3. Live market-data/integrations
4. Signal pipeline
5. Auth/roles
6. Client UX
7. Branding/logo
8. Dead buttons/features
9. Performance
10. Cosmetic polish

## After Each Batch
Run targeted tests, relevant integration tests and build when appropriate. Report changed files and evidence.

## Final Regression
Typecheck, lint, build, critical routes, auth/roles, DB, market data, signals, client flow, SMC CTA, branding.

Never force-push, reset production DB, invent credentials/URLs/data, or silently remove major functionality.
