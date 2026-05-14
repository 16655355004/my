export interface ShortLink {
  code: string
  title: string
  targetUrl: string
  description?: string
  enabled: boolean
  createdAt: string
  updatedAt?: string
  expiresAt?: string | null
  lastAccessedAt?: string
  deletedAt?: string
}

export interface ShortLinkInput {
  title: string
  targetUrl: string
  code?: string
  description?: string
  enabled?: boolean
  expiresAt?: string | null
}

export interface ShortLinkSummary extends ShortLink {
  shortUrl: string
  totalClicks: number
  todayClicks: number
  uniqueVisitors: number
}

export interface ShortLinkTotals {
  totalLinks: number
  activeLinks: number
  totalClicks: number
  todayClicks: number
}

export interface ShortLinkListData {
  links: ShortLinkSummary[]
  totals: ShortLinkTotals
}

export interface ShortLinkTotalStats {
  code: string
  totalClicks: number
  uniqueVisitors: number
  lastAccessedAt?: string
  updatedAt: string
}

export interface ShortLinkDailyStats {
  code: string
  date: string
  clicks: number
  uniqueVisitors: number
  referrers: Record<string, number>
  countries: Record<string, number>
  updatedAt: string
}

export interface ShortLinkStatsData {
  code: string
  total: ShortLinkTotalStats
  days: ShortLinkDailyStats[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class ShortLinkService {
  private baseUrl: string
  private adminToken: string | null = null

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'https://www.jisoolove.top' : '')
  }

  setAdminToken(token: string) {
    this.adminToken = token
    localStorage.setItem('shortlink_admin_token', token)
  }

  getAdminToken(): string | null {
    if (!this.adminToken) {
      this.adminToken = localStorage.getItem('shortlink_admin_token')
    }
    return this.adminToken
  }

  clearAdminToken() {
    this.adminToken = null
    localStorage.removeItem('shortlink_admin_token')
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (includeAuth && this.getAdminToken()) {
      headers.Authorization = `Bearer ${this.getAdminToken()}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json()
      if (!response.ok && data?.error) return data
      return data
    } catch {
      return {
        success: false,
        error: '响应解析失败',
      }
    }
  }

  async verifyAdminPassword(password: string): Promise<ApiResponse<ShortLinkListData>> {
    const previousToken = this.getAdminToken()
    this.setAdminToken(password)
    const result = await this.getAllShortLinks()
    if (!result.success) {
      if (previousToken) this.setAdminToken(previousToken)
      else this.clearAdminToken()
    }
    return result
  }

  async getAllShortLinks(): Promise<ApiResponse<ShortLinkListData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shortlinks`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      return await this.handleResponse<ShortLinkListData>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  async createShortLink(input: ShortLinkInput): Promise<ApiResponse<ShortLinkSummary>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shortlinks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(input),
      })
      return await this.handleResponse<ShortLinkSummary>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  async getShortLink(code: string): Promise<ApiResponse<ShortLinkSummary>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shortlinks/${encodeURIComponent(code)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      return await this.handleResponse<ShortLinkSummary>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  async updateShortLink(code: string, input: Partial<ShortLinkInput>): Promise<ApiResponse<ShortLinkSummary>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shortlinks/${encodeURIComponent(code)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(input),
      })
      return await this.handleResponse<ShortLinkSummary>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  async deleteShortLink(code: string): Promise<ApiResponse<ShortLink>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shortlinks/${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })
      return await this.handleResponse<ShortLink>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  async getShortLinkStats(code: string, days = 30): Promise<ApiResponse<ShortLinkStatsData>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shortlinks/${encodeURIComponent(code)}/stats?days=${days}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      return await this.handleResponse<ShortLinkStatsData>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  buildShortUrl(code: string): string {
    const origin = this.baseUrl || window.location.origin
    return `${origin}/s/${code}`
  }

  async copyShortUrl(code: string) {
    await navigator.clipboard.writeText(this.buildShortUrl(code))
  }

  formatDate(value?: string | null): string {
    if (!value) return '—'
    return new Date(value).toLocaleString('zh-CN', { hour12: false })
  }

  formatShortDate(value?: string | null): string {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('zh-CN')
  }

  statusOf(link: ShortLink): 'active' | 'paused' | 'expired' {
    if (!link.enabled) return 'paused'
    if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) return 'expired'
    return 'active'
  }

  statusLabel(status: string): string {
    return ({ active: '启用', paused: '停用', expired: '过期' } as Record<string, string>)[status] || status
  }
}

export const shortLinkService = new ShortLinkService()
export default shortLinkService
