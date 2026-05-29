'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Trophy, TrendingUp, Users, DollarSign, Calendar, BarChart3,
  Clock, Zap, Shield, ArrowUpRight, Activity, AlertTriangle, Phone, Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'

const liveEvents = [
  { id: 1, home: 'São Paulo FC', away: 'Corinthians', league: 'Brasileirão', homeOdds: 2.10, drawOdds: 3.25, awayOdds: 3.50, time: '32\'', isLive: true },
  { id: 2, home: 'Flamengo', away: 'Palmeiras', league: 'Brasileirão', homeOdds: 1.85, drawOdds: 3.40, awayOdds: 4.20, time: '15\'', isLive: true },
  { id: 3, home: 'Real Madrid', away: 'Barcelona', league: 'La Liga', homeOdds: 2.05, drawOdds: 3.30, awayOdds: 3.60, time: '', isLive: false, startTime: 'Hoje 16h' },
]

const betHistory = [
  { id: 'APT-001', event: 'São Paulo vs Santos', type: 'Vitória SP', odds: 2.10, amount: 5000, potentialWin: 10500, status: 'won', date: '2025-01-28' },
  { id: 'APT-002', event: 'Flamengo vs Grêmio', type: 'Empate', odds: 3.25, amount: 3000, potentialWin: 9750, status: 'lost', date: '2025-01-27' },
  { id: 'APT-003', event: 'Palmeiras vs Bahia', type: 'Vitória Palmeiras', odds: 1.55, amount: 10000, potentialWin: 15500, status: 'pending', date: '2025-02-01' },
  { id: 'APT-004', event: 'Botafogo vs Vasco', type: 'Mais de 2.5 gols', odds: 1.90, amount: 5000, potentialWin: 9500, status: 'won', date: '2025-01-25' },
]

const upcomingEvents = [
  { home: 'Brasil', away: 'Argentina', league: 'Eliminatórias', date: '05 Mar', time: '21h30' },
  { home: 'Liverpool', away: 'Man City', league: 'Premier League', date: '08 Mar', time: '13h30' },
  { home: 'PSG', away: 'Bayern', league: 'Champions League', date: '12 Mar', time: '16h00' },
]

