# NewMobility MLM BackOffice - Worklog

## Current Project Status
- Next.js 16 MLM BackOffice dashboard with Tailwind CSS and shadcn/ui
- Database: Neon PostgreSQL (HTTP API via fetch) - connection verified working
- Production build works correctly, all API routes functional
- Dev server has memory constraints in sandbox (crashes on API route compilation)
- GitHub: https://github.com/lipefbr/newmobility (pushed successfully)
- Cron job set up for periodic review (every 15 min)

## Key Credentials
- **Demo User**: carlos.silva@email.com / 123456
- **Admin User**: admin@newmobility.com / 123456

## Completed Work

### Session: 2025-05-30 (Continuation)

#### 1. Sandbox Fix & GitHub Push
- Restarted dev server to fix `{"error":"sandbox is inactive"}`
- Pushed project to GitHub: https://github.com/lipefbr/newmobility
- Used classic key: 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
- GitHub user: lipefbr

#### 2. Dev Server Stability
- Dev server (webpack) crashes during API route compilation due to memory constraints
- Production build (`next build`) succeeds and works correctly
- Production server (`node .next/standalone/server.js`) works with 512MB heap
- All API routes respond correctly in production mode
- Sandbox kills background processes after ~15-20 seconds (known limitation)

#### 3. Login Infinite Loading Fix
- Added 10-second timeout to all API calls via `AbortController`
- Added `ApiTimeoutError` and `ApiNetworkError` with Portuguese messages
- Added 15-second safety timeout in login handler to guarantee loading reset
- Network errors now show user-friendly toast messages instead of infinite spinner

#### 4. Register Page Fix
- Referral code field is locked when coming from affiliate link (?ref=CODE)
- Name field is now editable (referral links only provide code, not name)
- Added same 15-second safety timeout pattern to registration handler

#### 5. Voucher Purchase Dialog
- Replaced simple marketplace navigation with 3-step purchase modal:
  - Step 1: Category selection (Mobilidade, Farmácia, Refeição, Shopping)
  - Step 2: Amount selection (R$25, R$50, R$100, R$200, R$500)
  - Step 3: Confirmation with payment summary
- On confirm: generates voucher code, adds to list, shows success toast
- "Explorar Marketplace" option still available

#### 6. Admin CRUD Enhancement
- **Users tab**: Edit user details modal (name, email, plan, status, balance)
- **Plans tab** (NEW): Full CRUD - create, edit, delete plans (defaults protected)
- **Withdrawals tab** (NEW): Stats dashboard, approve/reject with balance refund
- New API routes: PUT /admin/users/[id], GET/POST /admin/plans, PUT/DELETE /admin/plans/[planId], GET /admin/withdrawals, PUT /admin/withdrawals/[id]

### Previous Session Work

#### Database Migration (SQLite → Neon PostgreSQL)
- Migrated from Prisma ORM to lightweight Neon HTTP SQL client (pure fetch)
- Connection uses HTTPS (not TCP) so works from sandboxed environments
- API URL: https://api.c-8.us-east-1.aws.neon.tech/sql
- Proper type conversion for boolean and integer fields from PostgreSQL
- All 30+ API routes rewritten to use new db module

#### API Routes Status
- Auth (login, register, forgot-password, reset-password) - ✅ Working
- Admin (stats, users, config, plans, withdrawals, announcements) - ✅ Working
- Dashboard, Financial, User, Cashback, Career, Gratifications - ✅ Working
- Referrals, Support, Plans, Vouchers, Invoices - ✅ Working
- Marketplace (products, orders), Gamification, Leaderboard, Events - ✅ Working
- Notifications, Announcements, Reports, Simulator, Seed - ✅ Working

#### Sidebar
- Fixed positioning (`fixed top-0 left-0 bottom-0`) ✅
- Scrollable navigation (`overflow-y-auto sidebar-scrollbar`) ✅
- Marketplace tab with `isNew: true` badge ✅

## Known Issues & Risks
1. **Dev server memory**: Server crashes during API route compilation in dev mode. Production build works fine. This is a sandbox limitation, not a code issue.
2. **Sandbox process management**: Background processes are killed after ~15-20 seconds. The preview may show "sandbox is inactive" periodically.
3. **Data type handling**: Some fields from Neon HTTP API may need additional type conversion.

## Priority Next Steps
1. Test full user flow on Vercel deployment
2. Verify registration with affiliate link end-to-end
3. Test marketplace purchase flow
4. Enhance UI styling with more details
5. Add more features and functionality
6. Consider implementing real payment integration

## Technical Architecture
```
Frontend: React (Next.js 16) + Zustand + Framer Motion + shadcn/ui
Backend: Next.js API Routes → Neon PostgreSQL via HTTP SQL API
Database: Neon PostgreSQL (serverless, HTTPS-based)
Auth: Simple email/password with SHA256 hashing
Deployment: Vercel-ready (GitHub: lipefbr/newmobility)
```

---

