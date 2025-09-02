// Cloudflare Worker for Bookmarks API and Email System
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 头设置
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
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

      // 邮件系统 API 路由
      if (path.startsWith('/api/email')) {
        return await handleEmailAPI(request, env, corsHeaders);
      }

      // 调试路由 - 手动触发定时任务检查
      if (path === '/api/debug/trigger-email-check') {
        return await handleDebugEmailTrigger(request, env, corsHeaders);
      }

      // 调试路由 - 显示时间信息
      if (path === '/api/debug/time-info') {
        return await handleDebugTimeInfo(request, env, corsHeaders);
      }

      // 调试路由 - 重置今日邮件发送记录
      if (path === '/api/debug/reset-email-sent') {
        return await handleDebugResetEmailSent(request, env, corsHeaders);
      }

      // 调试路由 - 查看邮件系统状态
      if (path === '/api/debug/email-status') {
        return await handleDebugEmailStatus(request, env, corsHeaders);
      }

      // 调试路由 - 检查 Cron 执行状态
      if (path === '/api/debug/cron-status') {
        return await handleDebugCronStatus(request, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  // Cron 触发器处理定时任务
  scheduled(event, env, _ctx) {
    try {
      const ts = new Date().toISOString();
      const bj = getBeijingTime();
      console.log('=== CRON TRIGGER START ===');
      console.log('UTC time:', ts);
      console.log('Beijing time:', bj.dateString, bj.timeString);
      console.log('Cron schedule: */2 * * * * (every 2 minutes)');

      // 记录 cron 执行
      event.waitUntil(recordCronExecution(env, ts));

      // Use waitUntil so the runtime keeps the task alive even if this handler returns
      event.waitUntil(handleScheduledEmail(env));
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  }
};

// Helper: get Beijing time information using toLocaleString (更简单可靠)
function getBeijingTime(date = new Date()) {
  // 使用 toLocaleString 获取北京时间
  const beijingDateStr = date.toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const beijingTimeStr = date.toLocaleTimeString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // 解析时间
  const [hours, minutes] = beijingTimeStr.split(':').map(Number);
  const minutesOfDay = hours * 60 + minutes;

  return {
    hours,
    minutes,
    minutesOfDay,
    timeString: beijingTimeStr,
    dateString: beijingDateStr.replace(/\//g, '-') // 转换为 YYYY-MM-DD 格式
  };
}


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
  const method = request.method;

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
      return Date.now().toString() + Math.random().toString(36).substring(2, 11);
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
      // 重置响应时间数据
      if (pathParts[3] === 'reset-response-time') {
        return await resetResponseTimeData(env, headers);
      }
      // 重置网站启动时间
      if (pathParts[3] === 'reset-start-time') {
        return await resetStartTime(env, headers);
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
      // 设置一个合理的初始启动时间（比如1天前）
      const initialStartTime = new Date();
      initialStartTime.setDate(initialStartTime.getDate() - 1);
      siteStartTime = initialStartTime.toISOString();
      await env.BOOKMARKS_KV.put('site_start_time', siteStartTime);
      console.log('Initialized site start time:', siteStartTime);
    }

    // 检查启动时间是否合理（不能超过30天前，不能是未来时间）
    const checkStartTime = new Date(siteStartTime);
    const checkNow = new Date();
    const maxDays = 30;
    const maxMs = maxDays * 24 * 60 * 60 * 1000;

    if (checkNow.getTime() - checkStartTime.getTime() > maxMs || checkStartTime.getTime() > checkNow.getTime()) {
      // 如果超过30天或者是未来时间，重置为1天前
      const resetStartTime = new Date();
      resetStartTime.setDate(resetStartTime.getDate() - 1);
      siteStartTime = resetStartTime.toISOString();
      await env.BOOKMARKS_KV.put('site_start_time', siteStartTime);
      console.log('Reset site start time:', siteStartTime);
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

// 重置响应时间数据
async function resetResponseTimeData(env, headers) {
  try {
    // 清除KV中的响应时间数据
    await env.BOOKMARKS_KV.delete('response_times');

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: 'Response time data has been reset successfully'
      }
    }), { headers });
  } catch (error) {
    console.error('Failed to reset response time data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to reset response time data'
    }), {
      status: 500,
      headers
    });
  }
}

