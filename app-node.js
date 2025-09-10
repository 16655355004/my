const http = require('http');
const https = require('https');
const url = require('url');

// 配置常量
const CONFIG = {
    // Cloudflare配置
    CF_DOMAIN: process.env.CF_DOMAIN || 'www.jisoolove.top',
    CF_API_TOKEN: process.env.CF_API_TOKEN || '',
    CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID || '',
    CF_KV_NAMESPACE_ID: process.env.CF_KV_NAMESPACE_ID || 'b0f52d8d37e749a9a5725b04f26412da',

    // 邮件服务配置
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',

    // 服务器配置
    PORT: process.env.PORT || 80,
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL) || 300000, // 5分钟检查一次

    // 邮件配置
    MAIL_DOMAIN: process.env.MAIL_DOMAIN || 'mail.jisoolove.top',
    FROM_EMAIL: process.env.FROM_EMAIL || 'daily@jisoolove.top',
    FROM_NAME: process.env.FROM_NAME || 'JisooLove每日邮件'
};

console.log('🚀 JisooLove邮件系统启动中 (修复版)...');
console.log('📧 邮件服务域名:', CONFIG.MAIL_DOMAIN);
console.log('🔧 CF域名:', CONFIG.CF_DOMAIN);

// HTTP请求工具函数
function makeHttpsRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    };

                    // 尝试解析JSON
                    if (res.headers['content-type']?.includes('application/json')) {
                        result.json = JSON.parse(data);
                    }

                    resolve(result);
                } catch (error) {
                    reject(new Error(`解析响应失败: ${error.message}`));
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

// Cloudflare配置获取器 - 修复数据结构解析
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

                // 验证发送时间字段
                if (!config.sendTime || typeof config.sendTime !== 'string') {
                    console.warn('⚠️ sendTime字段无效，使用默认值 08:00');
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
                const config = JSON.parse(response.data);
                console.log('CF API配置:', config);
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
                question: '请设置每日问题'
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
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🌟 JisooLove每日邮件</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">每日温暖，如约而至</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #667eea;">
                <div style="color: #333; line-height: 1.8; font-size: 16px;">
                    ${content.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f1f3f4; border-radius: 10px;">
                <p style="color: #666; margin: 0; font-size: 14px;">
                    这是来自JisooLove的每日邮件<br>
                    访问 <a href="https://${CONFIG.CF_DOMAIN}" style="color: #667eea;">jisoolove.top</a> 了解更多<br>
                </p>
            </div>
        </div>
        `
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

// 主要邮件发送逻辑
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
        const aiResponse = await getDeepSeekResponse(config.question);

        // 生成邮件标题
        const today = new Date();
        const dateStr = today.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        const subject = `${dateStr} - JisooLove每日分享`;

        // 发送到所有邮箱
        const results = [];
        for (const email of config.emails) {
            if (email && email.trim()) {
                try {
                    const result = await sendEmailViaResend(email.trim(), subject, aiResponse, isTest);
                    results.push({ email: email.trim(), success: true, id: result.id });

                    // 避免发送过快
                    if (config.emails.length > 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    console.error(`❌ 发送到 ${email} 失败:`, error.message);
                    results.push({ email: email.trim(), success: false, error: error.message });
                }
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`✅ 邮件发送完成: ${successCount}/${results.length}`);

        return {
            success: successCount > 0,
            results,
            successCount,
            totalCount: results.length
        };

    } catch (error) {
        console.error('❌ 发送每日邮件失败:', error.message);
        return { success: false, error: error.message };
    }
}

// 检查是否需要发送邮件
let lastSentDate = null;

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

    // 检查是否到达发送时间（允许5分钟的误差范围）
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const targetTotalMinutes = targetHour * 60 + targetMinute;
    const timeDiff = Math.abs(currentTotalMinutes - targetTotalMinutes);

    return timeDiff <= 5; // 5分钟内都算到达发送时间
}

async function checkAndSendEmail() {
    try {
        const now = new Date();
        const today = now.toDateString();

        // 检查是否已经发送过今天的邮件
        if (lastSentDate === today) {
            console.log('📅 今日邮件已发送，跳过');
            return;
        }

        // 获取配置（需要先获取配置才能知道发送时间）
        const configFetcher = new CFConfigFetcher();
        const config = await configFetcher.getFullConfig();

        // 获取发送时间，默认为 08:00
        const sendTime = config.sendTime || '08:00';

        // 检查是否到达发送时间
        if (!isTimeToSend(sendTime)) {
            const { hours, minutes } = parseBeijingTime(sendTime);
            console.log(`⏰ 等待发送时间 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} (北京时间)`);
            return;
        }

        console.log('🎯 到达发送时间，开始处理...');

        // 发送邮件
        const result = await sendDailyEmail(config, false);

        if (result.success) {
            lastSentDate = today;
            console.log(`🎉 今日邮件发送成功！成功: ${result.successCount}/${result.totalCount}`);
        } else {
            console.error('❌ 今日邮件发送失败:', result.error);
        }

    } catch (error) {
        console.error('❌ 检查邮件发送失败:', error.message);
    }
}

// HTTP服务器
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const query = parsedUrl.query;

    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${path}`);

    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        // 健康检查
        if (path === '/health') {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify({
                status: 'ok',
                service: 'JisooLove邮件系统 (修复版)',
                version: '1.0.1',
                timestamp: new Date().toISOString(),
                uptime: `${Math.floor(process.uptime())}秒`,
                memory: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
                config: {
                    cf_domain: CONFIG.CF_DOMAIN,
                    mail_domain: CONFIG.MAIL_DOMAIN,
                    resend_configured: !!CONFIG.RESEND_API_KEY,
                    deepseek_configured: !!CONFIG.DEEPSEEK_API_KEY
                }
            }, null, 2));
            return;
        }

        // 状态页面
        if (path === '/status') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.writeHead(200);
            res.end(`
                <h1>📊 JisooLove邮件系统状态 (修复版)</h1>
                <p><strong>运行时间:</strong> ${Math.floor(process.uptime())}秒</p>
                <p><strong>内存使用:</strong> ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB</p>
                <p><strong>最后发送:</strong> ${lastSentDate || '尚未发送'}</p>
                <p><strong>下次检查:</strong> ${CONFIG.CHECK_INTERVAL / 1000}秒后</p>
                <hr>
                <h3>配置状态:</h3>
                <ul>
                    <li>CF域名: ${CONFIG.CF_DOMAIN}</li>
                    <li>邮件域名: ${CONFIG.MAIL_DOMAIN}</li>
                    <li>Resend API: ${CONFIG.RESEND_API_KEY ? '✅ 已配置' : '❌ 未配置'}</li>
                    <li>DeepSeek API: ${CONFIG.DEEPSEEK_API_KEY ? '✅ 已配置' : '❌ 未配置'}</li>
                </ul>
                <hr>
                <p><a href="/health">健康检查</a> | <a href="/test-send">测试发送</a> | <a href="/debug-config">调试配置</a></p>
            `);
            return;
        }

        // 调试配置
        if (path === '/debug-config') {
            console.log('🔍 调试配置获取');

            const configFetcher = new CFConfigFetcher();
            const config = await configFetcher.getFullConfig();

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify({
                message: '配置调试信息',
                config: config,
                timestamp: new Date().toISOString()
            }, null, 2));
            return;
        }

        // 测试发送
        if (path === '/test-send') {
            console.log('🧪 收到测试发送请求');

            const configFetcher = new CFConfigFetcher();
            const config = await configFetcher.getFullConfig();

            const result = await sendDailyEmail(config, true);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify({
                success: result.success,
                message: result.success ? '测试邮件发送成功' : '测试邮件发送失败',
                result: result,
                config_used: config
            }, null, 2));
            return;
        }

        // 手动触发发送
        if (path === '/trigger-send') {
            console.log('🎯 收到手动触发请求');

            const configFetcher = new CFConfigFetcher();
            const config = await configFetcher.getFullConfig();

            const result = await sendDailyEmail(config, false);

            if (result.success) {
                lastSentDate = new Date().toDateString();
            }

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify({
                success: result.success,
                message: result.success ? '邮件发送成功' : '邮件发送失败',
                result: result,
                config_used: config
            }, null, 2));
            return;
        }

        // 默认页面
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.writeHead(200);
        res.end(`
            <h1>🚀 JisooLove邮件系统 (修复版)</h1>
            <p>邮件系统正在运行中...</p>
            <p>时间: ${new Date().toISOString()}</p>
            <hr>
            <h3>可用端点:</h3>
            <ul>
                <li><a href="/health">健康检查</a> - JSON格式状态</li>
                <li><a href="/status">状态页面</a> - 详细状态信息</li>
                <li><a href="/debug-config">调试配置</a> - 查看当前配置</li>
                <li><a href="/test-send">测试发送</a> - 发送测试邮件</li>
                <li><a href="/trigger-send">手动发送</a> - 立即发送今日邮件</li>
            </ul>
        `);

    } catch (error) {
        console.error('❌ 请求处理错误:', error);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(500);
        res.end(JSON.stringify({
            error: '服务器内部错误',
            message: error.message
        }));
    }
});

// 启动服务器
server.listen(CONFIG.PORT, () => {
    console.log(`✅ JisooLove邮件系统启动成功！`);
    console.log(`🌐 监听端口: ${CONFIG.PORT}`);
    console.log(`📧 访问地址: http://${CONFIG.MAIL_DOMAIN}`);
    console.log(`⏰ 检查间隔: ${CONFIG.CHECK_INTERVAL / 1000}秒`);

    // 立即执行一次检查
    checkAndSendEmail();

    // 设置定期检查
    setInterval(checkAndSendEmail, CONFIG.CHECK_INTERVAL);
});

server.on('error', (err) => {
    console.error('❌ 服务器启动失败:', err);
    process.exit(1);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('📴 收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📴 收到SIGINT信号，正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

console.log('🎉 JisooLove邮件系统初始化完成！'); 