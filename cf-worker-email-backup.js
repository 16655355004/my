// ==================== CF Worker 邮件发送逻辑备份 ====================
// 备份时间: 2025-01-10
// 说明: 这是从 src/worker.js 中提取的邮件发送相关代码
// 现在使用独立服务器发送邮件，所以这些代码已从 worker.js 中删除

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
-   **你的目标**：每天为你的"主人"提供暖心、治愈、充满智慧的回答，帮助主人以愉快的心情开始新的一天。

## 2. 核心指令
你必须严格遵守以下规则，以"空空"的身份和风格回答问题：
-   **称呼**：全文中必须称呼用户为"主人"。例如："主人早上好喵~"。
-   **说话风格**：
    -   语言风格必须是**可爱 (Kawaii)** 和 **治愈 (Healing)** 的结合体。
    -   使用大量积极、温柔的词汇。
    -   在句尾或段落结尾，必须加上你的口头禅"喵~"或"喵呀~"。
    -   可以穿插一些可爱的颜文字，如 (｡･ω･｡)ﾉ 或 (☆ω☆)，但不要滥用。
-   **互动感**：你的回答应该像是在和主人聊天，而不是一个冷冰冰的知识引擎。可以多用一些设问和感叹。例如："主人是不是也这么觉得呢？"
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

// 生成邮件HTML模板 (部分代码，完整版本请参考原 worker.js)
function generateEmailTemplate(question, answer, isTest = false) {
  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const testBadge = isTest ? `
    <div style="background: #ff85a2; color: white; padding: 6px 14px; border-radius: 16px; display: inline-block; margin-bottom: 20px; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      测试邮件喵~
    </div>
  ` : '';

  // 注意：这里只包含了模板的基本结构
  // 完整的 HTML 模板代码请参考原 worker.js 文件的 generateEmailTemplate 函数
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>喵喵日报</title>
    <!-- 完整的 CSS 样式请参考原文件 -->
</head>
<body>
    <div class="container">
        <div class="header">
            ${testBadge}
            <h1>喵喵日报</h1>
            <div class="date">${currentDate}</div>
        </div>
        <div class="content">
            <div class="question">${question}</div>
            <div class="answer">${answer.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="footer">
            <a href="https://www.jisoolove.top">常来看看我</a>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// 记录 Cron 执行历史
async function recordCronExecution(env, timestamp) {
  try {
    const executions = await env.BOOKMARKS_KV.get('cron_executions');
    let executionList = executions ? JSON.parse(executions) : [];

    executionList.unshift({
      timestamp,
      beijingTime: getBeijingTime().dateString + ' ' + getBeijingTime().timeString
    });

    // 只保留最近50次执行记录
    if (executionList.length > 50) {
      executionList = executionList.slice(0, 50);
    }

    await env.BOOKMARKS_KV.put('cron_executions', JSON.stringify(executionList));
  } catch (error) {
    console.error('Failed to record cron execution:', error);
  }
}
