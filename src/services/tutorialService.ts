import { getApiBaseUrl, verifyAdminToken } from './adminAuthService'

/**
 * Tutorial Authentication Service
 * Handles password protection for the KV tutorial page
 */

class TutorialService {
  private tutorialToken: string | null = null
  private baseUrl = getApiBaseUrl()

  // 设置教程令牌
  setTutorialToken(token: string) {
    this.tutorialToken = token
    localStorage.setItem('tutorial_token', token)
  }

  // 获取教程令牌
  getTutorialToken(): string | null {
    if (!this.tutorialToken) {
      this.tutorialToken = localStorage.getItem('tutorial_token')
    }
    return this.tutorialToken
  }

  // 清除教程令牌
  clearTutorialToken() {
    this.tutorialToken = null
    localStorage.removeItem('tutorial_token')
  }

  // 验证教程密码
  async verifyTutorialPassword(password: string): Promise<boolean> {
    const previousToken = this.getTutorialToken()
    const nextToken = password.trim()
    this.setTutorialToken(nextToken)

    const result = await verifyAdminToken(nextToken)
    if (!result.success) {
      if (previousToken && previousToken !== nextToken) this.setTutorialToken(previousToken)
      else this.clearTutorialToken()
      return false
    }
    return true
  }

  // 检查是否已认证
  async isAuthenticated(): Promise<boolean> {
    const token = this.getTutorialToken()
    if (!token) return false
    return this.verifyTutorialPassword(token)
  }
}

// 导出单例实例
export const tutorialService = new TutorialService()
