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
  validateApiKey,
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
      website: body.website.trim(),
      mainSite: body.mainSite.trim(),
      apiKey: body.apiKey.trim(),
      id: await nextApiKeyId(env),
      balance: body.balance ?? 0,
      currency: body.currency || "USD",
      provider: body.provider || "custom",
      logoUrl: body.logoUrl?.trim() || undefined,
      expiryDate: body.expiryDate || "",
      createdAt: new Date().toISOString(),
    };

    const validationError = validateApiKey(newKey);
    if (validationError) return jsonResponse({ success: false, error: validationError }, 400);
    await putApiKey(env, newKey);
    return jsonResponse({ success: true, data: newKey });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
