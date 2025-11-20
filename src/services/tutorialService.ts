/**
 * Tutorial Authentication Service
 * Handles password protection for the Cloudflare KV tutorial page
 */

class TutorialService {
  private tutorialToken: string | null = null
  private readonly TUTORIAL_PASSWORD = 'jisoo521'

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
  verifyTutorialPassword(password: string): boolean {
    return password === this.TUTORIAL_PASSWORD
  }

  // 检查是否已认证
  isAuthenticated(): boolean {
    const token = this.getTutorialToken()
    return token === this.TUTORIAL_PASSWORD
  }
}

// 导出单例实例
export const tutorialService = new TutorialService()
