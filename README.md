# 小蒋AI商城

这是一个基于 Next.js 的 AI 会员充值卡密自助发卡商城。

当前客户流程不需要注册登录：用户浏览商品，生成支付宝付款订单，扫码支付，订单由支付宝异步回调确认后，用户凭订单号领取卡密。

## 本地运行

```bash
npm install
npm run dev
```

提交或部署前运行：

```bash
npm run lint
npm run build
```

## 环境变量

复制 `.env.example` 为 `.env.local`，填入 Supabase 和支付宝开放平台配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_SITE_URL=
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_GATEWAY_URL=
```

不要提交 `.env.local` 或任何真实密钥。

## 主要路由

- `/` 首页
- `/products` 商品列表
- `/products/[slug]` 商品详情与支付领卡
- `/api/alipay/notify` 支付宝异步通知回调
