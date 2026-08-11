# KV → D1 迁移说明

## 绑定

- KV `MY_KV`：`b0f52d8d37e749a9a5725b04f26412da`（保留冷却与访客去重）
- D1 `DB`：`25fe29f0-080a-4b18-910a-842342b58c5a`（`jisoolove`）

## 迁到 D1 的数据

短链元数据与统计、留言、图库元数据、API 密钥、站点统计、访问日志、日报。

## 仍留在 KV

- `message:cooldown:*` / `image-generate:cooldown:*`
- `stats:visitor:*` / `stats:visitor-day:*`
- `shortlink:visitor:*` / `shortlink:visitor-day:*`
- `settings:media_api_key`

## 部署后操作

1. 确认 Pages 项目已绑定 D1（binding 名 `DB`，database id 如上）。
2. 可选：本地执行 `npx wrangler d1 migrations apply jisoolove --remote`（代码也会在首次请求时 `CREATE TABLE IF NOT EXISTS`）。
3. 用管理员密码调用一次：

```bash
curl -X POST "https://你的域名/api/admin/migrate-kv-to-d1" \
  -H "Authorization: Bearer <ADMIN_PASSWORD>"
```

4. 查询状态：`GET /api/admin/migrate-kv-to-d1`（同样需要 Bearer）。
5. 强制重跑：`POST ...?force=1`。

迁移不会删除 KV 原数据，便于回滚核对。
