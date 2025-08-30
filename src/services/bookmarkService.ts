// 书签服务 - 与 Cloudflare KV API 交互
export interface Website {
  id: number
  name: string
  description: string
  url: string
  icon: string
  category: string
  color: string
  createdAt?: string
  updatedAt?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 留言 API 响应的特殊结构
export interface MessagesApiResponse {
  success: boolean
  data?: {
    messages: Message[]
  }
  error?: string
}

class BookmarkService {
  private baseUrl: string
  private adminToken: string | null = null

  constructor() {
    // 使用空字符串作为baseUrl，因为所有的API调用都已经包含了/api前缀
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  }

  // 设置管理员令牌
  setAdminToken(token: string) {
    this.adminToken = token
    localStorage.setItem('admin_token', token)
  }

  // 获取管理员令牌
  getAdminToken(): string | null {
    if (!this.adminToken) {
      this.adminToken = localStorage.getItem('admin_token')
    }
    return this.adminToken
  }

  // 清除管理员令牌
  clearAdminToken() {
    this.adminToken = null
    localStorage.removeItem('admin_token')
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

  // 获取所有书签
  async getAllBookmarks(): Promise<ApiResponse<Website[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bookmarks`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      return await this.handleResponse<Website[]>(response)
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // 获取单个书签
  async getBookmark(id: number): Promise<ApiResponse<Website>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bookmarks/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      return await this.handleResponse<Website>(response)
    } catch (error) {
      console.error('Failed to fetch bookmark:', error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // 添加新书签
  async addBookmark(bookmark: Omit<Website, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Website>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bookmarks`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(bookmark)
      })

      return await this.handleResponse<Website>(response)
    } catch (error) {
      console.error('Failed to add bookmark:', error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // 更新书签
  async updateBookmark(id: number, bookmark: Partial<Website>): Promise<ApiResponse<Website>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bookmarks/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: JSON.stringify(bookmark)
      })

      return await this.handleResponse<Website>(response)
    } catch (error) {
      console.error('Failed to update bookmark:', error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // 删除书签
  async deleteBookmark(id: number): Promise<ApiResponse<Website>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bookmarks/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(true)
      })

      return await this.handleResponse<Website>(response)
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // 验证管理员密码
  async verifyAdminPassword(password: string): Promise<boolean> {
    try {
      // 临时设置令牌进行验证
      const tempToken = password
      const response = await fetch(`${this.baseUrl}/api/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          name: 'test',
          description: 'test',
          url: 'https://test.com',
          icon: '🔗',
          category: '测试',
          color: '#00d4ff'
        })
      })

      const result = await response.json()

      // 如果验证成功，删除测试数据
      if (result.success && result.data) {
        await fetch(`${this.baseUrl}/api/bookmarks/${result.data.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tempToken}`
          }
        })
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to verify admin password:', error)
      return false
    }
  }
}

// 留言接口定义
export interface Message {
  id: string
  name: string
  content: string
  createdAt: string
}

export interface MessageInput {
  name: string
  content: string
}

// 留言服务类
class MessageService {
  private baseUrl: string

  constructor() {
    // 使用与书签服务相同的基础URL
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://your-worker.your-subdomain.workers.dev'
  }

  // 获取请求头
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    }
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

  // 获取所有留言
  async getAllMessages(): Promise<MessagesApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/messages`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      return await this.handleResponse<{ messages: Message[] }>(response)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // 添加新留言
  async addMessage(message: MessageInput): Promise<ApiResponse<Message>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(message)
      })

      return await this.handleResponse<Message>(response)
    } catch (error) {
      console.error('Failed to add message:', error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }
}

// 导出单例实例
export const bookmarkService = new BookmarkService()
export const messageService = new MessageService()
