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
    const updated: ApiKey = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
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
