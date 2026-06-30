'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Smartphone,
  HeartPulse,
  Check,
  Sparkles,
  Star,
  Gift,
  ArrowRight,
  Wifi,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { EmptyState } from '../ui/empty-states'

interface TalkMobiPlanDTO {
  id: string
  name: string
  dataAmount: string
  priceCents: number
  cashbackCents: number
  rewardPoints: number
  description: string | null
  features: string[]
  isPopular: boolean
  isRecommended: boolean
  sortOrder: number
  priceFormatted: string
  cashbackFormatted: string
}

interface ApiResponse {
  plans: TalkMobiPlanDTO[]
}

/**
 * Hardcoded fallback catalogue shown if the API returns no plans (e.g.
 * the DB is unreachable, the table is empty, or the auto-seed in
 * /api/talkmobi/plans failed). Mirrors the four canonical plans in
 * src/lib/seed-talkmobi.ts so the user always sees something useful,
 * even on a totally broken backend. The `id` field uses the same slug
 * so React reconciliation stays stable when the API recovers.
 */
const FALLBACK_PLANS: TalkMobiPlanDTO[] = [
  {
    id: 'talkmobi-10gb',
    name: 'Plano 10 GB',
    dataAmount: '10 GB',
    priceCents: 2990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: null,
    features: [
      '10 GB de internet',
      'Ligações ilimitadas',
      'SMS ilimitado',
      'App TalkMobi',
    ],
    isPopular: false,
    isRecommended: false,
    sortOrder: 1,
    priceFormatted: 'R$ 29,90',
    cashbackFormatted: 'R$ 0,00',
  },
  {
    id: 'talkmobi-20gb',
    name: 'Plano 20 GB',
    dataAmount: '20 GB',
    priceCents: 3990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: null,
    features: [
      '20 GB de internet',
      'Ligações ilimitadas',
      'SMS ilimitado',
      'App TalkMobi',
      'Roaming nacional',
    ],
    isPopular: true,
    isRecommended: false,
    sortOrder: 2,
    priceFormatted: 'R$ 39,90',
    cashbackFormatted: 'R$ 0,00',
  },
  {
    id: 'talkmobi-50gb',
    name: 'Plano 50 GB',
    dataAmount: '50 GB',
    priceCents: 5990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: null,
    features: [
      '50 GB de internet',
      'Ligações ilimitadas',
      'SMS ilimitado',
      'App TalkMobi',
      'Roaming nacional',
      '5G prioritário',
    ],
    isPopular: false,
    isRecommended: true,
    sortOrder: 3,
    priceFormatted: 'R$ 59,90',
    cashbackFormatted: 'R$ 0,00',
  },
  {
    id: 'talkmobi-ilimitado',
    name: 'Plano Ilimitado',
    dataAmount: 'Ilimitado',
    priceCents: 9990,
    cashbackCents: 0,
    rewardPoints: 0,
    description: null,
    features: [
      'Internet ilimitada',
      'Ligações ilimitadas',
      'SMS ilimitado',
      'App TalkMobi',
      'Roaming nacional/internacional',
      '5G prioritário',
      'Telemedicina inclusa',
    ],
    isPopular: false,
    isRecommended: false,
    sortOrder: 4,
    priceFormatted: 'R$ 99,90',
    cashbackFormatted: 'R$ 0,00',
  },
]

