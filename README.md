# 织选商城

这是一个商城系统，也是我的第一个 GitHub 项目。

一个 Next.js 全栈衣服商城系统，包含前台商城、账号登录注册、购物车、订单、模拟支付和商家后台。项目使用 Supabase 作为线上数据库，适合部署到 Vercel 免费 Hobby 计划起步。

## 本地运行

```bash
npm install
npm run dev
```

未配置 Supabase 时，首页、商品列表和商品详情会使用内置演示数据；登录、购物车、订单和后台写入功能需要配置 Supabase。

## 环境变量

复制 `.env.example` 为 `.env.local`，填入 Supabase 项目信息：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

## Supabase 数据库

1. 在 Supabase 创建免费项目。
2. 打开 SQL Editor，执行 `supabase/migrations/001_initial_schema.sql`。
3. 继续执行 `supabase/migrations/002_create_registrations.sql`，创建注册表。
4. 注册一个账号后，在 SQL Editor 把该用户设置为管理员：

```sql
update profiles
set role = 'admin'
where id = '你的用户 uuid';
```

## MCP 建议

开发时可以配置 Supabase MCP，让 Codex 管理数据库表结构和数据。线上运行时不走 MCP，Next.js 服务端通过环境变量直连 Supabase。

注册表单写入使用 `DATABASE_URL` 的 PostgreSQL 连接串。请在 Supabase 控制台复制 Session Pooler 连接串，填入 `.env.local` 和 Vercel 环境变量，不要使用本地数据库。

推荐配置方式：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=你的项目 ref"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "你的 Supabase access token"
      }
    }
  }
}
```

## 免费部署到 Vercel

1. 把项目推送到 GitHub。
2. 在 Vercel 导入 GitHub 仓库。
3. 添加 Supabase 环境变量。
4. 部署后可先使用 Vercel 免费二级域名访问。
5. 如需自己的域名，在 Vercel 项目 Settings -> Domains 绑定域名并按提示配置 DNS。

## 主要路由

- `/` 首页
- `/products` 商品列表
- `/products/[slug]` 商品详情
- `/cart` 购物车
- `/checkout` 结算与模拟支付
- `/orders` 我的订单
- `/auth/login` 登录
- `/auth/register` 注册
- `/admin/products` 商品管理
- `/admin/orders` 订单管理
- `/admin/categories` 分类说明
