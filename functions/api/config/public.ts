import {
  jsonResponse,
  optionsResponse,
  type Env,
} from "../../_shared/shortlinks";
import { isMediaGenerateEnabled } from "../../_shared/media";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return jsonResponse({
    success: true,
    data: {
      turnstileSiteKey: env.TURNSTILE_SITE_KEY?.trim() || null,
      imageGenerateEnabled: await isMediaGenerateEnabled(env),
    },
  });
};
