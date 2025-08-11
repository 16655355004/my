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

      // 留言 API 路由
      if (path.startsWith('/api/messages')) {
        return await handleMessagesAPI(request, env, corsHeaders);
      }

      // 统计 API 路由
      if (path.startsWith('/api/statistics')) {
        return await handleStatisticsAPI(request, env, corsHeaders);
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

// 处理留言 API 请求
async function handleMessagesAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split('/');

  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  switch (method) {
    case 'GET':
      // 获取所有留言
      return await getAllMessages(env, headers);

    case 'POST':
      // 添加新留言
      return await addMessage(request, env, headers);

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers
      });
  }
}

// 获取所有留言
async function getAllMessages(env, headers) {
  try {
    const messagesData = await env.BOOKMARKS_KV.get('messages');
    const messages = messagesData ? JSON.parse(messagesData) : [];

    return new Response(JSON.stringify({
      success: true,
      data: {
        messages: messages
      }
    }), { headers });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch messages'
    }), {
      status: 500,
      headers
    });
  }
}

// 添加新留言
async function addMessage(request, env, headers) {
  try {
    const messageData = await request.json();

    // 验证输入数据
    if (!messageData.name || !messageData.content) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Name and content are required'
      }), {
        status: 400,
        headers
      });
    }

    // 限制长度
    if (messageData.name.length > 20 || messageData.content.length > 500) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Name or content too long'
      }), {
        status: 400,
        headers
      });
    }

    // 获取现有留言
    const existingData = await env.BOOKMARKS_KV.get('messages');
    const messages = existingData ? JSON.parse(existingData) : [];

    // 生成唯一ID
    const generateId = () => {
      return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    };

    // 创建新留言
    const newMessage = {
      id: generateId(),
      name: messageData.name.trim(),
      content: messageData.content.trim(),
      createdAt: new Date().toISOString(),
    };

    messages.push(newMessage);

    // 保存到 KV (只保留最新的 100 条留言)
    const limitedMessages = messages.slice(-100);
    await env.BOOKMARKS_KV.put('messages', JSON.stringify(limitedMessages));

    return new Response(JSON.stringify({
      success: true,
      data: newMessage
    }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to add message'
    }), {
      status: 500,
      headers
    });
  }
}

// 处理统计 API 请求
async function handleStatisticsAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split('/');

  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  switch (method) {
    case 'GET':
      // 获取统计数据
      return await getStatistics(env, headers);

    case 'POST':
      // 记录访问者
      if (pathParts[3] === 'visit') {
        return await recordVisit(request, env, headers);
      }
      // 记录响应时间
      if (pathParts[3] === 'response-time') {
        return await recordResponseTime(request, env, headers);
      }
      break;

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers
      });
  }

  return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
    status: 400,
    headers
  });
}

// 获取统计数据
async function getStatistics(env, headers) {
  try {
    // 获取网站启动时间
    let siteStartTime = await env.BOOKMARKS_KV.get('site_start_time');
    if (!siteStartTime) {
      siteStartTime = new Date().toISOString();
      await env.BOOKMARKS_KV.put('site_start_time', siteStartTime);
    }

    // 检查启动时间是否合理（不能超过30天前）
    const checkStartTime = new Date(siteStartTime);
    const checkNow = new Date();
    const maxDays = 30;
    const maxMs = maxDays * 24 * 60 * 60 * 1000;

    if (checkNow.getTime() - checkStartTime.getTime() > maxMs) {
      // 如果超过30天，重置为当前时间
      siteStartTime = new Date().toISOString();
      await env.BOOKMARKS_KV.put('site_start_time', siteStartTime);
    }

    // 获取访问者数据
    const visitorsData = await env.BOOKMARKS_KV.get('visitors_data');
    const visitors = visitorsData ? JSON.parse(visitorsData) : {
      totalVisitors: 0,
      todayVisitors: 0,
      lastResetDate: new Date().toISOString().split('T')[0]
    };

    // 检查是否需要重置今日访问者数量
    const today = new Date().toISOString().split('T')[0];
    if (visitors.lastResetDate !== today) {
      visitors.todayVisitors = 0;
      visitors.lastResetDate = today;
      await env.BOOKMARKS_KV.put('visitors_data', JSON.stringify(visitors));
    }

    // 获取平均响应时间
    const responseTimeData = await env.BOOKMARKS_KV.get('response_times');
    const responseTimes = responseTimeData ? JSON.parse(responseTimeData) : [];
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0;

    // 计算运行时间
    const startTime = new Date(siteStartTime);
    const now = new Date();
    const uptimeMs = now.getTime() - startTime.getTime();

    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

    const statistics = {
      totalVisitors: visitors.totalVisitors,
      todayVisitors: visitors.todayVisitors,
      responseTime: avgResponseTime,
      uptime: {
        days,
        hours,
        minutes,
        formatted: `${days}天 ${hours}小时 ${minutes}分钟`
      },
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      data: statistics
    }), { headers });
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch statistics'
    }), {
      status: 500,
      headers
    });
  }
}

