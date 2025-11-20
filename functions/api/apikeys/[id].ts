interface Env {
    MY_KV: KVNamespace;
    ADMIN_PASSWORD?: string;
}

interface ApiKey {
    id: number;
    website: string;
    mainSite: string;
    apiKey: string;
    balance: number;
    expiryDate: string;
    createdAt: string;
    updatedAt?: string;
}

// 辅助函数：生成响应
const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
};

// 辅助函数：验证管理员令牌
const verifyAuth = (request: Request, env: Env): boolean => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.split(' ')[1];
    // Use configured password or fallback to "admin"
    const expectedPassword = env.ADMIN_PASSWORD || "admin";

    return token === expectedPassword;
};

export const onRequestOptions: PagesFunction = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
    try {
        const { request, env, params } = context;
        const id = parseInt(params.id as string);

        if (isNaN(id)) {
            return jsonResponse({ success: false, error: 'Invalid ID' }, 400);
        }

        // 验证权限
        // const isAuthenticated = verifyAuth(request, env);
        // if (!isAuthenticated) {
        //   return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        // }

        const body = await request.json() as Partial<ApiKey>;

        // 获取现有列表
        const keysJson = await env.MY_KV.get("apikeys_list");
        let keys: ApiKey[] = keysJson ? JSON.parse(keysJson) : [];

        const index = keys.findIndex(k => k.id === id);
        if (index === -1) {
            return jsonResponse({ success: false, error: 'API Key not found' }, 404);
        }

        // 更新字段
        keys[index] = {
            ...keys[index],
            ...body,
            updatedAt: new Date().toISOString()
        };

        // 保存回 KV
        await env.MY_KV.put("apikeys_list", JSON.stringify(keys));

        return jsonResponse({ success: true, data: keys[index] });
    } catch (err) {
        return jsonResponse({ success: false, error: (err as Error).message }, 500);
    }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
    try {
        const { env, params } = context;
        const id = parseInt(params.id as string);

        if (isNaN(id)) {
            return jsonResponse({ success: false, error: 'Invalid ID' }, 400);
        }

        // 验证权限
        // const isAuthenticated = verifyAuth(request, env);
        // if (!isAuthenticated) {
        //   return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        // }

        // 获取现有列表
        const keysJson = await env.MY_KV.get("apikeys_list");
        let keys: ApiKey[] = keysJson ? JSON.parse(keysJson) : [];

        const index = keys.findIndex(k => k.id === id);
        if (index === -1) {
            return jsonResponse({ success: false, error: 'API Key not found' }, 404);
        }

        const deletedKey = keys[index];

        // 删除
        keys.splice(index, 1);

        // 保存回 KV
        await env.MY_KV.put("apikeys_list", JSON.stringify(keys));

        return jsonResponse({ success: true, data: deletedKey });
    } catch (err) {
        return jsonResponse({ success: false, error: (err as Error).message }, 500);
    }
};
