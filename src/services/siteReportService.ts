export interface ReportItem {
  name: string
  value: number
}

export interface DailySiteReportSummary {
  date: string
  generatedAt: string
  visitors: number
  visits: number
  totalClicks: number
  topPath?: string
  topCountry?: string
}

export interface DailySiteReport {
  date: string
  generatedAt: string
  visitors: number
  visits: number
  topPaths: ReportItem[]
  countries: ReportItem[]
  cities: ReportItem[]
  referrers: ReportItem[]
  hourly: Array<{ hour: string; value: number }>
  responseTime: number
  shortlinks: {
    totalClicks: number
    uniqueVisitors: number
    topLinks: Array<ReportItem & { code: string }>
  }
  images: {
    total: number
    uploadedToday: number
  }
  messages: {
    total: number
    createdToday: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class SiteReportService {
  private baseUrl = import.meta.env.DEV ? 'https://www.jisoolove.top' : ''
  private token: string | null = null

  setAdminToken(token: string) {
    this.token = token
    localStorage.setItem('site_report_admin_token', token)
  }

  getAdminToken(): string | null {
    if (!this.token) this.token = localStorage.getItem('site_report_admin_token')
    return this.token
  }

  clearAdminToken() {
    this.token = null
    localStorage.removeItem('site_report_admin_token')
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    const token = this.getAdminToken()
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }

  private async handle<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      return await response.json()
    } catch {
      return { success: false, error: '响应解析失败' }
    }
  }

  async verifyAdminPassword(password: string): Promise<ApiResponse<{ reports: DailySiteReportSummary[] }>> {
    const previous = this.getAdminToken()
    this.setAdminToken(password)
    const result = await this.getReportSummaries(7)
    if (!result.success) {
      if (previous) this.setAdminToken(previous)
      else this.clearAdminToken()
    }
    return result
  }

  async getReportSummaries(days = 14): Promise<ApiResponse<{ reports: DailySiteReportSummary[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/statistics/reports?days=${days}`, { headers: this.headers() })
      return await this.handle<{ reports: DailySiteReportSummary[] }>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  async getDailyReport(date: string): Promise<ApiResponse<DailySiteReport>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/statistics/reports/${encodeURIComponent(date)}`, { headers: this.headers() })
      return await this.handle<DailySiteReport>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  async regenerateDailyReport(date: string): Promise<ApiResponse<DailySiteReport>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/statistics/reports/${encodeURIComponent(date)}`, {
        method: 'POST',
        headers: this.headers(),
      })
      return await this.handle<DailySiteReport>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }
}

export const siteReportService = new SiteReportService()
export default siteReportService
