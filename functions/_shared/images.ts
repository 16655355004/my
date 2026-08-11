import {
  jsonResponse,
  optionsResponse,
  requireAuth,
  type Env,
} from "./shortlinks";
import { ensureSchema } from "./db";

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

type ImageRow = {
  id: string;
  title: string;
  alt: string;
  tone: string;
  r2_key: string;
  content_type: string;
  size: number;
  url: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sort_order: number;
};

export { jsonResponse, optionsResponse, requireAuth, type Env };

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

const rowToImage = (row: ImageRow): ImageMeta => ({
  id: row.id,
  title: row.title,
  alt: row.alt,
  tone: row.tone,
  r2Key: row.r2_key,
  contentType: row.content_type,
  size: row.size,
  url: row.url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at || undefined,
  order: row.sort_order,
});

export const getImageIndex = async (env: Env): Promise<ImageIndex> => {
  await ensureSchema(env);
  const { results } = await env.DB.prepare(
    "SELECT id FROM images WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC",
  ).all<{ id: string }>();
  return {
    ids: (results || []).map((row) => row.id),
    updatedAt: new Date().toISOString(),
  };
};

/** Index is derived from images table; kept for call-site compatibility. */
export const putImageIndex = async (_env: Env, _ids: string[]) => undefined;

export const getImageMeta = async (env: Env, id: string): Promise<ImageMeta | null> => {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT * FROM images WHERE id = ?").bind(id).first<ImageRow>();
  return row ? rowToImage(row) : null;
};

export const putImageMeta = async (env: Env, image: ImageMeta) => {
  await ensureSchema(env);
  await env.DB.prepare(`
    INSERT INTO images (
      id, title, alt, tone, r2_key, content_type, size, url,
      created_at, updated_at, deleted_at, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      alt = excluded.alt,
      tone = excluded.tone,
      r2_key = excluded.r2_key,
      content_type = excluded.content_type,
      size = excluded.size,
      url = excluded.url,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      sort_order = excluded.sort_order
  `).bind(
    image.id,
    image.title,
    image.alt,
    image.tone,
    image.r2Key,
    image.contentType,
    image.size,
    image.url,
    image.createdAt,
    image.updatedAt,
    image.deletedAt || null,
    image.order ?? 0,
  ).run();
};

export const listImages = async (env: Env): Promise<ImageMeta[]> => {
  await ensureSchema(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM images WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC",
  ).all<ImageRow>();
  return (results || []).map(rowToImage);
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
