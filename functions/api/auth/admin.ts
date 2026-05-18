import {
  jsonResponse,
  optionsResponse,
  verifyAuth,
  type Env,
} from "../../_shared/shortlinks";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!verifyAuth(request, env)) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  return jsonResponse({ success: true, data: { authenticated: true } });
};
