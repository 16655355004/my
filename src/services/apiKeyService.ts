import { getApiBaseUrl, verifyAdminToken } from './adminAuthService'

// API密钥管理服务 - 与数据 API 交互
export interface ApiKey {
    id: number
    website: string // 官网 (服务名称)
    mainSite: string // 主站 (URL)
    apiKey: string // 秘钥
    balance: number // 余额
    currency?: string
    provider?: string
    logoUrl?: string
    balanceUpdatedAt?: string
    expiryDate: string // 有效期 (ISO date string)
    createdAt: string // 添加时间
    updatedAt?: string
}

export interface ApiKeyInput {
    website: string
    mainSite: string
    apiKey: string
    balance: number
    currency?: string
    provider?: string
    logoUrl?: string
    expiryDate: string
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
}

class ApiKeyService {
    private baseUrl: string
    private adminToken: string | null = null

    constructor() {
        // 在开发环境中使用完整URL，生产环境使用相对路径
        this.baseUrl = getApiBaseUrl()
    }

    // 设置管理员令牌
    setAdminToken(token: string) {
        this.adminToken = token
        localStorage.setItem('apikey_admin_token', token)
    }

    // 获取管理员令牌
    getAdminToken(): string | null {
        if (!this.adminToken) {
            this.adminToken = localStorage.getItem('apikey_admin_token')
        }
        return this.adminToken
    }

    // 清除管理员令牌
    clearAdminToken() {
        this.adminToken = null
        localStorage.removeItem('apikey_admin_token')
    }

