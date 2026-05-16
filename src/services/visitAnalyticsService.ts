export interface AccessLogEntry {
  id: string
  time: string
  method: string
  path: string
  status: number
  ip: string
  country: string
  region: string
  city: string
  latitude: number | null
  longitude: number | null
  colo: string
  userAgent: string
  referer: string
}

export interface AccessAnalytics {
  total: number
  countries: Array<{ name: string; value: number }>
  chinaCities: Array<{ name: string; value: [number, number, number] }>
  geoPoints: Array<{ name: string; value: [number, number, number] }>
  chinaHeatmap: Array<[number, number, number]>
  topPaths: Array<{ name: string; value: number }>
  hourly: Array<{ hour: string; value: number }>
  updatedAt: string
  recent: AccessLogEntry[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class VisitAnalyticsService {
  private baseUrl = import.meta.env.DEV ? 'https://www.jisoolove.top' : ''

  async getAnalytics(): Promise<ApiResponse<AccessAnalytics>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/statistics/analytics`)
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` }
      return await response.json()
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
}

export const visitAnalyticsService = new VisitAnalyticsService()
