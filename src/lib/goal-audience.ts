/**
 * Task 15-f — Audiência das metas (GoalConfig.targetQualification).
 *
 * Helper COMPARTILHADO entre as rotas de API (GET /api/goal-configs e
 * POST /api/goal-configs/claim). Vive em src/lib (NÃO dentro de route files)
 * para evitar import cycles e permitir reuso/teste.
 *
 * Problema corrigido: o filtro antigo usava igualdade ESTRITA entre
 * user.qualification e a meta (ex.: 'ambos' só casava com 'motorista' ou
 * 'entregador' exatos). Metas criadas no admin não apareciam para
 * mototaxista, taxista, motorista_app, caminhoneiro, motofretista, usuários
 * com userType preenchido mas qualification vazio, nem para quem só tinha as
 * flags isDriver/isDelivery — ou seja, "meta criada no admin não sai no
 * backoffice".
 */

import {
  isDriverQualification,
  isDeliveryQualification,
  resolveUserQualification,
} from '@/lib/qualifications'

/** Campos do usuário relevantes para casar com a audiência de uma meta. */
export interface GoalAudienceUser {
  qualification?: string | null
  userType?: string | null
  isDriver?: boolean | null
  isDelivery?: boolean | null
}

/**
 * Verifica se `user` é atingido pela audiência de uma meta.
 *
 * Regras (Task 15-f):
 *  - 'ambos' (ou alvo vazio = "todos") casa com TODAS as categorias de
 *    condutor (motorista, entregador, mototaxista, taxista, motorista_app,
 *    caminhoneiro, motofretista — via lib/qualifications.ts), com as flags
 *    legacy isDriver/isDelivery e TAMBÉM com usuários de qualificação vazia.
 *    DECISÃO DOCUMENTADA: perfil sem qualificação preenchida é tratado como
 *    "qualquer tipo" para que uma meta criada pelo admin NUNCA deixe de
 *    aparecer por causa de cadastro incompleto. Perfis com qualificação
 *    explícita não-condutora (cliente, lojista, passageiro*, outros) ficam
 *    de fora — o front já esconde o módulo Metas para eles (Item 7).
 *  - Alvos específicos casam por IGUALDADE (inclui códigos custom de
 *    UserType gravados em User.qualification, ex.: 'mototaxista') OU pelo
 *    mapeamento de categorias: 'motorista' atinge todas as categorias de
 *    motorista; 'entregador' atinge todas as categorias de entrega.
 */
export function userMatchesGoalAudience(
  user: GoalAudienceUser | null | undefined,
  goalTargetQualification: string | null | undefined
): boolean {
  const target = (goalTargetQualification ?? '').trim().toLowerCase()

  // Resolve a qualificação efetiva: qualification → userType → flags legacy.
  const qual = resolveUserQualification(user)
  const isDriver = isDriverQualification(qual) || user?.isDriver === true
  const isDelivery = isDeliveryQualification(qual) || user?.isDelivery === true

  if (!target || target === 'ambos' || target === 'todos') {
    // Ver comentário de decisão acima. isDriver/isDelivery já cobrem todas
    // as categorias de condutor; qual === '' cobre o cadastro incompleto.
    return qual === '' || isDriver || isDelivery
  }

  // Match exato — cobre códigos custom de UserType (ex.: 'mototaxista').
  if (qual === target) return true

  // Mapeamento de categorias (lib/qualifications.ts):
  //   'motorista'  → motorista, mototaxista, taxista, motorista_app
  //   'entregador' → entregador, motofretista, caminhoneiro
  if (target === 'motorista') return isDriver
  if (target === 'entregador') return isDelivery

  return false
}