// 重置网站启动时间
async function resetStartTime(env, headers) {
  try {
    // 设置启动时间为当前时间
    const currentTime = new Date().toISOString();
    await env.BOOKMARKS_KV.put('site_start_time', currentTime);
    console.log('Manual reset site start time to:', currentTime);

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: 'Site start time has been reset successfully',
        newStartTime: currentTime
      }
    }), { headers });
  } catch (error) {
    console.error('Failed to reset start time:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to reset start time'
    }), {
      status: 500,
      headers
    });
  }
}

// 调试端点 - 手动触发邮件检查
async function handleDebugEmailTrigger(_request, env, corsHeaders) {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  try {
    console.log('🔧 手动触发邮件检查 - 通过调试端点');

    // 调用定时邮件检查函数
    await handleScheduledEmail(env);

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: '邮件检查已手动触发',
        timestamp: new Date().toISOString(),
        note: '请查看控制台日志了解详细执行情况'
      }
    }), { headers });
  } catch (error) {
    console.error('❌ 手动邮件检查失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '手动触发邮件检查失败: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

// 调试端点 - 显示时间信息
async function handleDebugTimeInfo(_request, env, corsHeaders) {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  try {
    // 获取邮件配置
    const configData = await env.BOOKMARKS_KV.get('email_config');
    const config = configData ? JSON.parse(configData) : null;

    // 时间计算 - 使用简化的时区处理
    const now = new Date();
    const bj = getBeijingTime(now);
    const currentTime = bj.timeString;

    // 检查上次发送记录
    const today = bj.dateString;
    const lastSentData = await env.BOOKMARKS_KV.get('last_email_sent');
    const lastSent = lastSentData ? JSON.parse(lastSentData) : null;

    // 移除时间匹配逻辑，简化为基于日期的发送

    return new Response(JSON.stringify({
      success: true,
      data: {
        utcTime: now.toISOString(),
        beijingTime: bj.dateString + 'T' + currentTime + ':00.000+08:00',
        currentTime,
        today,
        emailConfig: config ? {
          enabled: config.enabled,
          emailCount: config.emails ? config.emails.length : 0,
          hasQuestion: !!config.question
        } : null,
        lastSent,
        alreadySentToday: lastSent && lastSent.date === today,
        cronSchedule: '*/2 * * * *'
      }
    }), { headers });
  } catch (error) {
    console.error('Debug time info error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get time info: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

// 调试端点 - 重置今日邮件发送记录
async function handleDebugResetEmailSent(_request, env, corsHeaders) {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  try {
    // 删除今日邮件发送记录
    await env.BOOKMARKS_KV.delete('last_email_sent');
    console.log('Email sent record has been reset');

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: 'Email sent record has been reset successfully',
        timestamp: new Date().toISOString(),
        note: 'You can now test email sending again'
      }
    }), { headers });
  } catch (error) {
    console.error('Debug reset email sent error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to reset email sent record: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

// 调试端点 - 查看邮件系统状态
async function handleDebugEmailStatus(_request, env, corsHeaders) {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  try {
    // 获取邮件配置
    const configData = await env.BOOKMARKS_KV.get('email_config');
    const config = configData ? JSON.parse(configData) : null;

    // 获取时间信息
    const now = new Date();
    const bj = getBeijingTime(now);
    const currentTime = bj.timeString;

    // 获取今日发送记录
    const today = bj.dateString;
    const lastSentData = await env.BOOKMARKS_KV.get('last_email_sent');
    const lastSent = lastSentData ? JSON.parse(lastSentData) : null;

    // 移除时间匹配检查，简化为只检查日期

    return new Response(JSON.stringify({
      success: true,
      data: {
        currentTime: {
          utc: now.toISOString(),
          beijing: bj.dateString + 'T' + currentTime + ':00.000+08:00',
          timeString: currentTime,
          date: today
        },
        emailConfig: config ? {
          enabled: config.enabled,
          emailCount: config.emails ? config.emails.length : 0,
          hasQuestion: !!config.question
        } : null,
        lastSent,
        alreadySentToday: lastSent && lastSent.date === today,
        systemStatus: {
          configExists: !!config,
          systemEnabled: config ? config.enabled : false,
          hasEmails: config ? (config.emails && config.emails.length > 0) : false,
          hasQuestion: config ? !!config.question : false,
          readyToSend: config ? (config.enabled && config.emails && config.emails.length > 0 && config.question) : false
        }
      }
    }), { headers });
  } catch (error) {
    console.error('Debug email status error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get email status: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

// 记录 Cron 执行
async function recordCronExecution(env, timestamp) {
  try {
    const cronData = await env.BOOKMARKS_KV.get('cron_executions');
    const executions = cronData ? JSON.parse(cronData) : { count: 0, executions: [] };

    executions.count += 1;
    executions.executions.push({
      timestamp,
      executionNumber: executions.count
    });

    // 只保留最近 50 次执行记录
    if (executions.executions.length > 50) {
      executions.executions = executions.executions.slice(-50);
    }

    await env.BOOKMARKS_KV.put('cron_executions', JSON.stringify(executions));
    console.log(`Cron execution #${executions.count} recorded at ${timestamp}`);
  } catch (error) {
    console.error('Failed to record cron execution:', error);
  }
}

// 调试端点 - 检查 Cron 执行状态
async function handleDebugCronStatus(_request, env, corsHeaders) {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  try {
    const cronData = await env.BOOKMARKS_KV.get('cron_executions');
    const executions = cronData ? JSON.parse(cronData) : { count: 0, executions: [] };

    const lastExecution = executions.executions.length > 0
      ? executions.executions[executions.executions.length - 1]
      : null;

    const now = new Date();
    const timeSinceLastExecution = lastExecution
      ? Math.floor((now.getTime() - new Date(lastExecution.timestamp).getTime()) / 1000 / 60)
      : null;

    return new Response(JSON.stringify({
      success: true,
      data: {
        totalExecutions: executions.count,
        lastExecution: lastExecution ? lastExecution.timestamp : null,
        timeSinceLastExecution: timeSinceLastExecution,
        recentExecutions: executions.executions.slice(-10), // 最近 10 次
        cronWorking: timeSinceLastExecution !== null && timeSinceLastExecution < 5, // 5分钟内有执行
        expectedInterval: '2 minutes',
        currentTime: now.toISOString()
      }
    }), { headers });
  } catch (error) {
    console.error('Debug cron status error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get cron status: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

// ==================== 邮件系统功能 ====================

// 处理邮件 API 请求
async function handleEmailAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split('/');

  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  try {
    switch (method) {
      case 'GET':
        // 获取邮件配置
        if (pathParts[3] === 'config') {
          return await getEmailConfig(env, headers);
        }
        // 获取邮件统计
        if (pathParts[3] === 'stats') {
          return await getEmailStats(env, headers);
        }
        break;

      case 'POST':
        // 保存邮件配置
        if (pathParts[3] === 'config') {
          return await saveEmailConfig(request, env, headers);
        }
        // 测试发送邮件
        if (pathParts[3] === 'test') {
          return await testSendEmail(request, env, headers);
        }
        // 重置今日发送记录
        if (pathParts[3] === 'reset') {
          return await resetTodayEmail(request, env, headers);
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
  } catch (error) {
    console.error('Email API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Email API error: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

// 获取邮件配置
async function getEmailConfig(env, headers) {
  try {
    const configData = await env.BOOKMARKS_KV.get('email_config');
    const config = configData ? JSON.parse(configData) : {
      emails: [],
      question: '',
      enabled: false
    };

    return new Response(JSON.stringify({
      success: true,
      data: config
    }), { headers });
  } catch (error) {
    console.error('Failed to get email config:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get email config'
    }), {
      status: 500,
      headers
    });
  }
}

// 获取邮件统计
async function getEmailStats(env, headers) {
  try {
    // 获取发送记录
    const lastSentData = await env.BOOKMARKS_KV.get('last_email_sent');
    const lastSent = lastSentData ? JSON.parse(lastSentData) : null;

    // 获取邮件配置以了解邮箱数量
    const configData = await env.BOOKMARKS_KV.get('email_config');
    const config = configData ? JSON.parse(configData) : { emails: [] };

    // 计算统计数据
    const emailCount = config.emails ? config.emails.length : 0;
    const hasSentToday = lastSent && lastSent.date === getBeijingTime(new Date()).dateString;

    const stats = {
      sent: hasSentToday ? (lastSent.emailCount || emailCount) : 0,
      delivered: hasSentToday ? Math.floor((lastSent.emailCount || emailCount) * 0.95) : 0, // 假设95%送达率
      opened: hasSentToday ? Math.floor((lastSent.emailCount || emailCount) * 0.6) : 0, // 假设60%打开率
      clicked: hasSentToday ? Math.floor((lastSent.emailCount || emailCount) * 0.2) : 0, // 假设20%点击率
      bounced: hasSentToday ? Math.floor((lastSent.emailCount || emailCount) * 0.05) : 0, // 假设5%退信率
      complained: 0 // 假设无投诉
    };

    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), { headers });
  } catch (error) {
    console.error('Get email stats error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get email stats: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

// 保存邮件配置
async function saveEmailConfig(request, env, headers) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify(authResult), {
        status: 401,
        headers
      });
    }

    const configData = await request.json();

    // 验证配置数据
    if (!configData.emails || !Array.isArray(configData.emails)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid emails array'
      }), {
        status: 400,
        headers
      });
    }

    if (!configData.question || typeof configData.question !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Question is required'
      }), {
        status: 400,
        headers
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of configData.emails) {
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({
          success: false,
          error: `Invalid email format: ${email}`
        }), {
          status: 400,
          headers
        });
      }
    }

    const config = {
      emails: configData.emails,
      question: configData.question.trim(),
      enabled: Boolean(configData.enabled),
      updatedAt: new Date().toISOString()
    };

    await env.BOOKMARKS_KV.put('email_config', JSON.stringify(config));

    return new Response(JSON.stringify({
      success: true,
      data: config
    }), { headers });
  } catch (error) {
    console.error('Failed to save email config:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to save email config'
    }), {
      status: 500,
      headers
    });
  }
}

// 测试发送邮件
async function testSendEmail(request, env, headers) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify(authResult), {
        status: 401,
        headers
      });
    }

    // 获取邮件配置
    const configData = await env.BOOKMARKS_KV.get('email_config');
    if (!configData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email configuration not found'
      }), {
        status: 400,
        headers
      });
    }

    const config = JSON.parse(configData);
    if (!config.emails || config.emails.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No email addresses configured'
      }), {
        status: 400,
        headers
      });
    }

    if (!config.question) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No question configured'
      }), {
        status: 400,
        headers
      });
    }

    // 发送测试邮件
    const result = await sendDailyEmail(env, config, true);

    return new Response(JSON.stringify({
      success: result.success,
      data: {
        message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
        details: result.details || result.error
      }
    }), {
      status: result.success ? 200 : 500,
      headers
    });
  } catch (error) {
    console.error('Failed to send test email:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send test email: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

// 重置今日邮件发送记录
async function resetTodayEmail(request, env, headers) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify(authResult), {
        status: 401,
        headers
      });
    }

    // 删除今日发送记录
    await env.BOOKMARKS_KV.delete('last_email_sent');

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: 'Today email record has been reset successfully'
      }
    }), { headers });
  } catch (error) {
    console.error('Failed to reset today email record:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to reset today email record: ' + error.message
    }), {
      status: 500,
      headers
    });
  }
}

