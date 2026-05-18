export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface AdminAuthData {
  authenticated: boolean
}

export const getApiBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'https://www.jisoolove.top' : '')

export const verifyAdminToken = async (token: string): Promise<ApiResponse<AdminAuthData>> => {
  const trimmedToken = token.trim()
  if (!trimmedToken) return { success: false, error: '请输入管理员密码' }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/admin`, {
      headers: { Authorization: `Bearer ${trimmedToken}` },
    })
    const result = await response.json() as ApiResponse<AdminAuthData>
    if (!response.ok && !result.error) return { success: false, error: 'Unauthorized' }
    return result
  } catch {
    return { success: false, error: '网络错误' }
  }
}
