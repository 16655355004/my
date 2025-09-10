// Cloudflare Worker for Bookmarks API and Email System (Clean Version)
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

  // Cron 触发器处理定时任务 (邮件发送已迁移到独立服务器)
  scheduled(event, env, _ctx) {
    try {
      const ts = new Date().toISOString();
      const bj = getBeijingTime();
      console.log('=== CRON TRIGGER START ===');
      console.log('UTC time:', ts);
      console.log('Beijing time:', bj.dateString, bj.timeString);
      console.log('Cron schedule: */2 * * * * (every 2 minutes)');
      console.log('Note: Email sending is now handled by external server');

      // 记录 cron 执行
      event.waitUntil(recordCronExecution(env, ts));
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

// 邮件发送功能已迁移到独立服务器
// 相关代码已备份到 cf-worker-email-backup.js
// 以下是保留的 API 功能，用于前端配置管理

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
        // 测试发送邮件 (转发到独立服务器)
        if (pathParts[3] === 'test') {
          return await forwardToEmailServer(request, env, headers, 'test-send');
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
      enabled: false,
      sendTime: '08:00'
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

    // 验证发送时间格式
    if (configData.sendTime && typeof configData.sendTime === 'string') {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(configData.sendTime)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid sendTime format. Expected HH:mm (e.g., "08:00", "15:30")'
        }), {
          status: 400,
          headers
        });
      }
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
      sendTime: configData.sendTime || '08:00',
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

// 转发请求到邮件服务器
async function forwardToEmailServer(request, env, headers, endpoint) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify(authResult), {
        status: 401,
        headers
      });
    }

    // 邮件服务器地址
    const emailServerUrl = 'http://mail.jisoolove.top';

    console.log(`转发请求到邮件服务器: ${emailServerUrl}/${endpoint}`);

    // 转发请求到独立邮件服务器
    const serverResponse = await fetch(`${emailServerUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CF-Worker-Proxy/1.0'
      }
    });

    // 获取服务器响应
    const responseText = await serverResponse.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      // 如果响应不是 JSON，包装成标准格式
      result = {
        success: serverResponse.ok,
        data: {
          message: serverResponse.ok ? '邮件服务器响应成功' : '邮件服务器响应失败',
          serverResponse: responseText,
          statusCode: serverResponse.status
        }
      };
    }

    // 添加转发信息
    result.forwarded = true;
    result.serverUrl = emailServerUrl;
    result.endpoint = endpoint;

    return new Response(JSON.stringify(result), {
      status: serverResponse.status,
      headers
    });

  } catch (error) {
    console.error('转发到邮件服务器失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '转发到邮件服务器失败: ' + error.message,
      forwarded: false,
      details: {
        serverUrl: 'http://mail.jisoolove.top',
        endpoint: endpoint,
        errorType: error.name
      }
    }), {
      status: 500,
      headers
    });
  }
}

// 调试端点 - 手动触发邮件检查 (转发到服务器)
async function handleDebugEmailTrigger(request, env, corsHeaders) {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  try {
    console.log('🔧 手动触发邮件检查 - 转发到邮件服务器');

    // 转发到邮件服务器的触发端点
    return await forwardToEmailServer(request, env, headers, 'trigger-send');

  } catch (error) {
    console.error('❌ 手动邮件检查转发失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '转发邮件检查请求失败: ' + error.message,
      note: '请检查邮件服务器是否正常运行'
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

    // 时间计算
    const now = new Date();
    const bj = getBeijingTime(now);
    const currentTime = bj.timeString;

    // 检查上次发送记录
    const today = bj.dateString;
    const lastSentData = await env.BOOKMARKS_KV.get('last_email_sent');
    const lastSent = lastSentData ? JSON.parse(lastSentData) : null;

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
        cronSchedule: '*/2 * * * *',
        note: 'Email sending is now handled by external server'
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
        },
        note: 'Email sending is now handled by external server'
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
        currentTime: now.toISOString(),
        note: 'Email sending is now handled by external server'
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
