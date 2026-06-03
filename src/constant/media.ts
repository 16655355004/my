export const MEDIA_API_BASE = "https://newapi.prorisehub.com";

export const IMAGE_MODELS = [
  { value: "qwen-image-2", label: "Qwen Image 2", price: "¥0.03" },
  { value: "byte-plus-seedream-5-lite", label: "Seedream 5 Lite", price: "¥0.03" },
  { value: "nano-banana", label: "Nano Banana", price: "¥0.04" },
  { value: "flux-2-pro", label: "Flux 2 Pro", price: "¥0.08" },
  { value: "nano-banana-2", label: "Nano Banana 2", price: "¥0.16" },
] as const;

export const IMAGE_ASPECT_RATIOS = [
  { value: "9:16", label: "竖屏 9:16" },
  { value: "3:4", label: "竖屏 3:4" },
  { value: "1:1", label: "方形 1:1" },
  { value: "16:9", label: "横屏 16:9" },
  { value: "4:3", label: "横屏 4:3" },
] as const;

export const IMAGE_QUALITY_OPTIONS = [
  { value: "medium", label: "标准" },
  { value: "high", label: "高清" },
  { value: "low", label: "快速" },
] as const;

export const IMAGE_STYLE_PROMPTS: Record<string, string> = {
  anime: "anime style, cel shading, soft lighting, detailed, vibrant colors",
  illustration: "digital illustration, clean lines, rich details",
  pixel: "pixel art style, retro game aesthetic",
  watercolor: "watercolor painting style, soft edges, pastel tones",
};

export const DEFAULT_IMAGE_MODEL = IMAGE_MODELS[0].value;
export const DEFAULT_ASPECT_RATIO = IMAGE_ASPECT_RATIOS[0].value;
export const DEFAULT_IMAGE_QUALITY = IMAGE_QUALITY_OPTIONS[0].value;