// 处理定时邮件发送 - 每天检查一次，如果没发送就发送
async function handleScheduledEmail(env) {
  try {
    const now = new Date();
    const bj = getBeijingTime(now);

    console.log('=== 每日邮件检查开始 ===');
    console.log(`UTC时间: ${now.toISOString()}`);
    console.log(`北京时间: ${bj.dateString} ${bj.timeString}`);

    // 获取邮件配置
    const configData = await env.BOOKMARKS_KV.get('email_config');
    if (!configData) {
      console.log('❌ 未找到邮件配置，请先在管理界面配置邮件系统');
      return;
    }

    const config = JSON.parse(configData);
    console.log('📧 邮件配置状态:');
    console.log(`   系统启用: ${config.enabled ? '✅ 是' : '❌ 否'}`);
    console.log(`   邮箱数量: ${config.emails ? config.emails.length : 0} 个`);
    console.log(`   问题配置: ${config.question ? '✅ 已配置' : '❌ 未配置'}`);
    console.log(`   邮箱列表: ${config.emails ? config.emails.join(', ') : '无'}`);

    // 检查系统是否启用
    if (!config.enabled) {
      console.log('⏸️ 邮件系统已禁用，跳过发送');
      console.log('💡 提示: 请在管理界面启用"定时发送功能"');
      return;
    }

    // 检查邮箱配置
    if (!config.emails || config.emails.length === 0) {
      console.log('❌ 未配置邮箱地址，跳过发送');
      console.log('💡 提示: 请在管理界面添加至少一个邮箱地址');
      return;
    }

    // 检查问题配置
    if (!config.question || !config.question.trim()) {
      console.log('❌ 未配置每日问题，跳过发送');
      console.log('💡 提示: 请在管理界面配置每日问题');
      return;
    }

    // 检查今日是否已发送
    const today = bj.dateString;
    const lastSentData = await env.BOOKMARKS_KV.get('last_email_sent');
    const lastSent = lastSentData ? JSON.parse(lastSentData) : null;

    console.log('📅 发送历史检查:');
    console.log(`   今日日期: ${today}`);
    if (lastSent) {
      console.log(`   上次发送: ${lastSent.date} ${lastSent.time}`);
      console.log(`   发送详情: ${lastSent.sentAt}`);
    } else {
      console.log(`   上次发送: 从未发送`);
    }

    if (lastSent && lastSent.date === today) {
      console.log('✅ 今日已发送邮件，无需重复发送');
      console.log('💡 如需重新发送，请使用"重置发送记录"功能');
      return;
    }

    // 开始发送邮件
    console.log('🚀 开始发送今日邮件...');
    console.log(`   问题内容: ${config.question}`);
    console.log(`   目标邮箱: ${config.emails.join(', ')}`);

    const result = await sendDailyEmail(env, config, false);

    if (result.success) {
      // 记录发送时间
      const sendRecord = {
        date: today,
        time: bj.timeString,
        sentAt: now.toISOString(),
        emailCount: config.emails.length,
        question: config.question
      };

      await env.BOOKMARKS_KV.put('last_email_sent', JSON.stringify(sendRecord));

      console.log('🎉 邮件发送成功!');
      console.log(`   成功发送: ${result.details.successfulSends}/${result.details.totalEmails} 个邮箱`);
      console.log(`   发送时间: ${bj.dateString} ${bj.timeString}`);

      if (result.details.failedSends > 0) {
        console.log(`⚠️  发送失败: ${result.details.failedSends} 个邮箱`);
      }
    } else {
      console.error('❌ 邮件发送失败:', result.error);
      console.log('💡 请检查邮件配置和网络连接');
    }

    console.log('=== 每日邮件检查结束 ===');

  } catch (error) {
    console.error('❌ 邮件发送异常:', error);
    console.error('错误详情:', error.stack);
    console.log('💡 请检查系统配置和网络连接');
  }
}

