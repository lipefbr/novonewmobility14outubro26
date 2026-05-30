# NewMobility MLM BackOffice - Worklog

## Current Project Status
- Next.js 16 MLM BackOffice dashboard with Tailwind CSS and shadcn/ui
- Database: Neon PostgreSQL (HTTP API via fetch) - connection working
- Dev server: Has memory constraints in sandbox, works with Turbopack + 2048MB heap
- All API routes migrated from Prisma ORM to lightweight Neon HTTP SQL client
- Both demo user and admin user login verified working

## Key Credentials
- **Demo User**: carlos.silva@email.com / 123456
- **Admin User**: admin@newmobility.com / 123456

## Completed Work

### Database Migration (SQLite → Neon PostgreSQL)
- Migrated from Prisma ORM to lightweight Neon HTTP SQL client (pure fetch)
- Connection uses HTTPS (not TCP) so works from sandboxed environments
- API URL: https://api.c-8.us-east-1.aws.neon.tech/sql
- Proper type conversion for boolean and integer fields from PostgreSQL
- All 30+ API routes rewritten to use new db module

### API Routes Status
- Auth (login, register, forgot-password, reset-password) - ✅ Working
- Admin (stats, users, config, announcements) - ✅ Migrated
- Dashboard - ✅ Migrated
- Financial (balances, transactions, withdraw, transfer, export, withdrawals) - ✅ Migrated
- User (profile, password, language, 2fa, verify-email, verify-phone) - ✅ Migrated
- Cashback (entrada, residual, vendas) - ✅ Migrated
- Career, Gratifications, Points - ✅ Migrated
- Referrals (list, tree, export) - ✅ Migrated
- Support (tickets, reply) - ✅ Migrated
- Plans (list, upgrade, calculate-upgrade) - ✅ Migrated
- Vouchers, Invoices - ✅ Migrated
- Marketplace (products, orders) - ✅ Migrated
- Gamification, Leaderboard, Events - ✅ Migrated
- Notifications, Announcements, Reports - ✅ Migrated
- Simulator, Seed - ✅ Migrated

### Sidebar
- Already has fixed positioning (`fixed top-0 left-0 bottom-0`)
- Already has scrollable navigation (`overflow-y-auto sidebar-scrollbar`)
- Marketplace tab already added with `isNew: true` badge

### Voucher Buy Button
- Currently navigates to marketplace page with toast notification
- Functional but could be enhanced with direct purchase flow

## Known Issues & Risks
1. **Dev server memory**: Server crashes due to memory constraints when compiling multiple routes. Works for single API calls but preview panel's concurrent requests cause OOM.
2. **Register page**: Affiliate link registration works, username field should be locked when coming from referral link
3. **Infinite loading on login**: The "Cadastre-se" and admin demo buttons should work now that the API is functional
4. **Data type handling**: Some fields from Neon HTTP API may need additional type conversion

## Priority Next Steps
1. Fix dev server stability (consider production build or periodic restarts)
2. Test full login → dashboard → profile flow in browser
3. Verify registration with affiliate link works end-to-end
4. Add admin CRUD operations (edit users, add plans)
5. Test marketplace purchase flow
6. Enhance voucher buy button with actual purchase dialog

## Technical Architecture
```
Frontend: React (Next.js 16) + Zustand + Framer Motion + shadcn/ui
Backend: Next.js API Routes → Neon PostgreSQL via HTTP SQL API
Database: Neon PostgreSQL (serverless, HTTPS-based)
Auth: Simple email/password with SHA256 hashing
```
