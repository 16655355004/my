import {
  assertImagesBucket,
  getImageMeta,
  jsonResponse,
  optionsResponse,
  putImageMeta,
  requireAuth,
  type Env,
} from "../../_shared/images";

interface ImageUpdateBody {
  title?: string;
  alt?: string;
  tone?: string;
  order?: number;
}

const getId = (params: EventContext<Env, string, unknown>["params"]) => String(params.id || "");

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const id = getId(params);
    const image = await getImageMeta(env, id);
    if (!image || image.deletedAt) return jsonResponse({ success: false, error: "图片不存在" }, 404);

    const body = await request.json() as ImageUpdateBody;
    const nextImage = {
      ...image,
      title: body.title?.trim().slice(0, 60) || image.title,
      alt: body.alt?.trim().slice(0, 120) || image.alt,
      tone: body.tone?.trim().slice(0, 32) || image.tone,
      order: body.order ?? image.order,
      updatedAt: new Date().toISOString(),
    };

    await putImageMeta(env, nextImage);
    return jsonResponse({ success: true, data: nextImage });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const id = getId(params);
    const image = await getImageMeta(env, id);
    if (!image || image.deletedAt) return jsonResponse({ success: false, error: "图片不存在" }, 404);

    const now = new Date().toISOString();
    await Promise.all([
      assertImagesBucket(env).delete(image.r2Key),
      putImageMeta(env, { ...image, deletedAt: now, updatedAt: now }),
    ]);

    return jsonResponse({ success: true, data: { ...image, deletedAt: now, updatedAt: now } });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
