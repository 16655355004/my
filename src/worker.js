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
      console.log('Cron trigger executed at:', ts);
      // Use waitUntil so the runtime keeps the task alive even if this handler returns
      event.waitUntil(handleScheduledEmail(env));
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  }
};

// Helper: get Beijing wall-clock time information (UTC+8) without relying on locale parsing
function getBeijingWallClock(date = new Date()) {
  const pad = (n) => n.toString().padStart(2, '0');
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const bjMs = utcMs + 8 * 60 * 60000;
  const bjDate = new Date(bjMs);
  const hours = bjDate.getUTCHours();
  const minutes = bjDate.getUTCMinutes();
  const minutesOfDay = hours * 60 + minutes;
  const timeString = `${pad(hours)}:${pad(minutes)}`;
  const dateString = `${bjDate.getUTCFullYear()}-${pad(bjDate.getUTCMonth() + 1)}-${pad(bjDate.getUTCDate())}`;
  return { hours, minutes, minutesOfDay, timeString, dateString };
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
    console.log('Manual email check triggered via debug endpoint');

    // 调用定时邮件检查函数
    await handleScheduledEmail(env);

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: 'Email check triggered successfully',
        timestamp: new Date().toISOString()
      }
    }), { headers });
  } catch (error) {
    console.error('Debug email trigger error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to trigger email check: ' + error.message
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

    // 时间计算 - 使用与定时任务相同的方法（避免依赖 locale 解析）
    const now = new Date();
    const bj = getBeijingWallClock(now);
    const currentTime = bj.timeString;

    // 检查上次发送记录
    const today = bj.dateString;
    const lastSentData = await env.BOOKMARKS_KV.get('last_email_sent');
    const lastSent = lastSentData ? JSON.parse(lastSentData) : null;

    let timeMatchInfo = null;
    if (config && config.sendTime) {
      const [scheduleHour, scheduleMinute] = config.sendTime.split(':').map(Number);
      const scheduledMinutes = scheduleHour * 60 + scheduleMinute;
      const currentMinutes = bj.minutesOfDay;
      const timeDifference = Math.abs(currentMinutes - scheduledMinutes);

      timeMatchInfo = {
        scheduledTime: config.sendTime,
        scheduledMinutes,
        currentMinutes,
        timeDifference,
        withinRange: timeDifference <= 3,
        nextCheckIn: (2 - (currentMinutes % 2)) % 2 // cron 每2分钟
      };
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        utcTime: now.toISOString(),
        beijingTime: bj.dateString + 'T' + currentTime + ':00.000+08:00',
        currentTime,
        today,
        emailConfig: config ? {
          enabled: config.enabled,
          sendTime: config.sendTime,
          emailCount: config.emails ? config.emails.length : 0,
          hasQuestion: !!config.question
        } : null,
        lastSent,
        alreadySentToday: lastSent && lastSent.date === today,
        timeMatchInfo,
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

    // 获取时间信息（避免依赖 locale 解析）
    const now = new Date();
    const bj = getBeijingWallClock(now);
    const currentTime = bj.timeString;

    // 获取今日发送记录
    const today = bj.dateString;
    const lastSentData = await env.BOOKMARKS_KV.get('last_email_sent');
    const lastSent = lastSentData ? JSON.parse(lastSentData) : null;

    // 计算时间差
    let timeMatchInfo = null;
    if (config && config.sendTime) {
      const [scheduleHour, scheduleMinute] = config.sendTime.split(':').map(Number);
      const scheduledMinutes = scheduleHour * 60 + scheduleMinute;
      const currentMinutes = bj.minutesOfDay;
      const timeDifference = Math.abs(currentMinutes - scheduledMinutes);

      timeMatchInfo = {
        scheduledTime: config.sendTime,
        currentTime: currentTime,
        timeDifference: timeDifference,
        withinRange: timeDifference <= 3,
        scheduledMinutes,
        currentMinutes
      };
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        currentTime: {
          utc: now.toISOString(),
          beijing: beijingTime.toISOString(),
          timeString: currentTime,
          date: today
        },
        emailConfig: config ? {
          enabled: config.enabled,
          sendTime: config.sendTime,
          emailCount: config.emails ? config.emails.length : 0,
          hasQuestion: !!config.question,
          timezone: config.timezone
        } : null,
        lastSent,
        alreadySentToday: lastSent && lastSent.date === today,
        timeMatchInfo,
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
      sendTime: '08:00',
      timezone: 'Asia/Shanghai',
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

    if (!configData.sendTime || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(configData.sendTime)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid send time format (HH:MM)'
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
      sendTime: configData.sendTime,
      timezone: configData.timezone || 'Asia/Shanghai',
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

// 处理定时邮件发送
async function handleScheduledEmail(env) {
  try {
    console.log('Checking scheduled email task...');

    // 获取邮件配置
    const configData = await env.BOOKMARKS_KV.get('email_config');
    if (!configData) {
      console.log('No email configuration found');
      return;
    }

    const config = JSON.parse(configData);
    if (!config.enabled) {
      console.log('Email system is disabled');
      return;
    }

    if (!config.emails || config.emails.length === 0) {
      console.log('No email addresses configured');
      return;
    }

    if (!config.question) {
      console.log('No question configured');
      return;
    }

    // 检查是否到了发送时间 - 使用固定 UTC+8 计算
    const now = new Date();
    const bj = getBeijingWallClock(now);
    const currentTime = bj.timeString;

    console.log(`Current Beijing time: ${currentTime}, Scheduled time: ${config.sendTime}`);
    console.log(`UTC time: ${now.toISOString()}, Beijing wall-clock: ${bj.dateString} ${currentTime}`);

    // 检查是否已经发送过今天的邮件 - 使用北京时间的日期
    const today = bj.dateString;
    const lastSentData = await env.BOOKMARKS_KV.get('last_email_sent');
    const lastSent = lastSentData ? JSON.parse(lastSentData) : null;

    console.log(`Today (Beijing): ${today}, Last sent: ${lastSent ? lastSent.date : 'never'}`);

    if (lastSent && lastSent.date === today) {
      console.log('Email already sent today');
      return;
    }

    // 检查时间匹配（允许3分钟的误差，因为cron每2分钟执行一次）
    const [scheduleHour, scheduleMinute] = config.sendTime.split(':').map(Number);
    const scheduledMinutes = scheduleHour * 60 + scheduleMinute;
    const currentMinutes = bj.minutesOfDay;
    const timeDifference = Math.abs(currentMinutes - scheduledMinutes);

    console.log(`Scheduled minutes: ${scheduledMinutes}, Current minutes: ${currentMinutes}, Difference: ${timeDifference}`);

    if (timeDifference <= 3) {
      console.log('Time matches, sending scheduled email...');
      const result = await sendDailyEmail(env, config, false);

      if (result.success) {
        // 记录发送时间
        await env.BOOKMARKS_KV.put('last_email_sent', JSON.stringify({
          date: today,
          time: currentTime,
          sentAt: new Date().toISOString()
        }));
        console.log('Scheduled email sent successfully');
      } else {
        console.error('Failed to send scheduled email:', result.error);
      }
    } else {
      console.log('Not time to send email yet');
    }
  } catch (error) {
    console.error('Scheduled email error:', error);
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
        messages: [
          {
            role: 'system',
            content: '你是一个智慧、温暖的助手。请用简洁、积极、有启发性的语言回答问题。回答应该在200-400字之间，语言要温暖友好，富有正能量。'
          },
          {
            role: 'user',
            content: question
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

  const testBadge = isTest ? `
    <div style="background: #ff6b6b; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-size: 14px; font-weight: bold;">
      测试邮件
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>空空分享</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .header .date {
            font-size: 16px;
            opacity: 0.9;
        }

        .content {
            padding: 40px 30px;
        }

        .question-section {
            margin-bottom: 30px;
        }

        .question-label {
            color: #667eea;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }

        .question {
            font-size: 20px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
            padding: 20px;
            background: #f7fafc;
            border-left: 4px solid #667eea;
            border-radius: 8px;
        }

        .answer-section {
            margin-bottom: 30px;
        }

        .answer-label {
            color: #764ba2;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }

        .answer {
            font-size: 16px;
            line-height: 1.8;
            color: #4a5568;
            background: #fafafa;
            padding: 25px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }

        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }

        .footer-text {
            color: #718096;
            font-size: 14px;
            margin-bottom: 15px;
        }

        .website-link {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            transition: transform 0.2s ease;
        }

        .website-link:hover {
            transform: translateY(-2px);
        }

        .divider {
            height: 2px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            margin: 30px 0;
            border-radius: 1px;
        }

        @media (max-width: 600px) {
            body {
                padding: 10px;
            }

            .header {
                padding: 30px 20px;
            }

            .header h1 {
                font-size: 24px;
            }

            .content {
                padding: 30px 20px;
            }

            .question {
                font-size: 18px;
                padding: 15px;
            }

            .answer {
                font-size: 15px;
                padding: 20px;
            }

            .footer {
                padding: 25px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${testBadge}
            <h1>每日分享</h1>
            <div class="date">${currentDate}</div>
        </div>

        <div class="content">
            <div class="question-section">
                <div class="question-label">今日问题</div>
                <div class="question">${question}</div>
            </div>

            <div class="divider"></div>

            <div class="answer-section">
                <div class="answer-label">空空回答</div>
                <div class="answer">${answer.replace(/\n/g, '<br>')}</div>
            </div>
        </div>

        <div class="footer">
            <div class="footer-text">
                感谢您订阅我们的空空分享！<br>
                希望这些内容能为您的生活带来启发和正能量。
            </div>
            <a href="https://www.jisoolove.top" class="website-link">
                访问我们的网站
            </a>
        </div>
    </div>
</body>
</html>
  `.trim();
}
