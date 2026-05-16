import {
  assertImagesBucket,
  getImageMeta,
  type Env,
} from "../_shared/images";

const getId = (params: EventContext<Env, string, unknown>["params"]) => String(params.id || "");

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const image = await getImageMeta(env, getId(params));
    if (!image || image.deletedAt) return new Response("Not found", { status: 404 });

    const object = await assertImagesBucket(env).get(image.r2Key);
    if (!object) return new Response("Not found", { status: 404 });

    return new Response(object.body, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": object.httpEtag,
      },
    });
  } catch (error) {
    return new Response((error as Error).message, { status: 500 });
  }
};
