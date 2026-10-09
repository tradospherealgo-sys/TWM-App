# Database / Supabase Team

Audit:
- Supabase connection
- Prisma/schema alignment if present
- migrations
- relations/indexes/constraints
- RLS
- roles/permissions
- demo/seed data
- production vs development data
- timestamps/audit fields
- duplicates/orphans

Never drop/reset production tables or expose service-role credentials.

For important tables map Public / Client / Employee / Admin / Server-only access and verify server-side enforcement.
