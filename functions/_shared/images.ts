import {
  jsonResponse,
  optionsResponse,
  requireAuth,
  type Env,
} from "./shortlinks";

export interface ImageMeta {
  id: string;
  title: string;
  alt: string;
  tone: string;
  r2Key: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  order?: number;
}

interface ImageIndex {
  ids: string[];
  updatedAt: string;
}

export { jsonResponse, optionsResponse, requireAuth, type Env };

const indexKey = "images:index";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export const getImageIndex = async (env: Env): Promise<ImageIndex> => {
  const json = await env.MY_KV.get(indexKey);
  if (!json) return { ids: [], updatedAt: new Date().toISOString() };
  try {
    const parsed = JSON.parse(json) as ImageIndex;
    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { ids: [], updatedAt: new Date().toISOString() };
  }
};

export const putImageIndex = async (env: Env, ids: string[]) => {
  await env.MY_KV.put(indexKey, JSON.stringify({
    ids: Array.from(new Set(ids)),
    updatedAt: new Date().toISOString(),
  }));
};

export const getImageMeta = async (env: Env, id: string): Promise<ImageMeta | null> => {
  const json = await env.MY_KV.get(`image:meta:${id}`);
  if (!json) return null;
  return JSON.parse(json) as ImageMeta;
};

export const putImageMeta = async (env: Env, image: ImageMeta) => {
  await env.MY_KV.put(`image:meta:${image.id}`, JSON.stringify(image));
};

export const listImages = async (env: Env): Promise<ImageMeta[]> => {
  const index = await getImageIndex(env);
  const images = (await Promise.all(index.ids.map((id) => getImageMeta(env, id)))).filter(Boolean) as ImageMeta[];
  return images
    .filter((image) => !image.deletedAt)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || right.createdAt.localeCompare(left.createdAt));
};

export const assertImagesBucket = (env: Env): R2Bucket => {
  if (!env.IMAGES_BUCKET) throw new Error("IMAGES_BUCKET 未绑定");
  return env.IMAGES_BUCKET;
};

export const validateImageFile = (file: File, env: Env): string | null => {
  const maxBytes = Number(env.IMAGE_MAX_BYTES || 5 * 1024 * 1024);
  if (!allowedTypes.has(file.type)) return "只支持 JPG、PNG、WebP、GIF 或 AVIF 图片";
  if (file.size > maxBytes) return `图片不能超过 ${Math.round(maxBytes / 1024 / 1024)}MB`;
  return null;
};

export const buildImageUrl = (request: Request, id: string) => `${new URL(request.url).origin}/i/${id}`;

export const makeImageId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

export const extensionFor = (contentType: string) => ({
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
} as Record<string, string>)[contentType] || "bin";