const betStatusColor = {
  won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

const betIconColor = {
  won: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  lost: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
}

const betStatusLabel = {
  won: 'Ganha',
  lost: 'Perdida',
  pending: 'Pendente',
}

// Helper function to color-code odds: green for favorable (<2.0), yellow for moderate (2.0-3.0), red for unfavorable (>3.0)
function getOddsColor(odds: number): string {
  if (odds < 2.0) return 'text-emerald-600 dark:text-emerald-400'
  if (odds <= 3.0) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getOddsBgColor(odds: number): string {
  if (odds < 2.0) return 'hover:border-emerald-300 dark:hover:border-emerald-700'
  if (odds <= 3.0) return 'hover:border-amber-300 dark:hover:border-amber-700'
  return 'hover:border-red-300 dark:hover:border-red-700'
}

export function PortalSportBet() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Portal Sport Bet</h2>
        <p className="text-sm text-muted-foreground">Apostas esportivas e CashBack</p>
      </div>

      {/* Hero Banner with gradient overlay */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 animate-gradient-shift border-0 shadow-lg overflow-hidden relative">
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          <div className="absolute inset-0 animate-shimmer" />
          {/* Coming Soon badge */}
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-amber-500/90 text-white text-[10px] font-bold px-2.5 py-1 border-0 shadow-md animate-bounce-subtle">
              <Sparkles className="h-3 w-3 mr-1" />
              EM BREVE
            </Badge>
          </div>
          <CardContent className="p-6 text-white relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-white/15">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Portal Sport Bet</h3>
                <p className="text-emerald-200">Aposte com responsabilidade e ganhe CashBack</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-white/15 rounded-lg px-3 py-2 text-center backdrop-blur-sm">
                <p className="text-xl font-bold">5%</p>
                <p className="text-[10px] text-emerald-200">CashBack Apostas</p>
              </div>
              <div className="bg-white/15 rounded-lg px-3 py-2 text-center backdrop-blur-sm">
                <p className="text-xl font-bold">{formatCurrency(32500)}</p>
                <p className="text-[10px] text-emerald-200">CashBack Acumulado</p>
              </div>
              <div className="bg-white/15 rounded-lg px-3 py-2 text-center backdrop-blur-sm">
                <p className="text-xl font-bold">24</p>
                <p className="text-[10px] text-emerald-200">Eventos ao Vivo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Live Events */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-red-500" />
            Eventos ao Vivo
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              LIVE
            </Badge>
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px]">Em Breve</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {liveEvents.filter((e) => e.isLive).map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-muted/50 rounded-lg p-4 border border-border hover:border-emerald-200 dark:hover:border-emerald-800 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{event.league}</Badge>
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                    </span>
                    {event.time}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-center flex-1">
                  <p className="text-sm font-bold text-foreground">{event.home}</p>
                </div>
                <div className="px-3">
                  <span className="text-xs text-muted-foreground font-medium">VS</span>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm font-bold text-foreground">{event.away}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className={`bg-card border border-border rounded-lg p-2 text-center ${getOddsBgColor(event.homeOdds)} hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all`}>
                  <p className="text-[10px] text-muted-foreground">Casa</p>
                  <p className={`text-sm font-bold ${getOddsColor(event.homeOdds)}`}>{event.homeOdds.toFixed(2)}</p>
                </button>
                <button className={`bg-card border border-border rounded-lg p-2 text-center ${getOddsBgColor(event.drawOdds)} hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all`}>
                  <p className="text-[10px] text-muted-foreground">Empate</p>
                  <p className={`text-sm font-bold ${getOddsColor(event.drawOdds)}`}>{event.drawOdds.toFixed(2)}</p>
                </button>
                <button className={`bg-card border border-border rounded-lg p-2 text-center ${getOddsBgColor(event.awayOdds)} hover:bg-red-50 dark:hover:bg-red-950/30 transition-all`}>
                  <p className="text-[10px] text-muted-foreground">Fora</p>
                  <p className={`text-sm font-bold ${getOddsColor(event.awayOdds)}`}>{event.awayOdds.toFixed(2)}</p>
                </button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            Próximos Eventos
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px]">Em Breve</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {upcomingEvents.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 hover:scale-[1.01] transition-all duration-200"
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{event.home} vs {event.away}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{event.league}</span>
                    <span>·</span>
                    <span>{event.date} {event.time}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-600">
                  Ver Odds
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bet History */}
      <Card className="shadow-sm bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Histórico de Apostas
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-emerald-600">
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-64 overflow-y-auto custom-scrollbar">
            {betHistory.map((bet, i) => (
              <div key={bet.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-lg ${betIconColor[bet.status as keyof typeof betIconColor]}`}>
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{bet.event}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{bet.type}</span>
                    <span>·</span>
                    <span className={`font-medium ${getOddsColor(bet.odds)}`}>Odds: {bet.odds.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(bet.amount)}</p>
                  <Badge className={`text-[10px] ${betStatusColor[bet.status as keyof typeof betStatusColor]}`}>
                    {bet.status === 'won' ? `+${formatCurrency(bet.potentialWin)}` : betStatusLabel[bet.status as keyof typeof betStatusLabel]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CashBack on Bets Info */}
      <Card className="shadow-sm border-emerald-200 dark:border-emerald-800 bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            CashBack em Apostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 text-center border border-emerald-100 dark:border-emerald-900/50 hover:scale-[1.02] transition-all duration-200">
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">5%</p>
              <p className="text-xs text-muted-foreground mt-1">CashBack em apostas perdidas</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Creditado em até 24h</p>
            </div>
            <div className="bg-teal-50 dark:bg-teal-950/30 rounded-lg p-4 text-center border border-teal-100 dark:border-teal-900/50 hover:scale-[1.02] transition-all duration-200">
              <p className="text-3xl font-bold text-teal-700 dark:text-teal-400">2%</p>
              <p className="text-xs text-muted-foreground mt-1">CashBack extra em apostas ganhas</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Membros Blue 5 Premium</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-center border border-amber-100 dark:border-amber-900/50 hover:scale-[1.02] transition-all duration-200">
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">10%</p>
              <p className="text-xs text-muted-foreground mt-1">Bônus em apostas acumuladas</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">4+ seleções no bilhete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsible Gaming */}
      <Card className="shadow-sm border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">Jogue com Responsabilidade</h4>
              <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">
                Apostas esportivas são destinadas apenas para maiores de 18 anos. 
                Defina limites de tempo e dinheiro. Nunca aposte mais do que pode perder.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Autoexclusão disponível</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                  <Phone className="h-3.5 w-3.5" />
                  <span>CVV: 188</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
