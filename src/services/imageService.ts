export interface GalleryImage {
  id: string
  title: string
  alt: string
  tone: string
  url: string
  contentType: string
  size: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  order?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ImageUpdateInput {
  title?: string
  alt?: string
  tone?: string
  order?: number
}

class ImageService {
  private baseUrl = import.meta.env.DEV ? 'https://www.jisoolove.top' : ''
  private token: string | null = null

  setAdminToken(token: string) {
    this.token = token
    localStorage.setItem('image_admin_token', token)
  }

  getAdminToken(): string | null {
    if (!this.token) this.token = localStorage.getItem('image_admin_token')
    return this.token
  }

  clearAdminToken() {
    this.token = null
    localStorage.removeItem('image_admin_token')
  }

  private jsonHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    const token = this.getAdminToken()
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }

  private authHeaders(): HeadersInit {
    const headers: HeadersInit = {}
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

  async verifyAdminPassword(password: string): Promise<ApiResponse<GalleryImage>> {
    this.setAdminToken(password)
    return { success: true }
  }

  async getImages(): Promise<ApiResponse<{ images: GalleryImage[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/images`)
      return await this.handle<{ images: GalleryImage[] }>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  async uploadImage(file: File, input: ImageUpdateInput): Promise<ApiResponse<GalleryImage>> {
    try {
      const form = new FormData()
      form.set('file', file)
      if (input.title) form.set('title', input.title)
      if (input.alt) form.set('alt', input.alt)
      if (input.tone) form.set('tone', input.tone)
      if (input.order !== undefined) form.set('order', String(input.order))

      const response = await fetch(`${this.baseUrl}/api/images`, {
        method: 'POST',
        headers: this.authHeaders(),
        body: form,
      })
      return await this.handle<GalleryImage>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  async updateImage(id: string, input: ImageUpdateInput): Promise<ApiResponse<GalleryImage>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/images/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.jsonHeaders(),
        body: JSON.stringify(input),
      })
      return await this.handle<GalleryImage>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  async deleteImage(id: string): Promise<ApiResponse<GalleryImage>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/images/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.authHeaders(),
      })
      return await this.handle<GalleryImage>(response)
    } catch {
      return { success: false, error: '网络错误' }
    }
  }
}

export const imageService = new ImageService()
export default imageService
