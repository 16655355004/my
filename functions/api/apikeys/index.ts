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

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const { env } = context;

        // 获取所有 key
        // 假设我们将所有 api key 存储在一个名为 "apikeys" 的 KV 键中，值为 JSON 数组
        // 或者使用前缀 "apikey:" 存储每个 key
        // 为了简单起见，我们使用单个大 JSON 存储列表，因为数据量预计不大
        const keysJson = await env.MY_KV.get("apikeys_list");
        const keys: ApiKey[] = keysJson ? JSON.parse(keysJson) : [];

        return jsonResponse({ success: true, data: keys });
    } catch (err) {
        return jsonResponse({ success: false, error: err.message }, 500);
    }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { request, env } = context;

        // 验证权限
        // const isAuthenticated = await verifyAuth(request, env);
        // if (!isAuthenticated) {
        //   return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        // }

        const body = await request.json() as Omit<ApiKey, 'id' | 'createdAt'>;

        // 验证必填字段
        if (!body.website || !body.mainSite || !body.apiKey) {
            return jsonResponse({ success: false, error: 'Missing required fields' }, 400);
        }

        // 获取现有列表
        const keysJson = await env.MY_KV.get("apikeys_list");
        let keys: ApiKey[] = keysJson ? JSON.parse(keysJson) : [];

        // 生成新 ID
        const newId = keys.length > 0 ? Math.max(...keys.map(k => k.id)) + 1 : 1;

        const newKey: ApiKey = {
            ...body,
            id: newId,
            createdAt: new Date().toISOString()
        };

        keys.push(newKey);

        // 保存回 KV
        await env.MY_KV.put("apikeys_list", JSON.stringify(keys));

        return jsonResponse({ success: true, data: newKey });
    } catch (err) {
        return jsonResponse({ success: false, error: err.message }, 500);
    }
};
