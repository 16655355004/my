// Cloudflare Worker for Bookmarks API
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS 头设置
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理 OPTIONS 请求（预检请求）
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API 路由
      if (path.startsWith('/api/bookmarks')) {
        return await handleBookmarksAPI(request, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// 处理书签 API 请求
async function handleBookmarksAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split('/');
  
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  switch (method) {
    case 'GET':
      // 获取所有书签
      if (pathParts[3] === undefined) {
        return await getAllBookmarks(env, headers);
      }
      // 获取单个书签
      else {
        const id = pathParts[3];
        return await getBookmark(env, id, headers);
      }

    case 'POST':
      // 添加新书签
      return await addBookmark(request, env, headers);

    case 'PUT':
      // 更新书签
      const updateId = pathParts[3];
      return await updateBookmark(request, env, updateId, headers);

    case 'DELETE':
      // 删除书签
      const deleteId = pathParts[3];
      return await deleteBookmark(request, env, deleteId, headers);

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers
      });
  }
}

// 获取所有书签
async function getAllBookmarks(env, headers) {
  try {
    const bookmarksData = await env.BOOKMARKS_KV.get('bookmarks');
    const bookmarks = bookmarksData ? JSON.parse(bookmarksData) : [];
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: bookmarks 
    }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch bookmarks' 
    }), { 
      status: 500, 
      headers 
    });
  }
}

// 获取单个书签
async function getBookmark(env, id, headers) {
  try {
    const bookmarksData = await env.BOOKMARKS_KV.get('bookmarks');
    const bookmarks = bookmarksData ? JSON.parse(bookmarksData) : [];
    const bookmark = bookmarks.find(b => b.id === parseInt(id));
    
    if (!bookmark) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Bookmark not found' 
      }), { 
        status: 404, 
        headers 
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: bookmark 
    }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch bookmark' 
    }), { 
      status: 500, 
      headers 
    });
  }
}

// 添加新书签
async function addBookmark(request, env, headers) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify(authResult), { 
        status: 401, 
        headers 
      });
    }

    const newBookmark = await request.json();
    
    // 验证必填字段
    if (!newBookmark.name || !newBookmark.url || !newBookmark.description) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: name, url, description' 
      }), { 
        status: 400, 
        headers 
      });
    }

    const bookmarksData = await env.BOOKMARKS_KV.get('bookmarks');
    const bookmarks = bookmarksData ? JSON.parse(bookmarksData) : [];
    
    // 生成新 ID
    const newId = bookmarks.length > 0 ? Math.max(...bookmarks.map(b => b.id)) + 1 : 1;
    
    const bookmark = {
      id: newId,
      name: newBookmark.name,
      description: newBookmark.description,
      url: newBookmark.url,
      icon: newBookmark.icon || '🔗',
      category: newBookmark.category || '其他',
      color: newBookmark.color || '#00d4ff',
      createdAt: new Date().toISOString()
    };
    
    bookmarks.push(bookmark);
    await env.BOOKMARKS_KV.put('bookmarks', JSON.stringify(bookmarks));
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: bookmark 
    }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to add bookmark' 
    }), { 
      status: 500, 
      headers 
    });
  }
}

// 更新书签
async function updateBookmark(request, env, id, headers) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify(authResult), { 
        status: 401, 
        headers 
      });
    }

    const updateData = await request.json();
    const bookmarksData = await env.BOOKMARKS_KV.get('bookmarks');
    const bookmarks = bookmarksData ? JSON.parse(bookmarksData) : [];
    
    const bookmarkIndex = bookmarks.findIndex(b => b.id === parseInt(id));
    if (bookmarkIndex === -1) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Bookmark not found' 
      }), { 
        status: 404, 
        headers 
      });
    }
    
    // 更新书签数据
    bookmarks[bookmarkIndex] = {
      ...bookmarks[bookmarkIndex],
      ...updateData,
      id: parseInt(id), // 确保 ID 不被修改
      updatedAt: new Date().toISOString()
    };
    
    await env.BOOKMARKS_KV.put('bookmarks', JSON.stringify(bookmarks));
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: bookmarks[bookmarkIndex] 
    }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to update bookmark' 
    }), { 
      status: 500, 
      headers 
    });
  }
}

// 删除书签
async function deleteBookmark(request, env, id, headers) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify(authResult), { 
        status: 401, 
        headers 
      });
    }

    const bookmarksData = await env.BOOKMARKS_KV.get('bookmarks');
    const bookmarks = bookmarksData ? JSON.parse(bookmarksData) : [];
    
    const bookmarkIndex = bookmarks.findIndex(b => b.id === parseInt(id));
    if (bookmarkIndex === -1) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Bookmark not found' 
      }), { 
        status: 404, 
        headers 
      });
    }
    
    const deletedBookmark = bookmarks.splice(bookmarkIndex, 1)[0];
    await env.BOOKMARKS_KV.put('bookmarks', JSON.stringify(bookmarks));
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: deletedBookmark 
    }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to delete bookmark' 
    }), { 
      status: 500, 
      headers 
    });
  }
}

// 验证管理员权限
async function verifyAdmin(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Missing or invalid authorization header' };
  }
  
  const token = authHeader.substring(7); // 移除 "Bearer " 前缀
  
  if (token !== env.ADMIN_PASSWORD) {
    return { success: false, error: 'Invalid admin password' };
  }
  
  return { success: true };
}