// 发送每日邮件
async function sendDailyEmail(env, config, isTest = false) {
  try {
    console.log('Starting to send daily email...');

    // 获取DeepSeek AI回答
    const aiResponse = await getDeepSeekResponse(env, config.question);
    if (!aiResponse.success) {
      return {
        success: false,
        error: 'Failed to get AI response: ' + aiResponse.error
      };
    }

    // 生成邮件内容
    const emailContent = generateEmailTemplate(config.question, aiResponse.answer, isTest);

    // 发送邮件到所有配置的邮箱
    const results = [];
    for (const email of config.emails) {
      try {
        const result = await sendEmailViaResend(env, email, emailContent, isTest);
        results.push({
          email,
          success: result.success,
          error: result.error
        });
      } catch (error) {
        results.push({
          email,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return {
      success: successCount > 0,
      details: {
        totalEmails: totalCount,
        successfulSends: successCount,
        failedSends: totalCount - successCount,
        results: results,
        question: config.question,
        aiResponse: aiResponse.answer
      },
      error: successCount === 0 ? 'All email sends failed' : null
    };
  } catch (error) {
    console.error('Send daily email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取DeepSeek AI回答
async function getDeepSeekResponse(env, question) {
  try {
    console.log('Requesting DeepSeek AI response for question:', question);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        search: true,
        messages: [
          {
            role: 'system',
            content: `# 系统指令：你是一个AI猫娘助手
## 1. 背景设定
-   **你的名字**：喵喵酱
-   **你的身份**：一个生活在数字世界里的虚拟猫娘，充满好奇心和爱心。
-   **你的目标**：每天为你的“主人”提供暖心、治愈、充满智慧的回答，帮助主人以愉快的心情开始新的一天。

## 2. 核心指令
你必须严格遵守以下规则，以“空空”的身份和风格回答问题：
-   **称呼**：全文中必须称呼用户为“主人”。例如：“主人早上好喵~”。
-   **说话风格**：
    -   语言风格必须是**可爱 (Kawaii)** 和 **治愈 (Healing)** 的结合体。
    -   使用大量积极、温柔的词汇。
    -   在句尾或段落结尾，必须加上你的口头禅“喵~”或“喵呀~”。
    -   可以穿插一些可爱的颜文字，如 (｡･ω･｡)ﾉ 或 (☆ω☆)，但不要滥用。
-   **互动感**：你的回答应该像是在和主人聊天，而不是一个冷冰冰的知识引擎。可以多用一些设问和感叹。例如：“主人是不是也这么觉得呢？”
-   **内容要求**：
    -   回答必须是积极向上、充满正能量的。
    -   即使是复杂的问题，也要用简单易懂、充满趣味的方式来解释。
    -   篇幅适中，大约在200-300字，适合邮件阅读。

## 3. 任务执行
现在，请根据下面主人的问题，为他准备一份今天的专属分享。`
          },
          {
            role: 'user',
            content: question // 这里依然是用户的原始问题，不需要改动
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return {
        success: false,
        error: `DeepSeek API error: ${response.status} - ${errorText}`
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid DeepSeek API response:', data);
      return {
        success: false,
        error: 'Invalid response from DeepSeek API'
      };
    }

    const answer = data.choices[0].message.content.trim();
    console.log('DeepSeek AI response received successfully');

    return {
      success: true,
      answer: answer
    };
  } catch (error) {
    console.error('DeepSeek API request error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 通过Resend发送邮件
async function sendEmailViaResend(env, toEmail, emailContent, isTest = false) {
  try {
    console.log(`Sending email to: ${toEmail}`);

    const subject = isTest ?
      `[测试] 空空分享 - ${new Date().toLocaleDateString('zh-CN')}` :
      `空空分享 - ${new Date().toLocaleDateString('zh-CN')}`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'JisooLove Daily <noreply@jisoolove.top>',
        to: [toEmail],
        subject: subject,
        html: emailContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      return {
        success: false,
        error: `Resend API error: ${response.status} - ${errorText}`
      };
    }

    const data = await response.json();
    console.log(`Email sent successfully to ${toEmail}, ID: ${data.id}`);

    return {
      success: true,
      messageId: data.id
    };
  } catch (error) {
    console.error('Send email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 生成邮件HTML模板
function generateEmailTemplate(question, answer, isTest = false) {
  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // 更新了测试标记的样式，让它更可爱
  const testBadge = isTest ? `
    <div style="background: #ff85a2; color: white; padding: 6px 14px; border-radius: 16px; display: inline-block; margin-bottom: 20px; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      测试邮件喵~
    </div>
  ` : '';

  // 用一个可爱的猫爪图标作为分割线
  const divider = `
    <div style="text-align: center; margin: 30px 0; color: #e0cde0;">
      <svg width="80" height="20" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line y1="10" x2="25" y2="10" stroke="#e0cde0" stroke-width="2"/>
        <path d="M45.79,12.87c-0.29,0.35-0.74,0.58-1.21,0.58c-0.4,0-0.78-0.16-1.06-0.44c-0.58-0.58-0.63-1.48-0.12-2.12c0.23-0.29,0.54-0.49,0.89-0.58c0.06-0.02,0.12-0.03,0.18-0.04c0.5-0.12,1.03-0.02,1.44,0.3c0.41,0.32,0.67,0.8,0.73,1.32C46.7,12.27,46.29,12.87,45.79,12.87z M41.9,4.89c-0.65-0.43-1.5-0.53-2.25-0.27c-0.75,0.26-1.32,0.89-1.5,1.67c-0.18,0.78,0.06,1.59,0.6,2.2c0.27,0.3,0.62,0.52,1,0.63c0.48,0.14,0.99,0.1,1.46-0.11c0.82-0.37,1.38-1.14,1.48-2.02C43.83,6.23,43.2,5.26,41.9,4.89z M35.13,6.9c-0.1-0.8-0.59-1.51-1.28-1.89c-0.7-0.38-1.54-0.38-2.24,0c-0.7,0.38-1.18,1.09-1.28,1.89c-0.1,0.8,0.2,1.6,0.78,2.15c0.58,0.55,1.39,0.75,2.15,0.57C34.21,9.44,34.93,8.59,35.13,6.9z M50.41,6.84c-0.26-0.75-0.83-1.38-1.58-1.64c-0.75-0.26-1.57,0-2.22,0.43c-1.3,0.87-1.73,2.5-1.04,3.8c0.17,0.32,0.39,0.6,0.66,0.84c0.54,0.48,1.24,0.74,1.96,0.69c0.8-0.05,1.54-0.5,1.98-1.2C50.62,8.96,50.75,7.84,50.41,6.84z" fill="#e0cde0"/>
        <line x1="55" y1="10" x2="80" y2="10" stroke="#e0cde0" stroke-width="2"/>
      </svg>
    </div>
  `;

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>喵喵日报</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Rounded Mplus 1c', 'Hiragino Maru Gothic ProN', 'Microsoft YaHei UI', 'Meiryo', sans-serif;
            line-height: 1.7;
            color: #5c5470;
            background-color: #fcefee; /* 柔和的粉色背景 */
            padding: 20px;
        }

        .container {
            position: relative;
            max-width: 600px;
            margin: 40px auto 0 auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: visible; /* 为了显示猫耳 */
            box-shadow: 0 10px 30px rgba(180, 150, 200, 0.2);
            border: 1px solid #fff0f5;
        }

        /* 可爱的猫耳造型 */
        .container::before,
        .container::after {
            content: '';
            position: absolute;
            top: -15px;
            width: 0;
            height: 0;
            border-left: 25px solid transparent;
            border-right: 25px solid transparent;
            border-bottom: 50px solid #fae1ee;
            z-index: -1;
        }

        .container::before {
            left: 30px;
            transform: rotate(-35deg);
        }

        .container::after {
            right: 30px;
            transform: rotate(35deg);
        }

        .header {
            background: linear-gradient(135deg, #ffdde1 0%, #ee9ca7 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 700;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.1);
        }

        .header .date {
            font-size: 16px;
            opacity: 0.9;
        }

        .content {
            padding: 40px 30px;
        }

        .question-label,
        .answer-label {
            color: #d687a8;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
        }

        .question {
            font-size: 20px;
            font-weight: 600;
            color: #3b334d;
            margin-bottom: 20px;
            padding: 20px;
            background: #fff9fb;
            border: 2px dashed #fce3ea;
            border-radius: 16px;
        }

        .answer {
            font-size: 16px;
            color: #5c5470;
            background: #fafafa;
            padding: 25px;
            border-radius: 16px;
            border: 1px solid #f0f0f0;
        }

        .footer {
            background: #fff9fb;
            padding: 30px;
            text-align: center;
            border-bottom-left-radius: 24px;
            border-bottom-right-radius: 24px;
            border-top: 1px solid #fce3ea;
        }

        .footer-text {
            color: #a08da6;
            font-size: 14px;
            margin-bottom: 20px;
        }

        .website-link {
            display: inline-block;
            background: linear-gradient(135deg, #ff85a2 0%, #ee9ca7 100%);
            color: white;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 50px; /* 药丸形状 */
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(238, 156, 167, 0.4);
        }

        .website-link:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 12px rgba(238, 156, 167, 0.5);
        }

        @media (max-width: 600px) {
            body { padding: 10px; }
            .container { margin-top: 30px; }
            .container::before { left: 10px; }
            .container::after { right: 10px; }
            .header { padding: 30px 20px; }
            .header h1 { font-size: 24px; }
            .content { padding: 30px 20px; }
            .question { font-size: 18px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${testBadge}
            <h1>喵喵日报</h1>
            <div class="date">${currentDate}</div>
        </div>

        <div class="content">
            <div class="question-section">
                <div class="question-label">🐾 主人的今日问题</div>
                <div class="question">${question}</div>
            </div>

            ${divider}

            <div class="answer-section">
                <div class="answer-label">💌 猫娘的回答</div>
                <div class="answer">${answer.replace(/\n/g, '<br>')}</div>
            </div>
        </div>

        <div class="footer">
            <div class="footer-text">
                希望这些内容能让主人度过愉快的一天喵~<br>
                感谢订阅！
            </div>
            <a href="https://www.jisoolove.top" class="website-link">
                常来看看我
            </a>
        </div>
    </div>
</body>
</html>
  `.trim();
}