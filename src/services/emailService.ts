// 邮件系统服务
export interface EmailConfig {
  emails: string[]
  question: string
  enabled: boolean
  updatedAt?: string
  // 新增邮件功能配置
  template?: EmailTemplate
  sendingOptions?: SendingOptions
}

export interface EmailTemplate {
  id?: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string
  variables?: Record<string, any>
}

export interface SendingOptions {
  priority?: 'high' | 'normal' | 'low'
  tags?: string[]
  headers?: Record<string, string>
  trackOpens?: boolean
  trackClicks?: boolean
  replyTo?: string
}

export interface EmailStats {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
}

export interface EmailTestResult {
  success: boolean
  message: string
  details?: any
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

class EmailService {
  private baseUrl = import.meta.env.DEV ? 'https://www.jisoolove.top/api/email' : '/api/email'

  /**
   * 获取邮件配置
   */
  async getConfig(): Promise<ApiResponse<EmailConfig>> {
    try {
      const url = `${this.baseUrl}/config`
      console.log('获取邮件配置 - 请求URL:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('获取邮件配置 - 响应状态:', response.status)
      console.log('获取邮件配置 - 响应头:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('获取邮件配置 - HTTP错误:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.error('获取邮件配置 - 非JSON响应:', responseText.substring(0, 200))
        throw new Error('服务器返回了非JSON格式的响应，可能是HTML页面')
      }

      const result = await response.json()
      console.log('获取邮件配置 - 成功:', result)
      return result
    } catch (error) {
      console.error('获取邮件配置失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 保存邮件配置
   */
  async saveConfig(config: EmailConfig, adminPassword: string): Promise<ApiResponse<EmailConfig>> {
    try {
      const url = `${this.baseUrl}/config`
      console.log('保存邮件配置 - 请求URL:', url)
      console.log('保存邮件配置 - 配置数据:', config)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify(config)
      })

      console.log('保存邮件配置 - 响应状态:', response.status)

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorMessage = `HTTP error! status: ${response.status}`

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}))
          errorMessage = errorData.error || errorMessage
        } else {
          const errorText = await response.text()
          console.error('保存邮件配置 - 非JSON错误响应:', errorText.substring(0, 200))
          errorMessage = '服务器返回了非JSON格式的错误响应'
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('保存邮件配置 - 成功:', result)
      return result
    } catch (error) {
      console.error('保存邮件配置失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 测试发送邮件
   */
  async testSend(adminPassword: string): Promise<ApiResponse<EmailTestResult>> {
    try {
      const url = `${this.baseUrl}/test`
      console.log('测试发送邮件 - 请求URL:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        }
      })

      console.log('测试发送邮件 - 响应状态:', response.status)

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorMessage = `HTTP error! status: ${response.status}`

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}))
          errorMessage = errorData.error || errorMessage
        } else {
          const errorText = await response.text()
          console.error('测试发送邮件 - 非JSON错误响应:', errorText.substring(0, 200))
          errorMessage = '服务器返回了非JSON格式的错误响应'
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('测试发送邮件 - 成功:', result)
      return result
    } catch (error) {
      console.error('测试发送邮件失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 验证邮箱格式
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }



  /**
   * 验证配置
   */
  validateConfig(config: EmailConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 验证邮箱
    if (!config.emails || config.emails.length === 0) {
      errors.push('请至少添加一个邮箱地址')
    } else {
      config.emails.forEach((email, index) => {
        if (!email || !this.validateEmail(email)) {
          errors.push(`第${index + 1}个邮箱格式不正确: ${email}`)
        }
      })
    }

    // 验证问题
    if (!config.question || config.question.trim().length === 0) {
      errors.push('请输入问题')
    } else if (config.question.trim().length < 5) {
      errors.push('问题内容太短，至少需要5个字符')
    } else if (config.question.trim().length > 500) {
      errors.push('问题内容太长，最多500个字符')
    }



    return {
      valid: errors.length === 0,
      errors
    }
  }





  /**
   * 重置今日邮件发送记录
   */
  async resetTodayEmailSent(): Promise<ApiResponse<any>> {
    try {
      // 使用调试端点，这是实际工作的端点
      const debugUrl = import.meta.env.DEV
        ? 'https://www.jisoolove.top/api/debug/reset-email-sent'
        : '/api/debug/reset-email-sent'

      console.log('重置今日发送记录 - 请求URL:', debugUrl)

      const response = await fetch(debugUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('重置今日发送记录 - 响应状态:', response.status)

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorMessage = `HTTP error! status: ${response.status}`

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}))
          errorMessage = errorData.error || errorMessage
        } else {
          const errorText = await response.text()
          console.error('重置今日发送记录 - 非JSON错误响应:', errorText.substring(0, 200))
          errorMessage = '服务器返回了非JSON格式的错误响应'
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('重置今日发送记录 - 成功:', result)
      return result
    } catch (error) {
      console.error('重置今日发送记录失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }



  /**
   * 获取管理员密码
   */
  getAdminPassword(): string {
    return localStorage.getItem('adminPassword') || 'jisoo521'
  }

  /**
   * 设置管理员密码
   */
  setAdminPassword(password: string): void {
    localStorage.setItem('adminPassword', password)
  }

  /**
   * 获取邮件发送统计
   */
  async getEmailStats(): Promise<ApiResponse<EmailStats>> {
    try {
      const url = `${this.baseUrl}/stats`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('获取邮件统计失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取邮件统计失败'
      }
    }
  }

  /**
   * 创建邮件模板
   */
  async createTemplate(template: EmailTemplate): Promise<ApiResponse<EmailTemplate>> {
    try {
      const url = `${this.baseUrl}/templates`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('创建邮件模板失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建邮件模板失败'
      }
    }
  }

  /**
   * 获取邮件模板列表
   */
  async getTemplates(): Promise<ApiResponse<EmailTemplate[]>> {
    try {
      const url = `${this.baseUrl}/templates`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('获取邮件模板失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取邮件模板失败'
      }
    }
  }
}

// 导出单例实例
export const emailService = new EmailService()
export default emailService
