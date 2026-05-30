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
2. ~~**Register page**: Affiliate link registration works, username field should be locked when coming from referral link~~ → Fixed (Task 3): referralCode field locked on referral, name field now editable
3. ~~**Infinite loading on login**: The "Cadastre-se" and admin demo buttons should work now that the API is functional~~ → Fixed (Task 3): Added timeout, network error handling, safety timer
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
- `DOMException` with `AbortError` name is caught and re-thrown as `ApiTimeoutError`
- `TypeError` from fetch (network failure) is caught and re-thrown as `ApiNetworkError`
- `timeoutMs` option available for custom timeout values per-call

#### 2. `src/components/newmobility/auth/login-page.tsx` - Fixed infinite loading
- Added 15-second safety timeout in `handleLogin` that resets `loading` and shows error toast even if the API call never resolves
- `clearTimeout(safetyTimer)` called in both `catch` and `finally` blocks to prevent double-toasts
- Error messages from `ApiTimeoutError` and `ApiNetworkError` are now properly displayed to users via toast

#### 3. `src/components/newmobility/auth/register-page.tsx` - Fixed register issues
- Removed `disabled={hasReferral}` from the **Name** field — users should be able to enter their own name even when coming from a referral link (the referral link only provides a referral code, not a name)
- Removed the "definido pelo indicador" (defined by referrer) label and lock icon from the Name field
- **Referral code field** remains locked (`disabled={hasReferral}`) when coming from a referral link — this prevents users from changing who referred them
- Added same 15-second safety timeout pattern to `handleSubmit` for registration
- Changed `catch (err: any)` to `catch (err: unknown)` with proper `instanceof Error` check for type safety

### Verification
- `bun run lint` passed with zero errors
- Dev server running without compilation errors

---

## Task 4 - Voucher Purchase Dialog & Admin CRUD Enhancement

**Agent**: Code Agent  
**Date**: 2025-03-04

### TASK 1: Fix "Buy Voucher" button

**Previous behavior**: Clicking "Comprar Voucher" navigated to marketplace page with a toast.

**New behavior**: Opens a multi-step purchase dialog modal with:
1. **Category selection step**: User picks from Mobilidade, Farmácia, Refeição, Shopping (each with icon, name, and description)
2. **Amount selection step**: User picks from R$25, R$50, R$100, R$200, R$500 (with back navigation to change category)
3. **Confirmation step**: Shows summary (category, amount, payment method), warning about 90-day validity, and "Confirmar Compra" button
4. **Success flow**: On confirm, generates a voucher code, adds it to the list, shows success toast
5. **Marketplace option**: "Explorar Marketplace" button at bottom of category step still navigates to marketplace

**File changed**: `src/components/newmobility/voucher/voucher-page.tsx`
- Added `Dialog` component from shadcn/ui for modal
- Added state management for `purchaseDialogOpen`, `selectedCategory`, `selectedAmount`, `purchaseStep`, `isPurchasing`
- Changed `mockVouchers` from `const` to `useState` so new vouchers can be added dynamically
- `EmptyState` onAction now also uses `handleBuyVoucher` instead of old marketplace navigation

### TASK 2: Admin CRUD Enhancement

**File changed**: `src/components/newmobility/admin/admin-page.tsx`

#### Users tab: Edit user details modal
- Added "Editar" button in each user row
- Edit dialog with fields: Name, Email, Plan (select), Status (Active/Inactive), Balance (with cents display)
- Uses `Dialog` + `Select` shadcn/ui components
- Save calls `PUT /api/admin/users/[id]`

#### Plans tab (NEW): Full CRUD
- New "Planos" tab added to admin tabs
- Lists all plans as cards with features, matrix info, and price
- "Novo Plano" button opens create dialog
- "Editar" button on each plan card opens edit dialog
- "Excluir" button on custom plans (default plans free/blue3/blue5 cannot be deleted)
- Create/Edit dialog: Name, Price (cents), Features (comma-separated), Matrix dimensions
- Calls `GET/POST /api/admin/plans` and `PUT/DELETE /api/admin/plans/[planId]`

#### Withdrawals tab (NEW): Approve/Reject
- New "Saques" tab added to admin tabs
- Stats cards showing pending/approved/rejected counts and amounts
- Filter buttons: All, Pending, Approved, Rejected
- Table with user info, amount, date, status badge
- "Aprovar" and "Rejeitar" buttons on pending withdrawals (with loading spinner)
- Calls `GET /api/admin/withdrawals` and `PUT /api/admin/withdrawals/[id]`

#### Config tab: Verified
- Already working with save functionality - no changes needed

### API Routes Created

1. **`PUT /api/admin/users/[id]`** - Update user details (name, email, plan, isActive, balanceWithdrawal)
   - Verifies admin role before allowing updates
   - Returns sanitized user object (without password)

2. **`GET/POST /api/admin/plans`** - List and create plans
   - GET returns plans from database or defaults
   - POST creates a new plan with auto-generated ID

3. **`PUT/DELETE /api/admin/plans/[planId]`** - Update and delete plans
   - PUT updates plan fields
   - DELETE prevents deletion of default plans (free, blue3, blue5)

4. **`GET /api/admin/withdrawals`** - List all withdrawal requests
   - Supports status filter, pagination
   - Joins with User table for user info
   - Returns stats (pending/approved/rejected counts and amounts)

5. **`PUT /api/admin/withdrawals/[id]`** - Approve/reject withdrawals
   - `action: 'approve'` sets status to 'approved'
   - `action: 'reject'` sets status to 'rejected' and refunds user balance

### Verification
- `bun run lint` passed with zero errors
- Dev server running without compilation errors
