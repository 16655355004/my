import { getApiBaseUrl } from "./adminAuthService";
import { IMAGE_GENERATE_TIMEOUT_MS } from "../constant/media";

export interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  aspectRatio?: string;
  quality?: string;
  style?: string;
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
        signal: AbortSignal.timeout(IMAGE_GENERATE_TIMEOUT_MS + 5_000),
      });

      const payload = await response.json().catch(() => null) as ApiResponse<GeneratedImage> | null;
      if (!payload) {
        if (response.status === 524) {
          return { success: false, error: "生图超时，请稍后重试或换更小模型" };
        }
        return { success: false, error: "响应解析失败" };
      }
      if (!response.ok && !payload.error) {
        return { success: false, error: `请求失败 (${response.status})` };
      }
      return payload;
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        return { success: false, error: "生图超时（超过 300 秒），请稍后重试" };
      }
      return { success: false, error: "网络异常，请稍后重试" };
    }
  }
}

export default new ImageGenerateService();
