'use client'

// API service for NewMobility frontend
const API_BASE = '/api'

export class ApiError extends Error {
  status: number
  
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new ApiError(
      errorData.error || `Erro ${res.status}`,
      res.status
    )
  }
  
  return res.json()
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (data: {
    name: string
    email: string
    phone: string
    cpf: string
    password: string
    referralCode?: string
    plan: string
  }) =>
    apiFetch<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Dashboard
export const dashboardApi = {
  getData: (userId: string) =>
    apiFetch<any>(`/dashboard?userId=${userId}`),
}

// Cashback
export const cashbackApi = {
  getEntrada: (userId: string) =>
    apiFetch<any>(`/cashback/entrada?userId=${userId}`),
  getResidual: (userId: string) =>
    apiFetch<any>(`/cashback/residual?userId=${userId}`),
  getVendas: (userId: string) =>
    apiFetch<any>(`/cashback/vendas?userId=${userId}`),
}

// Referrals
export const referralsApi = {
  getList: (userId: string) =>
    apiFetch<any>(`/referrals?userId=${userId}`),
  getTree: (userId: string, depth = 5) =>
    apiFetch<any>(`/referrals/tree?userId=${userId}&depth=${depth}`),
}

// Financial
export const financialApi = {
  getBalances: (userId: string) =>
    apiFetch<any>(`/financial/balances?userId=${userId}`),
  getTransactions: (userId: string, page = 1, limit = 20, type = 'all') =>
    apiFetch<any>(`/financial/transactions?userId=${userId}&page=${page}&limit=${limit}&type=${type}`),
  withdraw: (userId: string, amount: number, category: string) =>
    apiFetch<any>('/financial/withdraw', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, category }),
    }),
}

// Career
export const careerApi = {
  getData: (userId: string) =>
    apiFetch<any>(`/career?userId=${userId}`),
}

// Gratifications
export const gratificationsApi = {
  getList: (userId: string) =>
    apiFetch<any>(`/gratifications?userId=${userId}`),
  claim: (userId: string, gratificationId: string) =>
    apiFetch<any>('/gratifications/claim', {
      method: 'POST',
      body: JSON.stringify({ userId, gratificationId }),
    }),
}

// Points
export const pointsApi = {
  getData: (userId: string) =>
    apiFetch<any>(`/points?userId=${userId}`),
}

// Support
export const supportApi = {
  getTickets: (userId: string) =>
    apiFetch<any>(`/support/tickets?userId=${userId}`),
  getTicket: (ticketId: string, userId: string) =>
    apiFetch<any>(`/support/tickets/${ticketId}?userId=${userId}`),
  createTicket: (userId: string, subject: string, category: string, message: string) =>
    apiFetch<any>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ userId, subject, category, message }),
    }),
  replyTicket: (ticketId: string, userId: string, message: string) =>
    apiFetch<any>(`/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ userId, message }),
    }),
}

// Vouchers
export const vouchersApi = {
  getList: (userId: string) =>
    apiFetch<any>(`/vouchers?userId=${userId}`),
}

// Invoices
export const invoicesApi = {
  getList: (userId: string) =>
    apiFetch<any>(`/invoices?userId=${userId}`),
}

// Plans
export const plansApi = {
  getList: () =>
    apiFetch<any>('/plans'),
  upgrade: (userId: string, plan: string) =>
    apiFetch<any>('/plans/upgrade', {
      method: 'POST',
      body: JSON.stringify({ userId, plan }),
    }),
}

// User
export const userApi = {
  getProfile: (userId: string) =>
    apiFetch<any>(`/user/profile?userId=${userId}`),
  updateProfile: (userId: string, data: any) =>
    apiFetch<any>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ userId, ...data }),
    }),
  changePassword: (userId: string, currentPassword: string, newPassword: string) =>
    apiFetch<any>('/user/password', {
      method: 'PUT',
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    }),
}

// Seed
export const seedApi = {
  seed: () =>
    apiFetch<any>('/seed', { method: 'POST' }),
}