// 记录访问者
async function recordVisit(request, env, headers) {
  try {
    const visitData = await request.json();
    const { visitorId, isNewVisitor } = visitData;

    if (!visitorId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Visitor ID is required'
      }), {
        status: 400,
        headers
      });
    }

    // 获取当前访问者数据
    const visitorsData = await env.BOOKMARKS_KV.get('visitors_data');
    const visitors = visitorsData ? JSON.parse(visitorsData) : {
      totalVisitors: 0,
      todayVisitors: 0,
      lastResetDate: new Date().toISOString().split('T')[0]
    };

    // 检查是否需要重置今日访问者数量
    const today = new Date().toISOString().split('T')[0];
    if (visitors.lastResetDate !== today) {
      visitors.todayVisitors = 0;
      visitors.lastResetDate = today;
    }

    // 检查是否是新访问者
    const visitorKey = `visitor:${visitorId}`;
    const existingVisitor = await env.BOOKMARKS_KV.get(visitorKey);

    if (!existingVisitor && isNewVisitor) {
      // 新访问者
      visitors.totalVisitors += 1;
      visitors.todayVisitors += 1;

      // 记录访问者信息（24小时过期）
      await env.BOOKMARKS_KV.put(visitorKey, JSON.stringify({
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString()
      }), {
        expirationTtl: 86400 // 24小时
      });
    } else if (existingVisitor) {
      // 更新现有访问者的最后访问时间
      const visitorInfo = JSON.parse(existingVisitor);
      visitorInfo.lastVisit = new Date().toISOString();

      await env.BOOKMARKS_KV.put(visitorKey, JSON.stringify(visitorInfo), {
        expirationTtl: 86400 // 24小时
      });
    }

    // 保存更新后的访问者数据
    await env.BOOKMARKS_KV.put('visitors_data', JSON.stringify(visitors));

    return new Response(JSON.stringify({
      success: true,
      data: {
        totalVisitors: visitors.totalVisitors,
        todayVisitors: visitors.todayVisitors
      }
    }), { headers });
  } catch (error) {
    console.error('Failed to record visit:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to record visit'
    }), {
      status: 500,
      headers
    });
  }
}

// 记录响应时间
async function recordResponseTime(request, env, headers) {
  try {
    const { responseTime } = await request.json();

    if (typeof responseTime !== 'number' || responseTime < 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid response time is required'
      }), {
        status: 400,
        headers
      });
    }

    // 获取现有响应时间数据
    const responseTimeData = await env.BOOKMARKS_KV.get('response_times');
    const responseTimes = responseTimeData ? JSON.parse(responseTimeData) : [];

    // 添加新的响应时间（只保留最近100个记录）
    responseTimes.push(responseTime);
    if (responseTimes.length > 100) {
      responseTimes.shift(); // 移除最旧的记录
    }

    // 保存更新后的响应时间数据
    await env.BOOKMARKS_KV.put('response_times', JSON.stringify(responseTimes));

    // 计算平均响应时间
    const avgResponseTime = Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);

    return new Response(JSON.stringify({
      success: true,
      data: {
        averageResponseTime: avgResponseTime,
        currentResponseTime: responseTime
      }
    }), { headers });
  } catch (error) {
    console.error('Failed to record response time:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to record response time'
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
