# Tradosphere Complete Audit Orchestrator

Audit first. Detect problems, show evidence, recommend fixes, then STOP for approval.

## Rules
- Do not rebuild working functionality.
- No fake buttons, fake market data, fake charts, or fake success states.
- No destructive DB changes.
- Never invent credentials, URLs, financial claims, referral codes, or data.
- Preserve production data.
- Use existing architecture unless a real problem justifies change.
- Every fix must be tested.

## Audit Output
Return:
- Executive verdict: READY / NOT READY / READY WITH MINOR FIXES
- Worth-it verdict: WORTH POLISHING / SCOPE CUT / PRODUCT PIVOT / NOT WORTH CONTINUING
- Critical, high, medium, minor issues
- Remove/deprecate candidates
- Missing inputs
- Exact affected files/components
- Ordered execution plan
- What should NOT be changed

For every issue:
`ID | Severity | Area | Evidence | User impact | Recommendation | Risk | Verification`

## Execution Gate
Do not modify code during audit.

After explicit approval:
1. Record git status, branch, commit and baseline tests.
2. Fix one logical batch at a time.
3. Test after each batch.
4. Report changed files and verification.
5. Continue only within approved scope.

A production platform is not "done" merely because it builds.
