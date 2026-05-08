# AGENTS.md

## Project Overview

This repository is a Next.js full-stack AI membership card mall named **小蒋AI商城**. It no longer sells clothing in the active customer flow. The storefront currently sells AI membership products with card-code delivery:

- GeminiPro 12个月会员
- ChatGPT Plus月会员

Customers do not register or log in. They browse products, create a payment order, scan an Alipay QR code, and can receive a card code only after the order is confirmed as paid in Supabase.

Core stack:

- Next.js App Router with TypeScript
- React 19
- Tailwind CSS
- Supabase Postgres
- Supabase service role for server-side order/card-code operations
- Netlify deployment target

## Important Commands

Run these from the repository root:

```bash
npm install
npm run dev
npm run lint
npm run build
```

Before committing or deployment, always run:

```bash
npm run lint
npm run build
```

## Environment And Secrets

Required environment variables:

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

Rules:

- Never commit `.env.local`, `.env`, Netlify env files, service role keys, database URLs, or access tokens.
- Keep `.env.example` as a blank template only.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side.
- `ALIPAY_APP_ID`, `ALIPAY_PRIVATE_KEY`, and `ALIPAY_PUBLIC_KEY` are provided by the merchant later through `.env.local` and Netlify environment variables.
- `ALIPAY_PRIVATE_KEY` and `ALIPAY_PUBLIC_KEY` must only be used server-side.
- `ALIPAY_GATEWAY_URL` should be `https://openapi.alipay.com/gateway.do` for production unless explicitly testing a sandbox gateway.
- Public browser code must never read card codes directly.
- Public browser code must not decide whether a customer can receive a card code.

## Source Layout

- `src/app`: App Router pages and route layouts.
- `src/app/page.tsx`: Homepage with announcement area and active product cards.
- `src/app/products`: Product list and product detail pages.
- `src/components/gemini-product-card.tsx`: Reusable AI product card component.
- `src/components/payment-panel.tsx`: Client payment/order/card-claim panel.
- `src/components/site-header.tsx`: Simple storefront header.
- `src/lib/actions.ts`: Server Actions for payment order creation and paid-order card fulfillment.
- `src/lib/alipay.ts`: Server-only Alipay SDK client, precreate order helper, QR generation, amount matching, and notify signature verification.
- `src/lib/data.ts`: AI product definitions and inventory read helpers.
- `src/lib/supabase`: Supabase browser/server/admin clients.
- `public/payments/alipay-qr.jpg`: Real Alipay payment QR code.
- `public/products`: Product icon assets.
- `public/tutorials`: Product recharge tutorial images.
- `supabase/migrations`: SQL schema migrations.

## Current Product Model

Active products are defined in `src/lib/data.ts` in `AI_PRODUCTS_BASE`.

Each product has:

- `slug`: stable product identifier used by routes and card inventory.
- `name`: display name.
- `price`: display and order amount.
- `image_url`: local product image.
- `recharge_url`: external recharge site.
- `tutorial_images`: local tutorial images.

Current product slugs:

- `gemini-pro-12-months`
- `chatgpt-plus-monthly`

When adding a new product:

1. Add the product definition in `AI_PRODUCTS_BASE`.
2. Add product image/tutorial assets under `public/`.
3. Insert card codes into `public.gemini_cards` with the matching `product_slug`.
4. Run `npm run lint` and `npm run build`.

## Database Notes

Public tables currently used by the active AI mall flow:

- `gemini_cards`: Card-code inventory for all AI products. Despite the table name, it now stores cards for multiple products using `product_slug`.
- `payment_orders`: Payment orders created before a customer scans Alipay.

Important card/order fields:

- `gemini_cards.product_slug`: Product inventory namespace.
- `gemini_cards.code`: The card code to deliver.
- `gemini_cards.status`: `available` or `sold`.
- `payment_orders.order_no`: Customer-facing order number.
- `payment_orders.status`: `pending`, `paid`, `fulfilled`, or `cancelled`.
- `payment_orders.card_code`: Delivered card after fulfillment.
- `payment_orders.alipay_trade_no`: Alipay trade number from callback/precreate when available.
- `payment_orders.alipay_qr_code`: Alipay dynamic QR code content returned by `alipay.trade.precreate`.
- `payment_orders.alipay_notify_payload`: Last verified Alipay callback payload for audit/debugging.