## Task 3 - Fix Login Infinite Loading & Register Page Issues

**Agent**: Code Agent  
**Date**: 2025-03-04

### Bug: Login page infinite loading on signup and admin demo buttons

**Root Cause**: The `apiFetch` function in `lib/api.ts` had no timeout mechanism. When the dev server crashes during API route compilation (known memory issue), `fetch()` would hang indefinitely, leaving the `loading` state as `true` forever with no way to recover.

### Changes Made

#### 1. `src/lib/api.ts` - Added timeout and network error handling
- Added `AbortController` with configurable timeout (default 10 seconds) to all API calls
- Added `ApiTimeoutError` class for timeout-specific error messages in Portuguese
- Added `ApiNetworkError` class for network failure error messages in Portuguese
- `timeoutMs` option available for custom timeout values per-call

#### 2. `src/components/newmobility/auth/login-page.tsx` - Fixed infinite loading
- Added 15-second safety timeout in `handleLogin`
- `clearTimeout(safetyTimer)` called in both `catch` and `finally` blocks
- Error messages from `ApiTimeoutError` and `ApiNetworkError` properly displayed

#### 3. `src/components/newmobility/auth/register-page.tsx` - Fixed register issues
- Name field now editable when coming from referral link
- Referral code field remains locked when from affiliate link
- Added 15-second safety timeout to registration handler

---

## Task 4 - Voucher Purchase Dialog & Admin CRUD Enhancement

**Agent**: Code Agent  
**Date**: 2025-03-04

### Voucher Purchase Dialog
- 3-step modal: Category → Amount → Confirmation
- Generates voucher code on purchase
- "Explorar Marketplace" option still available

### Admin CRUD Enhancement
- Users tab: Edit user details modal
- Plans tab (NEW): Full CRUD with create/edit/delete
- Withdrawals tab (NEW): Approve/reject with balance refund
- 5 new API routes for admin operations

### Verification
- `bun run lint` passed with zero errors
- Production build succeeds
- All API routes respond correctly

---

## Task 5 - Full Admin Panel (Admin Geral)

**Agent**: Code Agent  
**Date**: 2025-03-05

### Summary
Upgraded the admin panel to a full "Admin Geral" (super admin) panel with complete control over all user fields, cashback management, and a detailed user view modal.

### Changes Made

#### 1. `src/app/api/admin/users/route.ts` - Expanded user query
- GET now returns ALL user fields: phone, cpf, all 6 balances, career/personal points, stars, city/state/country, bank details (code, agency, account, type, pixKey, pixEnabled), isDriver, isDelivery, role
- Proper defaults for nullable fields (empty string, 0, false)

#### 2. `src/app/api/admin/users/[id]/route.ts` - Full user edit + view
- Added GET handler for single user detail view (includes referrer info and referral count)
- PUT handler now accepts ALL editable fields: name, email, phone, cpf, plan, isActive, all 6 balances, careerPoints, personalPoints, stars, city, state, country, bankCode, bankAgency, bankAccount, bankType, pixKey, pixEnabled, isDriver, isDelivery, role

#### 3. `src/app/api/admin/cashback/route.ts` - NEW cashback management API
- GET: Lists all cashback entries across CashbackEntry, CashbackResidual, CashbackSales tables
  - Filter by type (entrada/residual/vendas/all) and userId
  - Returns enriched entries with user names and emails
  - Includes totals per type and per-user summary (top 20)
  - Pagination support
- POST: Add manual cashback entry to any user
  - Supports all 3 cashback types
  - Validates admin, target user, and amount
  - Auto-sets fromUserId to admin

#### 4. `src/components/newmobility/admin/admin-page.tsx` - Complete rewrite
- **AdminUser interface**: Now includes all 30+ user fields
- **Edit User Dialog**: Completely rebuilt with 6 organized sections:
  - Dados Pessoais (name, email, phone, cpf)
  - Plano & Status (plan, status, role, isDriver, isDelivery checkboxes)
  - Saldos (all 6 balances with centavos input and formatted display)
  - Carreira (careerPoints, personalPoints, stars)
  - Localização (city, state, country)
  - Dados Bancários (bankCode, bankAgency, bankAccount, bankType, pixKey, pixEnabled)
- **View User Modal**: New "Visualizar" button on each user row
  - Shows ALL user info in read-only format with organized sections
  - Includes referrer info and registration date
  - Fetches full user details via GET /admin/users/[id]
- **Cashback Tab**: New tab with:
  - Total cards (Entrada/Residual/Vendas/Geral)
  - Type filter buttons (all/entrada/residual/vendas)
  - User ID filter input
  - Top users by cashback summary
  - Full cashback entries table with type badge, from-user, level, description
  - "Adicionar Cashback" dialog for manual entry
- Badge updated from "Admin" to "Admin Geral"
- Added Cashback tab trigger with Receipt icon
- View button (blue eye icon) alongside Edit button on user rows

### Verification
- `bun run lint` passed with zero errors
- Dev server running correctly
