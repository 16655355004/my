import {
  jsonResponse,
  optionsResponse,
  requireAuth,
  type Env,
} from "../../_shared/shortlinks";
import {
  listApiKeys,
  nextApiKeyId,
  putApiKey,
  type ApiKey,
} from "../../_shared/apikeys";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    return jsonResponse({ success: true, data: await listApiKeys(env) });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    const body = await request.json() as Omit<ApiKey, "id" | "createdAt">;

    if (!body.website || !body.mainSite || !body.apiKey) {
      return jsonResponse({ success: false, error: "Missing required fields" }, 400);
    }

    const newKey: ApiKey = {
      ...body,
      id: await nextApiKeyId(env),
      balance: Number(body.balance) || 0,
      expiryDate: body.expiryDate || "",
      createdAt: new Date().toISOString(),
    };

    await putApiKey(env, newKey);
    return jsonResponse({ success: true, data: newKey });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
