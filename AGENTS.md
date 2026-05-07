# AGENTS.md

## Project Overview

This repository is a Next.js full-stack clothing mall named **织选商城**. It includes a storefront, Supabase Auth login/register, cart, checkout with mock payment, orders, and admin pages for products, orders, and categories.

Core stack:

- Next.js App Router with TypeScript
- React 19
- Tailwind CSS
- Supabase Auth and Postgres
- `pg` PostgreSQL Pool for server-side registration form writes
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
```

Rules:

- Never commit `.env.local`, `.env`, Netlify env files, service role keys, database URLs, or access tokens.
- Keep `.env.example` as a blank template only.
- `DATABASE_URL` should point to the Supabase **Session Pooler** when possible.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side.
- Public browser code must use only public Supabase keys.

## Source Layout

- `src/app`: App Router pages and route layouts.
- `src/components`: Shared UI components.
- `src/lib/actions.ts`: Server Actions for auth, cart, orders, mock payment, and admin writes.
- `src/lib/postgres.ts`: Server-side PostgreSQL Pool and registration table writes.
- `src/lib/supabase`: Supabase browser/server/admin clients.
- `src/lib/data.ts`: Product/category read helpers with demo fallback data.
- `src/lib/mock-data.ts`: Local demo fallback products/categories.
- `supabase/migrations`: SQL schema and registration table migrations.

## Database Notes

Public tables currently used:

- `profiles`: user profile and role data.
- `registrations`: registration form submissions. Registration form data is saved here through backend PostgreSQL Pool writes.
- `categories`: product categories.
- `products`: clothing products.
- `cart_items`: user cart items.
- `orders`: order headers.
- `order_items`: order line items and product snapshots.

Database change rules:

- Prefer SQL migrations under `supabase/migrations`.
- If Supabase MCP is available, use it for schema inspection and applying migrations.
- Be careful with Chinese text on Windows shells. If writing seed data through scripts, ensure UTF-8 or Unicode-safe string handling so Chinese text does not become `????`.
- Do not store plaintext passwords in application tables. Passwords belong only to Supabase Auth.

## Auth And Permissions

- Regular registration uses Supabase Auth.
- Registration form metadata is also saved to `public.registrations`.
- Admin pages require `profiles.role = 'admin'`.
- Server-side admin writes may use `SUPABASE_SERVICE_ROLE_KEY`, but only after checking user/admin intent in the server action.
- RLS should remain enabled on user-facing tables.

## Frontend Guidelines

- Keep the UI clean and mall-like, inspired by Xiaomi Mall: white background, restrained colors, clear product cards, and responsive layouts.
- Do not add marketing-only landing pages unless requested. The first screen should remain a usable shopping experience.
- Use existing Tailwind conventions and local components before adding new abstractions.
- Use `lucide-react` for icons.
- Avoid decorative clutter and avoid text overflow on mobile.

## Deployment

Deployment target is Netlify. The project was moved to Netlify because Vercel registration/deployment was not available for the user.

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
5. Deploy and test `/`, `/products`, `/auth/login`, `/auth/register`, `/cart`, and checkout/order flows.

After deployment, add the generated Netlify domain to Supabase Auth URL settings:

- Supabase Authentication Site URL
- Supabase Authentication Redirect URLs

Use the generated `*.netlify.app` domain first, then bind a custom domain if needed.

## Safety Checklist For Agents

- Do not overwrite user changes without checking `git status`.
- Do not commit ignored secrets.
- Do not run destructive git commands such as `git reset --hard` unless explicitly requested.
- Do not change production database schema without migration SQL or explicit user direction.
- After code changes, run `npm run lint` and `npm run build`.
- If pushing to GitHub, verify remote and branch before pushing.
