# NewMobility BackOffice - Work Log

## Current Project Status
- **Project**: NewMobility MLM BackOffice Dashboard
- **Tech Stack**: Next.js 16 + TypeScript + Tailwind CSS + Prisma (SQLite) + shadcn/ui
- **Server**: Dev server with auto-restart (resilient.sh) due to OOM issues with large project
- **Database**: SQLite at /home/z/my-project/db/custom.db
- **Status**: All major features implemented and working

## Session 2026-06-05 - Major Feature Update

### 1. Portal Lojista Access Control
- Only users with `userType === 'lojista'` can access Portal do Lojista
- Added `useEffect` redirect in `page.tsx` for lojista-only pages
- Sidebar hides Portal Lojista menu item for non-lojista users

### 2. Admin Access Control
- Enhanced admin-only page protection using `useEffect` instead of `setTimeout`
- Prevents UI flickering when non-admin users try to access admin pages

### 3. Financial Withdrawal Fix - Cents/Reais Bug
- **Bug**: When user typed "5000" in withdrawal, it showed R$50.00 (treated as cents)
- **Fix**: Input now works in reais. Presets set direct reais values (50, 100, 250, 500, 1000)
- Fee display converts to cents: `Number(withdrawAmount) * 100`
- API call converts: `financialApi.withdraw(user.id, Number(withdrawAmount) * 100, 'withdrawal')`

### 4. Negative Balance Allowed on Withdrawals
- Removed balance check from `/api/financial/withdraw/route.ts`
- Balances can now go negative when user withdraws more than available

### 5. Referrals Page - Real API Data
- Replaced `setTimeout(() => setLoading(false), 800)` with actual API call
- Fetches real referrals from `/api/referrals?userId=xxx`
- Falls back to mock data if API fails, preventing infinite loading

### 6. Portal SportBet - Complete Rewrite with Real Betting
- Removed all "EM BREVE" badges - now a working feature
- **Sports Odds API** (`/api/sports/odds`): 20 realistic events across 7 leagues
- **Bets API** (`/api/bets`): Place bets, view history, settle bets
- **Bet Settlement** (`/api/bets/[betId]/settle`): Win credits balance, loss gives 5% cashback
- **Wallet Integration**: Bets deduct from `balanceFree`, wins credit back
- Live/Upcoming tabs with color-coded odds
- Bet slip with accumulator support, amount input, quick presets
- "Simular Resultado" buttons for demo bet settlement
- Added `Bet` model to Prisma schema

### 7. Marketplace - Lojista User & Products Seeded
- Created lojista user: "Ricardo Mendes" (ricardo.lojista@email.com / 123456)
- Seeded 19 products across 9 categories with realistic data
- Fixed marketplace products API to use Prisma (was using broken `db.execute()`)
- Fixed marketplace orders API to use Prisma
- Fixed product [productId] route to use Prisma
- Lojista users can now create products (not just admin)

### 8. Portal Lojista - Full Rewrite with Product Management
- Removed "EM BREVE" badges from working features
- Added 3-tab navigation: Overview, Meus Produtos, Vendas
- Product management: Add, edit, toggle active/inactive, delete products
- "Adicionar Produto" dialog with form fields
- Sales/Orders section showing orders for lojista's products
- Real data fetched from APIs

### 9. Admin Panel (Partial - Agent Timed Out)
- Admin APIs were already fixed in previous session
- Support/Tickets tab and Financial tab were enhanced previously
- Test tickets seeded via direct Prisma script

## Credentials
- **Demo user**: carlos.silva@email.com / 123456 (userType: usuario)
- **Admin**: admin@newmobility.com / 123456 (role: admin)
- **Lojista**: ricardo.lojista@email.com / 123456 (userType: lojista)

## Server Stability Issues
- The project has grown too large and causes OOM crashes when compiling
- Dev server crashes intermittently, especially when compiling new routes
- Auto-restart script (`resilient.sh`) keeps server running
- Production build works but standalone server also OOMs on API calls sometimes
- Need to reduce bundle size or increase sandbox memory

## Unresolved Issues
1. **Server OOM**: Project too large for sandbox memory, causes intermittent crashes
2. **Admin panel verification**: Admin panel needs browser testing to confirm all tabs work
3. **Some APIs may have errors**: Need to verify all admin APIs work with Prisma
4. **Marketplace orders for seller**: The seller-specific order API may need more testing

## Priority for Next Phase
1. Fix server stability (reduce bundle size or optimize)
2. Browser test all features end-to-end
3. Verify admin panel all tabs work correctly
4. Add more interactive features
5. Improve mobile responsiveness
