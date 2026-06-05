'use client'

import { useEffect } from 'react'
import { useStore, type PageKey } from '@/lib/store'
import { authApi } from '@/lib/api'
import { AppLayout } from '@/components/newmobility/app-layout'
import { LoginPage } from '@/components/newmobility/auth/login-page'
import { RegisterPage } from '@/components/newmobility/auth/register-page'
import { DashboardPage } from '@/components/newmobility/dashboard/dashboard-page'
import { CashbackPage } from '@/components/newmobility/cashback/cashback-page'
import { ReferralsPage } from '@/components/newmobility/referrals/referrals-page'
import { FinancialPage } from '@/components/newmobility/financial/financial-page'
import { CareerPage } from '@/components/newmobility/career/career-page'
import { GratificationsPage } from '@/components/newmobility/gratifications/gratifications-page'
import { PointsPage } from '@/components/newmobility/points/points-page'
import { SupportPage } from '@/components/newmobility/support/support-page'
import { VoucherPage } from '@/components/newmobility/voucher/voucher-page'
import { MyPlanPage } from '@/components/newmobility/myplan/myplan-page'
import { ProfilePage } from '@/components/newmobility/profile/profile-page'
import { PortalLojista } from '@/components/newmobility/portals/portal-lojista'
import { PortalGamer } from '@/components/newmobility/portals/portal-gamer'
import { PortalSportBet } from '@/components/newmobility/portals/portal-sportbet'
import { AppsPage } from '@/components/newmobility/portals/apps-page'
import { BankPage } from '@/components/newmobility/portals/bank-page'
import { PurchasesPage } from '@/components/newmobility/portals/purchases-page'
import { AdminPage } from '@/components/newmobility/admin/admin-page'
import { ReportsPage } from '@/components/newmobility/reports/reports-page'
import { GamificationPage } from '@/components/newmobility/gamification/gamification-page'
import { EarningsSimulator } from '@/components/newmobility/simulator/earnings-simulator'
import { EventsPage } from '@/components/newmobility/events/events-page'
import { LeaderboardPage } from '@/components/newmobility/leaderboard/leaderboard-page'
import { MarketplacePage } from '@/components/newmobility/marketplace/marketplace-page'

function PageContent() {
  const { activePage, user, setActivePage } = useStore()

  // Admin-only pages: redirect non-admin users to dashboard
  const adminOnlyPages: PageKey[] = ['admin']
  if (adminOnlyPages.includes(activePage) && user?.role !== 'admin') {
    // Use useEffect-like pattern to avoid render loop
    setTimeout(() => setActivePage('dashboard'), 0)
    return <DashboardPage />
  }

  switch (activePage) {
    case 'dashboard':
      return <DashboardPage />
    case 'apps':
      return <AppsPage />
    case 'bank':
      return <BankPage />
    case 'profile':
      return <ProfilePage />
    case 'myplan':
      return <MyPlanPage />
    case 'purchases':
      return <PurchasesPage />
    case 'portal-lojista':
      return <PortalLojista />
    case 'portal-gamer':
      return <PortalGamer />
    case 'portal-sportbet':
      return <PortalSportBet />
    case 'gratifications':
      return <GratificationsPage />
    case 'points':
      return <PointsPage />
    case 'career':
      return <CareerPage />
    case 'referrals':
      return <ReferralsPage />
    case 'cashback':
      return <CashbackPage />
    case 'financial':
      return <FinancialPage />
    case 'voucher':
      return <VoucherPage />
    case 'support':
      return <SupportPage />
    case 'admin':
      return <AdminPage />
    case 'reports':
      return <ReportsPage />
    case 'gamification':
      return <GamificationPage />
    case 'simulator':
      return <EarningsSimulator />
    case 'events':
      return <EventsPage />
    case 'leaderboard':
      return <LeaderboardPage />
    case 'marketplace':
      return <MarketplacePage />
    default:
      return <DashboardPage />
  }
}

export default function Home() {
  const { isAuthenticated, authView, login, darkMode } = useStore()

  // Sync dark mode class on html element from persisted state
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Auto-login with demo credentials if URL has ?demo=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true' && !isAuthenticated) {
      authApi.login('carlos.silva@email.com', '123456').then((data) => {
        if (data.user) {
          login(data.user)
        }
      }).catch(console.error)
    }
  }, [isAuthenticated, login])

  // If not authenticated, show auth pages
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage />
    }
    return <LoginPage />
  }

  // If authenticated, show app layout with active page
  return (
    <AppLayout>
      <PageContent />
    </AppLayout>
  )
}
