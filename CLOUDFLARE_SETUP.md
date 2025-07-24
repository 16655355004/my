# Cloudflare KV 存储设置指南

本指南将帮助你设置 Cloudflare KV 存储，实现动态管理网站书签，无需重新部署。

## 🚀 快速开始

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 KV 命名空间

```bash
# 创建生产环境 KV 命名空间
wrangler kv:namespace create "BOOKMARKS_KV"

# 创建预览环境 KV 命名空间
wrangler kv:namespace create "BOOKMARKS_KV" --preview
```

命令执行后会显示类似以下内容：
```
🌀 Creating namespace with title "vue-bookmarks-api-BOOKMARKS_KV"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "BOOKMARKS_KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

### 4. 更新配置文件

将上一步获得的 namespace ID 填入 `wrangler.toml` 文件：

```toml
[[kv_namespaces]]
binding = "BOOKMARKS_KV"
id = "your-production-kv-namespace-id"  # 替换为实际的生产环境 ID
preview_id = "your-preview-kv-namespace-id"  # 替换为实际的预览环境 ID
```

### 5. 设置管理员密码

在 `wrangler.toml` 中设置你的管理员密码：

```toml
[vars]
ADMIN_PASSWORD = "your-secure-password"  # 替换为你的安全密码
```

### 6. 部署 Worker

```bash
# 安装 Worker 依赖
npm install -g wrangler

# 部署到 Cloudflare
wrangler deploy
```

### 7. 配置自定义域名（可选）

如果你有自己的域名，可以在 `wrangler.toml` 中配置路由：

```toml
[[routes]]
pattern = "your-domain.com/api/*"
zone_name = "your-domain.com"
```

### 8. 更新前端配置

在项目根目录的 `.env` 文件中设置 API 地址：

```env
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
VITE_ADMIN_PASSWORD=your-secure-password
```

## 📝 初始化数据

### 方法一：通过管理界面添加

1. 访问 `http://localhost:5173/admin`（开发环境）或 `https://your-domain.com/admin`（生产环境）
2. 输入管理员密码登录
3. 点击"添加书签"按钮逐个添加网站

### 方法二：批量导入现有数据

使用 Wrangler CLI 直接导入现有的书签数据：

```bash
# 创建一个包含现有书签数据的 JSON 文件
cat > bookmarks.json << 'EOF'
[
  {
    "id": 1,
    "name": "Reqable",
    "description": "API抓包调试 + API测试一站式工具",
    "url": "https://reqable.com/",
    "icon": "🔧",
    "category": "开发工具",
    "color": "#00d4ff"
  },
  {
    "id": 2,
    "name": "PowerToys",
    "description": "Microsoft Learn - Windows实用工具集",
    "url": "https://learn.microsoft.com/zh-cn/windows/powertoys/install",
    "icon": "⚡",
    "category": "系统工具",
    "color": "#ff3366"
  }
]
EOF

# 将数据导入到 KV 存储
wrangler kv:key put --binding=BOOKMARKS_KV "bookmarks" --path=bookmarks.json
```

## 🔧 API 接口说明

### 获取所有书签
```
GET /api/bookmarks
```

### 获取单个书签
```
GET /api/bookmarks/{id}
```

### 添加书签
```
POST /api/bookmarks
Authorization: Bearer {admin_password}
Content-Type: application/json

{
  "name": "网站名称",
  "description": "网站描述",
  "url": "https://example.com",
  "icon": "🔗",
  "category": "分类",
  "color": "#00d4ff"
}
```

### 更新书签
```
PUT /api/bookmarks/{id}
Authorization: Bearer {admin_password}
Content-Type: application/json

{
  "name": "更新的名称",
  "description": "更新的描述"
}
```

### 删除书签
```
DELETE /api/bookmarks/{id}
Authorization: Bearer {admin_password}
```

## 🛡️ 安全说明

1. **管理员密码**：请使用强密码，不要使用默认密码
2. **HTTPS**：Cloudflare Workers 默认使用 HTTPS，确保数据传输安全
3. **访问控制**：只有知道管理员密码的人才能修改书签数据
4. **备份**：定期备份你的 KV 数据

## 📊 使用限制

Cloudflare KV 免费计划限制：
- 每天 100,000 次读取操作
- 每天 1,000 次写入操作
- 1GB 存储空间

对于个人网站来说，这些限制通常足够使用。

## 🔍 故障排除

### 1. Worker 部署失败
- 检查 `wrangler.toml` 配置是否正确
- 确保已登录 Cloudflare 账户
- 检查 KV namespace ID 是否正确

### 2. API 请求失败
- 检查 CORS 设置
- 确认 API 地址配置正确
- 检查管理员密码是否正确

### 3. 数据不显示
- 检查 KV 存储中是否有数据
- 确认前端 API 地址配置正确
- 查看浏览器控制台错误信息

## 📞 获取帮助

如果遇到问题，可以：
1. 查看 Cloudflare Workers 文档
2. 检查浏览器开发者工具的网络和控制台面板
3. 使用 `wrangler tail` 查看 Worker 日志

## 🎉 完成！

设置完成后，你就可以：
- ✅ 在网页上直接管理书签
- ✅ 无需重新部署即可添加新网站
- ✅ 数据全球同步，访问速度快
- ✅ 免费使用（在限制范围内）
