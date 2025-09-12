#!/usr/bin/env node

// GitHub Actions版本的邮件发送脚本
// 这个版本会在执行一次检查和发送操作后退出，而不是持续运行

import https from 'https';
import http from 'http';
import url from 'url';

// 配置 - 从环境变量读取
const CONFIG = {
  CF_DOMAIN: process.env.CF_DOMAIN || 'https://www.jisoolove.top',
  CF_API_TOKEN: process.env.CF_API_TOKEN || '',
  CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID || '',
  CF_KV_NAMESPACE_ID: process.env.CF_KV_NAMESPACE_ID || '',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  FROM_NAME: process.env.FROM_NAME || 'Jisoo每日一问',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@jisoolove.top',
  CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL || '60000', 10), // 默认60秒
  MAIL_DOMAIN: process.env.MAIL_DOMAIN || 'mail.jisoolove.top'
};

// 全局变量
let lastSentDate = null;

// HTTP/HTTPS请求封装
function makeHttpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            json: json
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            json: null
          });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

// Cloudflare配置获取器
class CFConfigFetcher {
  async getConfigFromDomain() {
    try {
      console.log('📡 从CF域名获取配置...');

      const options = {
        hostname: CONFIG.CF_DOMAIN.replace('https://', '').replace('http://', ''),
        port: 443,
        path: '/api/email/config',
        method: 'GET',
        headers: {
          'User-Agent': 'JisooLove-Email-Server/1.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      };

      const response = await makeHttpsRequest(options);

      if (response.statusCode === 200 && response.json) {
        console.log('✅ 成功从CF获取配置');
        console.log('原始响应:', response.json);

        // 修复：正确解析数据结构
        let config;
        if (response.json.success && response.json.data) {
          // 格式：{"success": true, "data": {...}}
          config = response.json.data;
          console.log('✅ 解析data字段:', config);
        } else if (response.json.emails) {
          // 格式：{"emails": [...], "question": "...", "enabled": true}
          config = response.json;
          console.log('✅ 直接使用响应:', config);
        } else {
          throw new Error('配置格式不正确');
        }

        // 验证必要字段
        if (!config.emails || !Array.isArray(config.emails)) {
          console.warn('⚠️ emails字段无效，使用空数组');
          config.emails = [];
        }

        if (typeof config.enabled !== 'boolean') {
          console.warn('⚠️ enabled字段无效，默认为false');
          config.enabled = false;
        }

        if (!config.question || typeof config.question !== 'string') {
          console.warn('⚠️ question字段无效，使用默认值');
          config.question = '请设置每日问题';
        }

        // 验证发送时间字段 - 修复时间处理逻辑
        if (config.sendTime) {
          // 验证时间格式是否正确
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (timeRegex.test(config.sendTime)) {
            console.log('✅ sendTime字段有效:', config.sendTime);
          } else {
            console.warn('⚠️ sendTime格式无效，使用默认值 08:00');
            config.sendTime = '08:00';
          }
        } else {
          console.warn('⚠️ sendTime字段不存在，使用默认值 08:00');
          config.sendTime = '08:00';
        }

        console.log('✅ 最终配置:', config);
        return config;
      } else {
        throw new Error(`CF配置获取失败: ${response.statusCode}`);
      }
    } catch (error) {
      console.error('❌ 从CF域名获取配置失败:', error.message);
      return null;
    }
  }

  async getConfigFromAPI() {
    if (!CONFIG.CF_API_TOKEN || !CONFIG.CF_ACCOUNT_ID) {
      console.log('⚠️ CF API配置不完整，跳过API获取');
      return null;
    }

    try {
      console.log('🔑 从CF API获取配置...');

      const options = {
        hostname: 'api.cloudflare.com',
        port: 443,
        path: `/client/v4/accounts/${CONFIG.CF_ACCOUNT_ID}/storage/kv/namespaces/${CONFIG.CF_KV_NAMESPACE_ID}/values/email_config`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CONFIG.CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await makeHttpsRequest(options);

      if (response.statusCode === 200) {
        console.log('✅ 成功从CF API获取配置');
        const configData = response.data;
        console.log('CF API原始数据:', configData);
        
        // 解析JSON数据
        let config;
        try {
          config = JSON.parse(configData);
        } catch (parseError) {
          console.error('❌ JSON解析失败:', parseError.message);
          return null;
        }
        
        console.log('CF API配置:', config);
        
        // 验证发送时间字段 - 修复时间处理逻辑
        if (config && config.sendTime) {
          // 验证时间格式是否正确
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(config.sendTime)) {
            console.warn('⚠️ sendTime格式无效，使用默认值 08:00');
            config.sendTime = '08:00';
          }
        } else if (config) {
          console.warn('⚠️ sendTime字段不存在，使用默认值 08:00');
          config.sendTime = '08:00';
        }
        
        return config;
      } else {
        throw new Error(`CF API获取失败: ${response.statusCode}`);
      }
    } catch (error) {
      console.error('❌ 从CF API获取配置失败:', error.message);
      return null;
    }
  }

  async getFullConfig() {
    // 首先尝试从域名获取
    let config = await this.getConfigFromDomain();

    // 如果域名获取失败，尝试API
    if (!config) {
      config = await this.getConfigFromAPI();
    }

    if (!config) {
      console.log('⚠️ 无法获取配置，使用默认值');
      return {
        enabled: false,
        emails: [],
        question: '请设置每日问题',
        sendTime: '08:00'
      };
    }

    return config;
  }
}

// DeepSeek API调用
async function getDeepSeekResponse(question) {
  if (!CONFIG.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY未配置');
  }

  console.log('🤖 调用DeepSeek API...');

  const postData = JSON.stringify({
    model: "deepseek-chat",
    messages: [
      {
        role: "user",
        content: question
      }
    ],
    stream: false
  });

  const options = {
    hostname: 'api.deepseek.com',
    port: 443,
    path: '/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const response = await makeHttpsRequest(options, postData);

  if (response.statusCode === 200 && response.json) {
    const content = response.json.choices?.[0]?.message?.content;
    if (content) {
      console.log('✅ DeepSeek响应成功');
      return content;
    }
  }

  throw new Error(`DeepSeek API调用失败: ${response.statusCode}`);
}

// Resend邮件发送
async function sendEmailViaResend(toEmail, subject, content, isTest = false) {
  if (!CONFIG.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY未配置');
  }

  console.log(`📧 发送邮件到: ${toEmail} ${isTest ? '[测试]' : ''}`);

  const emailData = {
    from: `${CONFIG.FROM_NAME} <${CONFIG.FROM_EMAIL}>`,
    to: [toEmail],
    subject: isTest ? `[测试] ${subject}` : subject,
    html: content
  };

  const postData = JSON.stringify(emailData);

  const options = {
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const response = await makeHttpsRequest(options, postData);

  if (response.statusCode === 200 && response.json) {
    console.log('✅ 邮件发送成功:', response.json.id);
    return { success: true, id: response.json.id };
  }

  throw new Error(`邮件发送失败: ${response.statusCode} - ${response.data}`);
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
    <title>每日智慧分享</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px 0;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .date {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .question-section, .answer-section {
            margin-bottom: 30px;
        }
        
        .question-label, .answer-label {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        .question, .answer {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .answer {
            background: #e3f2fd;
            border-left-color: #764ba2;
        }
        
        .divider {
            height: 1px;
            background: #eee;
            margin: 20px 0;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-top: 1px solid #eee;
        }
        
        .website-link {
            display: inline-block;
            margin-top: 10px;
            color: #667eea;
            text-decoration: none;
            font-weight: bold;
        }
        
        .website-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐱 Jisoo每日一问</h1>
            <div class="date">${currentDate}</div>
            ${testBadge}
        </div>
        
        <div class="content">
            <div class="question-section">
                <div class="question-label">🐾 主人的今日问题</div>
                <div class="question">${question}</div>
            </div>

            <div class="divider"></div>

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
            <a href="https://${CONFIG.CF_DOMAIN.replace('https://', '').replace('http://', '')}" class="website-link">
                常来看看我
            </a>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// 将时间字符串转换为北京时间的小时数
function parseBeijingTime(timeStr) {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  } catch (error) {
    console.warn('⚠️ 时间格式解析失败，使用默认时间 08:00');
    return { hours: 8, minutes: 0 };
  }
}

// 检查当前是否到达发送时间
function isTimeToSend(sendTime) {
  const now = new Date();

  // 获取北京时间
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const currentHour = beijingTime.getUTCHours();
  const currentMinute = beijingTime.getUTCMinutes();

  // 解析配置的发送时间
  const { hours: targetHour, minutes: targetMinute } = parseBeijingTime(sendTime);

  console.log(`⏰ 当前北京时间: ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
  console.log(`🎯 目标发送时间: ${targetHour.toString().padStart(2, '0')}:${targetMinute.toString().padStart(2, '0')}`);

  // 检查是否到达发送时间（允许2分钟的误差范围，减少重复发送可能性）
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const targetTotalMinutes = targetHour * 60 + targetMinute;
  const timeDiff = Math.abs(currentTotalMinutes - targetTotalMinutes);

  return timeDiff <= 2; // 缩小时间窗口到2分钟内
}

// 发送每日邮件
async function sendDailyEmail(config, isTest = false) {
  try {
    console.log(`📬 开始${isTest ? '测试' : ''}发送每日邮件...`);
    console.log('使用配置:', config);

    if (!config.enabled && !isTest) {
      console.log('⏸️ 邮件系统已禁用，跳过发送');
      return { success: false, error: '系统已禁用' };
    }

    if (!config.emails || config.emails.length === 0) {
      console.log('❌ 没有配置邮箱地址');
      return { success: false, error: '没有邮箱地址' };
    }

    if (!config.question || config.question.trim() === '') {
      console.log('❌ 没有配置问题');
      return { success: false, error: '没有配置问题' };
    }

    // 获取AI回答
    console.log('🤖 获取AI回答...');
    const aiAnswer = await getDeepSeekResponse(config.question);
    console.log('✅ AI回答获取成功');

    // 生成邮件内容
    const subject = isTest
      ? `每日智慧分享 - ${new Date().toLocaleDateString('zh-CN')}`
      : `[测试] 每日智慧分享 - ${new Date().toLocaleDateString('zh-CN')}`;

    const htmlContent = generateEmailTemplate(config.question, aiAnswer, isTest);

    // 发送邮件给所有配置的邮箱
    let successCount = 0;
    let totalCount = config.emails.length;
    const results = [];

    for (const email of config.emails) {
      try {
        console.log(`📨 准备发送邮件到 ${email}...`);
        const result = await sendEmailViaResend(email, subject, htmlContent, isTest);
        results.push({ email, success: true, result });
        successCount++;
        console.log(`✅ 邮件发送成功到 ${email}`);
      } catch (error) {
        console.error(`❌ 发送邮件到 ${email} 失败:`, error.message);
        results.push({ email, success: false, error: error.message });
      }
    }

    return {
      success: successCount > 0,
      successCount: successCount,
      totalCount: totalCount,
      results: results
    };
  } catch (error) {
    console.error('❌ 发送每日邮件失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 检查并发送邮件（GitHub Actions版本 - 一次性执行）
async function checkAndSendEmail() {
  try {
    console.log('🚀 开始执行邮件检查任务...');
    
    const now = new Date();
    const today = now.toDateString();

    // 获取配置（需要先获取配置才能知道发送时间）
    const configFetcher = new CFConfigFetcher();
    const config = await configFetcher.getFullConfig();

    // 获取发送时间，默认为 08:00
    const sendTime = config.sendTime || '08:00';

    console.log(`📅 今天日期: ${today}`);
    console.log(`⏰ 用户设定发送时间: ${sendTime}`);
    
    // 检查系统是否启用
    if (!config.enabled) {
      console.log('⏸️ 邮件系统已禁用，跳过发送');
      console.log('🏁 任务完成：系统已禁用');
      return false;
    }

    // 检查是否到达发送时间
    if (!isTimeToSend(sendTime)) {
      const { hours, minutes } = parseBeijingTime(sendTime);
      console.log(`⏰ 等待发送时间 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} (北京时间)`);
      console.log('🏁 任务完成：未到发送时间');
      return false;
    }

    console.log('🎯 到达发送时间，开始处理...');

    // 发送邮件
    const result = await sendDailyEmail(config, false);

    if (result.success) {
      console.log(`🎉 今日邮件发送成功！成功: ${result.successCount}/${result.totalCount}`);
      console.log('🏁 任务完成：邮件发送成功');
      return true;
    } else {
      console.error('❌ 今日邮件发送失败:', result.error);
      console.log('🏁 任务完成：邮件发送失败');
      return false;
    }

  } catch (error) {
    console.error('❌ 检查邮件发送失败:', error.message);
    console.log('🏁 任务完成：执行过程中出现错误');
    return false;
  }
}

// 主函数 - GitHub Actions入口点
async function main() {
  console.log('📧 JisooLove邮件系统 (GitHub Actions版本)');
  console.log('=====================================');
  
  // 输出配置信息（隐藏敏感信息）
  console.log('🔧 配置信息:');
  console.log(`   CF_DOMAIN: ${CONFIG.CF_DOMAIN}`);
  console.log(`   MAIL_DOMAIN: ${CONFIG.MAIL_DOMAIN}`);
  console.log(`   FROM_NAME: ${CONFIG.FROM_NAME}`);
  console.log(`   FROM_EMAIL: ${CONFIG.FROM_EMAIL}`);
  console.log('=====================================');
  
  // 检查必要配置
  const missingConfigs = [];
  if (!CONFIG.RESEND_API_KEY) missingConfigs.push('RESEND_API_KEY');
  if (!CONFIG.DEEPSEEK_API_KEY) missingConfigs.push('DEEPSEEK_API_KEY');
  
  if (missingConfigs.length > 0) {
    console.error(`❌ 缺少必要配置: ${missingConfigs.join(', ')}`);
    console.log('请在GitHub Secrets中设置这些环境变量');
    process.exit(1);
  }
  
  // 执行邮件检查和发送
  try {
    const success = await checkAndSendEmail();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ 任务执行失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行main函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  checkAndSendEmail,
  main
};