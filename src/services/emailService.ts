// 邮件系统服务
export interface EmailConfig {
  emails: string[]
  question: string
  sendTime: string
  timezone: string
  enabled: boolean
  updatedAt?: string
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
   * 验证时间格式
   */
  validateTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
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

    // 验证时间
    if (!config.sendTime || !this.validateTime(config.sendTime)) {
      errors.push('请设置正确的发送时间格式 (HH:MM)')
    }

    // 验证时区
    if (!config.timezone) {
      errors.push('请设置时区')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 格式化时间显示
   */
  formatTime(time: string): string {
    if (!time || !this.validateTime(time)) {
      return '未设置'
    }

    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const minute = parseInt(minutes, 10)

    const period = hour >= 12 ? '下午' : '上午'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

    return `${period} ${displayHour}:${minute.toString().padStart(2, '0')}`
  }

  /**
   * 获取当前北京时间
   */
  getCurrentBeijingTime(): string {
    const now = new Date()
    const beijingTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }))

    const hours = beijingTime.getHours().toString().padStart(2, '0')
    const minutes = beijingTime.getMinutes().toString().padStart(2, '0')

    return `${hours}:${minutes}`
  }

  /**
   * 获取北京时间（UTC+8）- 与Worker保持一致的算法
   */
  private getBeijingWallClock(date = new Date()) {
    const pad = (n: number) => n.toString().padStart(2, '0')
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60000
    const bjMs = utcMs + 8 * 60 * 60000
    const bjDate = new Date(bjMs)
    const hours = bjDate.getUTCHours()
    const minutes = bjDate.getUTCMinutes()
    const minutesOfDay = hours * 60 + minutes
    const timeString = `${pad(hours)}:${pad(minutes)}`
    const dateString = `${bjDate.getUTCFullYear()}-${pad(bjDate.getUTCMonth() + 1)}-${pad(bjDate.getUTCDate())}`
    return { hours, minutes, minutesOfDay, timeString, dateString, date: bjDate }
  }

  /**
   * 重置今日邮件发送记录
   */
  async resetTodayEmailSent(): Promise<ApiResponse<any>> {
    try {
      const url = `${this.baseUrl.replace('/email', '')}/debug/reset-email-sent`
      console.log('重置今日发送记录 - 请求URL:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('重置今日发送记录 - 响应状态:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('重置今日发送记录 - HTTP错误:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
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
   * 计算距离下次发送的时间
   */
  getTimeUntilNextSend(sendTime: string): string {
    if (!sendTime || !this.validateTime(sendTime)) {
      return '未设置发送时间'
    }

    const now = new Date()
    const bj = this.getBeijingWallClock(now)
    const beijingTime = bj.date

    const [sendHour, sendMinute] = sendTime.split(':').map(Number)

    const nextSend = new Date(beijingTime)
    nextSend.setHours(sendHour, sendMinute, 0, 0)

    // 如果今天的发送时间已过，设置为明天
    if (nextSend <= beijingTime) {
      nextSend.setDate(nextSend.getDate() + 1)
    }

    const diff = nextSend.getTime() - beijingTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}小时${minutes}分钟后`
    } else {
      return `${minutes}分钟后`
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
}

// 导出单例实例
export const emailService = new EmailService()
export default emailService
