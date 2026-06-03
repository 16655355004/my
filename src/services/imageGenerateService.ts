import { getApiBaseUrl } from "./adminAuthService";

export interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  aspectRatio?: string;
  quality?: string;
  style?: string;
  turnstileToken?: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  model?: string;
  aspectRatio?: string;
  quality?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ImageGenerateService {
  private baseUrl = getApiBaseUrl();

  async generateImage(params: GenerateImageParams): Promise<ApiResponse<GeneratedImage>> {
    if (!params.prompt.trim()) {
      return { success: false, error: "请输入画面描述" };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/image/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const payload = await response.json().catch(() => null) as ApiResponse<GeneratedImage> | null;
      if (!payload) return { success: false, error: "响应解析失败" };
      if (!response.ok && !payload.error) {
        return { success: false, error: `请求失败 (${response.status})` };
      }
      return payload;
    } catch {
      return { success: false, error: "网络异常，请稍后重试" };
    }
  }
}

export default new ImageGenerateService();
