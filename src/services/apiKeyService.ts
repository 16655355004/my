// API密钥管理服务 - 与 Cloudflare KV API 交互
export interface ApiKey {
    id: number
    website: string // 官网 (服务名称)
    mainSite: string // 主站 (URL)
    apiKey: string // 秘钥
    balance: number // 余额 ($)
    expiryDate: string // 有效期 (ISO date string)
    createdAt: string // 添加时间
    updatedAt?: string
}

export interface ApiKeyInput {
    website: string
    mainSite: string
    apiKey: string
    balance: number
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
        this.baseUrl = import.meta.env.DEV ? 'https://www.jisoolove.top' : ''
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
        try {
            const data = await response.json()
            return data
        } catch (error) {
            return {
                success: false,
                error: 'Failed to parse response'
            }
        }
    }

    // 秘钥掩码显示 - 显示前3个字符和后6个字符
    maskApiKey(key: string): string {
        if (!key || key.length <= 9) {
            return key
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
        // 直接验证密码
        return password === 'jisoo521'
    }

    // 检查密钥是否过期
    isExpired(expiryDate: string): boolean {
        const expiry = new Date(expiryDate)
        const now = new Date()
        return expiry < now
    }

    // 获取密钥状态
    getKeyStatus(expiryDate: string): 'active' | 'expiring' | 'expired' {
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
    formatBalance(balance: number): string {
        return `$${balance.toFixed(2)}`
    }
}

// 导出单例实例
export const apiKeyService = new ApiKeyService()
export default apiKeyService
