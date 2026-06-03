import {
  jsonResponse,
  optionsResponse,
  type Env,
} from "../../_shared/shortlinks";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return jsonResponse({
    success: true,
    data: {
      turnstileSiteKey: env.TURNSTILE_SITE_KEY?.trim() || null,
      imageGenerateEnabled: Boolean(env.MEDIA_API_KEY?.trim()),
    },
  });
};