export function TalkMobiPage() {
  const [plans, setPlans] = useState<TalkMobiPlanDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [telemedOpen, setTelemedOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await apiFetch<ApiResponse>('/talkmobi/plans')
        if (cancelled || !data) return
        const apiPlans = Array.isArray(data.plans) ? data.plans : []
        if (apiPlans.length > 0) {
          setPlans(apiPlans)
        } else {
          // API responded but the table is empty / seed failed — fall
          // back to the hardcoded catalogue so the page is never blank.
          console.warn('TalkMobi API returned no plans — using hardcoded fallback.')
          setPlans(FALLBACK_PLANS)
        }
      } catch (err) {
        // Network / 500 error — also fall back to the hardcoded list so
        // the user still sees the four plans even if the backend is down.
        console.error('TalkMobi plans load failed — using hardcoded fallback:', err)
        setPlans(FALLBACK_PLANS)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleSubscribe = (plan: TalkMobiPlanDTO) => {
    toast.success(`Em breve: assinatura do plano ${plan.name} disponível!`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Smartphone className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
          TalkMobi + Telemedicina
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Planos de celular e saúde para sua família
        </p>
      </div>

      {/* ===== TalkMobi Plans Section ===== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Wifi className="h-4 w-4" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-foreground">
            Planos TalkMobi
          </h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="rounded-2xl shadow-sm">
                <CardContent className="p-4 md:p-6 space-y-3 animate-pulse">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-6 w-32 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted rounded" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-3/4 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <Card className="rounded-2xl shadow-sm bg-card">
            <CardContent className="p-6 md:p-10">
              <EmptyState
                icon={Smartphone}
                title="Nenhum plano TalkMobi disponível"
                description="Os planos de celular serão exibidos aqui assim que o time comercial publicá-los. Volte em breve!"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx, duration: 0.3 }}
              >
                <Card
                  className={`rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full ${
                    plan.isPopular
                      ? 'ring-2 ring-emerald-500/40 dark:ring-emerald-500/30'
                      : ''
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <Star className="h-3 w-3 fill-white" />
                      POPULAR
                    </div>
                  )}
                  {plan.isRecommended && !plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      RECOMENDADO
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <CardTitle className="text-base md:text-lg font-bold text-foreground">
                      {plan.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.dataAmount} de internet
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-3">
                    {/* Price */}
                    <div>
                      <span className="text-2xl md:text-3xl font-bold text-foreground">
                        {plan.priceFormatted}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">/mês</span>
                    </div>

                    {/* Cashback + Reward Points */}
                    <div className="flex flex-wrap gap-2">
                      {plan.cashbackCents > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 text-[11px]"
                        >
                          <Gift className="h-3 w-3 mr-1" />
                          {plan.cashbackFormatted} de cashback
                        </Badge>
                      )}
                      {plan.rewardPoints > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 text-[11px]"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          +{plan.rewardPoints} pontos
                        </Badge>
                      )}
                    </div>

                    {/* Features */}
                    {plan.features.length > 0 && (
                      <ul className="space-y-1.5 mt-1">
                        {plan.features.slice(0, 6).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-foreground/80">
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Subscribe button pinned to bottom */}
                    <div className="mt-auto pt-3">
                      <Button
                        type="button"
                        onClick={() => handleSubscribe(plan)}
                        className={`w-full gap-1.5 ${
                          plan.isPopular
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : ''
                        }`}
                      >
                        Assinar
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Telemedicina Section ===== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <HeartPulse className="h-4 w-4" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-foreground">
            Telemedicina
          </h3>
        </div>

        <Card className="rounded-2xl shadow-sm overflow-hidden bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
          <div className="h-1 bg-gradient-to-r from-rose-400 to-pink-400" />
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="p-3 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shrink-0">
                <HeartPulse className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <h4 className="text-base md:text-lg font-bold text-rose-800 dark:text-rose-300">
                  Saúde 24h para toda a família
                </h4>
                <p className="text-xs md:text-sm text-rose-700 dark:text-rose-400 leading-relaxed">
                  Consultas médicas online ilimitadas, suporte psicológico,
                  receitas digitais e descontos em farmácias e clínicas
                  parceiras — tudo pelo app NewMobility.
                </p>
                <div className="flex flex-wrap gap-3 text-[11px] md:text-xs text-rose-700 dark:text-rose-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Disponível 24h
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Sem custo por consulta
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTelemedOpen(true)}
                className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40 w-full md:w-auto shrink-0"
              >
                Saiba Mais
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== Telemedicina Details Dialog ===== */}
      <Dialog open={telemedOpen} onOpenChange={setTelemedOpen}>
        <DialogContent className="rounded-2xl shadow-lg sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shrink-0">
                <HeartPulse className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base md:text-lg">
                Telemedicina NewMobility
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-foreground/80">
              Cuidado completo para você e sua família, direto pelo app.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2 text-sm text-foreground/90 py-2">
            {[
              'Consultas médicas online ilimitadas com profissionais generalistas e especialistas',
              'Suporte psicológico com até 4 sessões por mês',
              'Receitas digitais e atestados emitidos em tempo real',
              'Descontos exclusivos em farmácias e clínicas parceiras',
              'Orientação pediátrica e gerontológica 24h',
              'Acompanhamento de doenças crônicas (hipertensão, diabetes, etc.)',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setTelemedOpen(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white w-full sm:w-auto"
              onClick={() => {
                setTelemedOpen(false)
                toast.success('Em breve: ativação da Telemedicina no app!')
              }}
            >
              Quero ativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