    // 获取请求头
    private getHeaders(includeAuth: boolean = false): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        }

        if (includeAuth && this.getAdminToken()) {
            headers['Authorization'] = `Bearer ${this.getAdminToken()}`
        }

        return headers
    }

    // 处理 API 响应
    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
            const ray = response.headers.get('cf-ray')
            const reference = ray ? `，请求标识：${ray}` : ''
            const message = response.status >= 500
                ? '服务或网关返回了非 JSON 错误响应，需检查 Cloudflare Functions 日志及代理，不能据此判断密钥错误或接口未部署'
                : '接口返回了非 JSON 响应，请检查请求地址和服务响应'
            return { success: false, error: `HTTP ${response.status}：${message}${reference}` }
        }
        try {
            const data = await response.json() as ApiResponse<T>
            if (!response.ok && !data.error) {
                return { success: false, error: `请求失败：HTTP ${response.status}` }
            }
            return data
        } catch {
            return { success: false, error: `接口返回 ${response.status}，但响应格式无效` }
        }
    }

    // 秘钥掩码显示 - 显示前3个字符和后6个字符
    maskApiKey(key: string): string {
        if (!key || key.length <= 9) {
            return '••••••••'
        }
        const start = key.substring(0, 3)
        const end = key.substring(key.length - 6)
        return `${start}...${end}`
    }

    // 获取所有API密钥
    async getAllApiKeys(): Promise<ApiResponse<ApiKey[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/api/apikeys`, {
                method: 'GET',
                headers: this.getHeaders(true)
            })

            return await this.handleResponse<ApiKey[]>(response)
        } catch (error) {
            console.error('Failed to fetch API keys:', error)
            return {
                success: false,
                error: 'Network error'
            }
        }
    }

    // 获取单个API密钥
    async getApiKey(id: number): Promise<ApiResponse<ApiKey>> {
        try {
            const response = await fetch(`${this.baseUrl}/api/apikeys/${id}`, {
                method: 'GET',
                headers: this.getHeaders(true)
            })

            return await this.handleResponse<ApiKey>(response)
        } catch (error) {
            console.error('Failed to fetch API key:', error)
            return {
                success: false,
                error: 'Network error'
            }
        }
    }

    // 添加新API密钥
    async addApiKey(apiKey: ApiKeyInput): Promise<ApiResponse<ApiKey>> {
        try {
            const response = await fetch(`${this.baseUrl}/api/apikeys`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify(apiKey)
            })

            return await this.handleResponse<ApiKey>(response)
        } catch (error) {
            console.error('Failed to add API key:', error)
            return {
                success: false,
                error: 'Network error'
            }
        }
    }

    // 更新API密钥
    async updateApiKey(id: number, apiKey: Partial<ApiKey>): Promise<ApiResponse<ApiKey>> {
        try {
            const response = await fetch(`${this.baseUrl}/api/apikeys/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(true),
                body: JSON.stringify(apiKey)
            })

            return await this.handleResponse<ApiKey>(response)
        } catch (error) {
            console.error('Failed to update API key:', error)
            return {
                success: false,
                error: 'Network error'
            }
        }
    }

    // 删除API密钥
    async deleteApiKey(id: number): Promise<ApiResponse<ApiKey>> {
        try {
            const response = await fetch(`${this.baseUrl}/api/apikeys/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders(true)
            })

            return await this.handleResponse<ApiKey>(response)
        } catch (error) {
            console.error('Failed to delete API key:', error)
            return {
                success: false,
                error: 'Network error'
            }
        }
    }

    // 验证管理员密码
    async verifyAdminPassword(password: string): Promise<boolean> {
        const previousToken = this.getAdminToken()
        const nextToken = password.trim()
        this.setAdminToken(nextToken)

        try {
            const result = await verifyAdminToken(nextToken)
            if (!result.success) {
                if (previousToken && previousToken !== nextToken) this.setAdminToken(previousToken)
                else this.clearAdminToken()
                return false
            }
            return true
        } catch (error) {
            console.error('Failed to verify admin password:', error)
            if (previousToken && previousToken !== nextToken) this.setAdminToken(previousToken)
            else this.clearAdminToken()
            return false
        }
    }

    async refreshBalance(key: ApiKey): Promise<ApiResponse<Pick<ApiKey, 'balance' | 'currency' | 'balanceUpdatedAt'>>> {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 15000)
        try {
            const response = await fetch('https://api.deepseek.com/user/balance', {
                method: 'GET',
                headers: { Authorization: `Bearer ${key.apiKey.trim()}`, Accept: 'application/json' },
                credentials: 'omit',
                redirect: 'error',
                signal: controller.signal,
            })
            if (!response.ok) {
                const message = response.status === 401 ? 'DeepSeek 密钥无效或已失效' :
                    response.status === 429 ? 'DeepSeek 查询过于频繁，请稍后重试' : 'DeepSeek 官方余额查询失败'
                return { success: false, error: `${message}（HTTP ${response.status}）` }
            }
            const data: unknown = await response.json()
            if (!data || typeof data !== 'object' || !('balance_infos' in data) || !Array.isArray(data.balance_infos)) {
                return { success: false, error: 'DeepSeek 返回的余额数据格式无效' }
            }
            const balances = data.balance_infos.filter((item): item is { currency: string; total_balance: string } =>
                item && typeof item === 'object' && ['CNY', 'USD'].includes(item.currency) &&
                typeof item.total_balance === 'string' && item.total_balance.trim() !== '' &&
                Number.isFinite(Number(item.total_balance)))
            const balance = balances.find((item) => item.currency === key.currency) || balances[0]
            if (!balance) return { success: false, error: 'DeepSeek 未返回有效的账户余额' }
            return { success: true, data: {
                balance: Number(balance.total_balance), currency: balance.currency,
                balanceUpdatedAt: new Date().toISOString(),
            } }
        } catch {
            return { success: false, error: controller.signal.aborted ? 'DeepSeek 官方余额查询超时，原余额已保留' : '无法直连 DeepSeek 官方接口，请检查网络、代理或浏览器跨域提示' }
        } finally {
            clearTimeout(timer)
        }
    }

    // 检查密钥是否过期
    isExpired(expiryDate: string): boolean {
        const expiry = new Date(expiryDate)
        const now = new Date()
        return expiry < now
    }

    // 获取密钥状态
    getKeyStatus(expiryDate: string): 'active' | 'expiring' | 'expired' {
        if (!expiryDate) return 'active'
        const expiry = new Date(expiryDate)
        const now = new Date()
        const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry < 0) {
            return 'expired'
        } else if (daysUntilExpiry <= 7) {
            return 'expiring'
        } else {
            return 'active'
        }
    }

    // 格式化余额显示
    formatBalance(balance: number, currency = 'USD'): string {
        return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(balance)
    }
}

// 导出单例实例
export const apiKeyService = new ApiKeyService()
export default apiKeyService