Important database functions:

- `claim_membership_card(product_slug)`: Legacy-style card claiming by product. Keep service-role only.
- `fulfill_paid_membership_order(order_no)`: Main secure fulfillment function. It only releases a card when the order status is `paid`.

Security and concurrency rules:

- RLS must remain enabled on `gemini_cards` and `payment_orders`.
- Do not add public anon/authenticated read policies to card-code tables.
- Card delivery must happen in the database function with row locks and `FOR UPDATE SKIP LOCKED`.
- Never implement card delivery by selecting an available code in frontend code.
- Never let a client-supplied `product_slug`, price, or status determine fulfillment without server/database validation.

## Payment Flow

The active payment flow uses official Alipay face-to-face payment precreate orders. A normal personal/static Alipay QR code does not provide an automatic payment callback and should not be used for automatic fulfillment.

Current secure flow:

1. Customer clicks "生成付款订单".
2. Server creates a `payment_orders` row with status `pending`.
3. Server calls Alipay `alipay.trade.precreate` with the local order number as `out_trade_no`.
4. The customer scans the dynamic Alipay QR code returned by Alipay.
5. Alipay posts to `/api/alipay/notify`.
6. The callback verifies the Alipay signature, app id, local order number, and amount before setting `payment_orders.status = 'paid'`.
7. Customer clicks "核验支付并领取卡密".
8. `fulfill_paid_membership_order(order_no)` checks the order status and releases one matching available card.

Rules:

- Pending, cancelled, missing, failed, or unpaid orders must not receive card codes.
- Do not reintroduce "I already paid" self-claim behavior that bypasses paid-order confirmation.
- Do not trust frontend redirects or client-supplied payment status.
- The Alipay callback must verify the signature with `checkNotifySignV2`, validate `app_id`, match `out_trade_no` to the local order, and compare the paid amount before marking an order as `paid`.
- The Alipay callback must not deliver card codes directly. Card delivery remains inside `fulfill_paid_membership_order(order_no)`.

## Legacy Code Notes

The repository still contains legacy clothing mall structures and tables such as:

- Supabase Auth pages and profile tables
- categories/products/cart/order tables
- admin route files
- registration table and PostgreSQL Pool helper

These are not part of the current customer-facing flow. Do not expand or rely on the old clothing/cart/auth flow unless the user explicitly asks to restore it.

## Frontend Guidelines

- Keep the UI simple, clean, and store-like.
- Use **小蒋AI商城** as the public site/store name and browser title unless the user requests another rebrand.
- The homepage should show the announcement area and active product cards, not a marketing-only landing page.
- The homepage announcement should tell customers these are virtual membership recharge card codes, to confirm they can follow the tutorial before ordering, to pay with Alipay and use the correct order number, that unpaid orders will not receive card codes, that issued card codes count as fulfilled and are non-refundable/non-exchangeable/no extra after-sales, and that after-sales/wholesale QQ is `3273203513` with the recommended bookmark `小蒋AI：https://ai-jiang.netlify.app`.
- Product cards should show product image, name, description, price, inventory, sold count, and an obvious purchase button.
- Product detail pages should show the product, recharge link, Alipay payment panel, and tutorial images.
- Use existing Tailwind conventions and local components before adding new abstractions.
- Use `lucide-react` for icons.
- Avoid decorative clutter and avoid text overflow on mobile.

## Deployment

Deployment target is Netlify.

Netlify configuration:

- `netlify.toml` is the deployment source of truth.
- Build command: `npm run build`.
- Publish directory: `.next`.
- Node version: `22`.

Workflow:

1. Commit code to Git.
2. Push to GitHub.
3. Import the GitHub repository in Netlify.
4. Add all required environment variables in Netlify Site configuration.
5. Deploy and test `/`, `/products`, product detail pages, payment order creation, and paid-order card fulfillment.

## Safety Checklist For Agents

- Do not overwrite user changes without checking `git status`.
- Do not commit ignored secrets.
- Do not run destructive git commands such as `git reset --hard` unless explicitly requested.
- Do not change production database schema without migration SQL or explicit user direction.
- After code changes, run `npm run lint` and `npm run build`.
- If touching payment/card-code logic, verify that unpaid orders cannot receive card codes.
- If pushing to GitHub, verify remote and branch before pushing.
