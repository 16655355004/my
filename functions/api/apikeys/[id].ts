import {
  jsonResponse,
  optionsResponse,
  requireAuth,
  type Env,
} from "../../_shared/shortlinks";
import {
  deleteApiKey,
  getApiKey,
  putApiKey,
  validateApiKey,
  type ApiKey,
} from "../../_shared/apikeys";

export const onRequestOptions: PagesFunction = async () => optionsResponse();

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const id = Number.parseInt(String(params.id), 10);
    if (Number.isNaN(id)) {
      return jsonResponse({ success: false, error: "Invalid ID" }, 400);
    }

    const authError = requireAuth(request, env);
    if (authError) return authError;

    const existing = await getApiKey(env, id);
    if (!existing) {
      return jsonResponse({ success: false, error: "API Key not found" }, 404);
    }

    const body = await request.json() as Partial<ApiKey>;
    const balanceSynced = body.balanceUpdatedAt !== undefined && body.balance !== undefined && body.currency !== undefined;
    if (balanceSynced && (typeof body.balanceUpdatedAt !== "string" || !Number.isFinite(Date.parse(body.balanceUpdatedAt)))) {
      return jsonResponse({ success: false, error: "余额更新时间无效" }, 400);
    }
    const updated: ApiKey = {
      ...existing,
      website: body.website ?? existing.website,
      mainSite: body.mainSite ?? existing.mainSite,
      apiKey: body.apiKey ?? existing.apiKey,
      balance: body.balance ?? existing.balance,
      currency: body.currency ?? existing.currency,
      provider: body.provider ?? existing.provider,
      logoUrl: body.logoUrl ?? existing.logoUrl,
      expiryDate: body.expiryDate ?? existing.expiryDate,
      id,
      updatedAt: new Date().toISOString(),
      balanceUpdatedAt: balanceSynced ? new Date().toISOString() :
        body.apiKey !== undefined && body.apiKey !== existing.apiKey ||
        body.balance !== undefined && body.balance !== existing.balance ||
        body.currency !== undefined && body.currency !== existing.currency ? undefined : existing.balanceUpdatedAt,
    };
    const validationError = validateApiKey(updated);
    if (validationError) return jsonResponse({ success: false, error: validationError }, 400);
    await putApiKey(env, updated);
    return jsonResponse({ success: true, data: updated });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const id = Number.parseInt(String(params.id), 10);
    if (Number.isNaN(id)) {
      return jsonResponse({ success: false, error: "Invalid ID" }, 400);
    }

    const authError = requireAuth(request, env);
    if (authError) return authError;

    const deleted = await deleteApiKey(env, id);
    if (!deleted) {
      return jsonResponse({ success: false, error: "API Key not found" }, 404);
    }

    return jsonResponse({ success: true, data: deleted });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
};
