import {
  assertImagesBucket,
  buildImageUrl,
  extensionFor,
  getImageIndex,
  jsonResponse,
  listImages,
  makeImageId,
  optionsResponse,
  putImageIndex,
  putImageMeta,
  requireAuth,
  validateImageFile,
  type Env,
  type ImageMeta,
} from "../../_shared/images";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const images = (await listImages(env)).map((image) => ({
      ...image,
      url: buildImageUrl(request, image.id),
    }));
    return jsonResponse({ success: true, data: { images } });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const bucket = assertImagesBucket(env);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonResponse({ success: false, error: "请选择图片文件" }, 400);

    const fileError = validateImageFile(file, env);
    if (fileError) return jsonResponse({ success: false, error: fileError }, 400);

    const id = makeImageId();
    const now = new Date().toISOString();
    const r2Key = `gallery/${id}.${extensionFor(file.type)}`;
    const arrayBuffer = await file.arrayBuffer();

    await bucket.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalName: file.name },
    });

    const image: ImageMeta = {
      id,
      title: String(form.get("title") || file.name.replace(/\.[^.]+$/, "") || "Untitled").trim().slice(0, 60),
      alt: String(form.get("alt") || form.get("title") || file.name || "Gallery image").trim().slice(0, 120),
      tone: String(form.get("tone") || "Cloudflare R2").trim().slice(0, 32),
      r2Key,
      contentType: file.type,
      size: file.size,
      url: buildImageUrl(request, id),
      createdAt: now,
      updatedAt: now,
      order: Number(form.get("order") || 0) || 0,
    };

    const index = await getImageIndex(env);
    await Promise.all([
      putImageMeta(env, image),
      putImageIndex(env, [id, ...index.ids]),
    ]);

    return jsonResponse({ success: true, data: image }, 201);
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
